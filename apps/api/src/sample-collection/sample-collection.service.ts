import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { SampleStatus, SampleCollection, SampleCollectionItem } from '@hospital/database';
import { Like, ILike } from 'typeorm';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class SampleCollectionService {
    constructor(
        private readonly db: DatabaseService,
        private readonly inventoryService: InventoryService
    ) { }

    // Search Billings for Sample Collection
    async searchBillings(query: string) {
        const billingRepo = this.db.repoBilling();

        let whereCondition: any = {};
        if (query) {
            whereCondition = [
                { billNumber: ILike(`%${query}%`) },
                { patient: { patientId: ILike(`%${query}%`) } },
                { patient: { name: ILike(`%${query}%`) } }
            ];
        }

        const billings = await billingRepo.find({
            where: whereCondition,
            relations: {
                patient: true,
                items: {
                    test: true
                }
            },
            order: { createdAt: 'DESC' },
            take: 20
        });

        return billings;
    }

    // Get samples for a billing (or preview what would be generated)
    async getSamplesForBilling(billingId: string) {
        const billingRepo = this.db.repoBilling();
        const sampleRepo = this.db.repoSampleCollection();

        const billing = await billingRepo.findOne({
            where: { id: billingId },
            relations: {
                patient: true,
                items: {
                    test: true
                }
            }
        });

        if (!billing) {
            throw new NotFoundException('Billing not found');
        }

        // Check if samples exist
        const existingSamples = await sampleRepo.find({
            where: { billingId: billing.id },
            relations: {
                test: true,
                patient: true,
                collectedBy: true,
                inventoryItems: {
                    item: true
                }
            },
            order: { createdAt: 'ASC' }
        });

        if (existingSamples.length > 0) {
            return {
                initialized: true,
                billing,
                samples: existingSamples.map((s) => ({
                    ...s,
                    sampleType: s.notes && s.notes.trim() ? s.notes.trim() : 'General',
                }))
            };
        }

        // If not initialized, return a preview
        return {
            initialized: false,
            billing,
            samples: billing.items.filter(item => item.test).map((item, index) => ({
                test: item.test,
                billingItem: item,
                sampleType: 'General',
                status: SampleStatus.PENDING,
                barcodePreview: `${billing.patient.patientId || 'P'}-${billing.billNumber || 'INV'}-S${String(index + 1).padStart(2, '0')}`
            }))
        };
    }

    // Initialize sample collections for a billing
    async initializeSamples(billingId: string) {
        const billingRepo = this.db.repoBilling();

        const billing = await billingRepo.findOne({
            where: { id: billingId },
            relations: {
                patient: true,
                items: {
                    test: true
                }
            }
        });

        if (!billing) {
            throw new NotFoundException('Billing not found');
        }

        if (billing.paymentStatus === 'Unpaid') {
            throw new BadRequestException('Cannot initialize sample collection for Unpaid billings.');
        }

        const validItems = billing.items.filter(item => item.test);
        if (validItems.length === 0) {
            throw new BadRequestException('No lab tests found in this billing to collect samples for.');
        }

        const queryRunner = this.db.getDataSource().createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction('SERIALIZABLE');

        try {
            const count = await queryRunner.manager.count(SampleCollection, { where: { billingId: billing.id } });
            if (count > 0) {
                throw new BadRequestException('Samples for this billing are already initialized');
            }

            const samplesToCreate = validItems.map((item, index) => {
                const barcode = `${billing.patient.patientId || 'P'}-${billing.billNumber || 'INV'}-S${String(index + 1).padStart(2, '0')}`;

                return queryRunner.manager.create(SampleCollection, {
                    billingId: billing.id,
                    billingItemId: item.id,
                    patientId: billing.patientId,
                    testId: item.test!.id,
                    barcode: barcode,
                    status: SampleStatus.PENDING,
                    sampleType: 'General'
                });
            });

            await queryRunner.manager.save(samplesToCreate);
            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }

        return await this.getSamplesForBilling(billingId);
    }

    // Update Sample Status and record item usage / deduct stock
    async updateStatus(
        sampleId: string,
        status: SampleStatus,
        userId: string,
        notes?: string,
        items?: Array<{ itemId: string; quantity: number }>
    ) {
        // Validate items input format if provided
        const aggregatedItems = new Map<string, number>();
        if (items && items.length > 0) {
            if (status !== SampleStatus.COLLECTED) {
                throw new BadRequestException('Inventory items can only be deducted when sample is collected.');
            }
            for (const item of items) {
                if (!item.itemId || typeof item.itemId !== 'string' || item.itemId.trim() === '') {
                    throw new BadRequestException('Invalid inventory item identifier.');
                }
                const qty = Number(item.quantity);
                if (!Number.isInteger(qty) || qty <= 0) {
                    throw new BadRequestException('Item quantity must be a positive whole number.');
                }
                aggregatedItems.set(item.itemId, (aggregatedItems.get(item.itemId) || 0) + qty);
            }
        }

        const queryRunner = this.db.getDataSource().createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const sample = await queryRunner.manager.findOne(SampleCollection, {
                where: { id: sampleId },
                relations: {
                    test: true,
                    patient: true,
                    inventoryItems: {
                        item: true
                    }
                }
            });

            if (!sample) {
                throw new NotFoundException('Sample not found');
            }

            // Allow logging equipment if already COLLECTED (e.g. phlebotomist adding supplies used):
            if (status === SampleStatus.COLLECTED && sample.status === SampleStatus.COLLECTED) {
                if (aggregatedItems.size > 0) {
                    for (const [itemId, quantity] of aggregatedItems.entries()) {
                        await this.inventoryService.deductStockWithManager(queryRunner.manager, {
                            itemId,
                            quantity,
                            department: 'Sample Collection',
                            notes: `Sample collection (${sample.barcode})${notes ? ': ' + notes : ''}`,
                            usedById: userId,
                            usageDate: new Date()
                        });

                        const scItem = queryRunner.manager.create(SampleCollectionItem, {
                            sampleCollectionId: sample.id,
                            itemId,
                            quantity
                        });
                        await queryRunner.manager.save(scItem);
                    }
                }
                // If updating notes on an already collected sample
                if (notes !== undefined) {
                    const trimmedNotes = typeof notes === 'string' ? notes.trim() : '';
                    await queryRunner.manager.update(SampleCollection, sample.id, {
                        notes: (trimmedNotes || null) as any,
                        sampleType: trimmedNotes ? trimmedNotes.slice(0, 100) : 'General',
                    });
                }
                await queryRunner.commitTransaction();
                return await this.getSampleWithRelations(sampleId);
            }

            // If transitioning to COLLECTED and items are used:
            if (status === SampleStatus.COLLECTED && aggregatedItems.size > 0) {
                for (const [itemId, quantity] of aggregatedItems.entries()) {
                    // Deduct stock using InventoryService inside this transaction
                    await this.inventoryService.deductStockWithManager(queryRunner.manager, {
                        itemId,
                        quantity,
                        department: 'Sample Collection',
                        notes: `Sample collection (${sample.barcode})${notes ? ': ' + notes : ''}`,
                        usedById: userId,
                        usageDate: new Date()
                    });

                    // Record item usage in SampleCollectionItem
                    const scItem = queryRunner.manager.create(SampleCollectionItem, {
                        sampleCollectionId: sample.id,
                        itemId,
                        quantity
                    });
                    await queryRunner.manager.save(scItem);
                }
            }

            const finalNotes =
                notes !== undefined
                    ? (typeof notes === 'string' ? notes.trim() : '')
                    : (sample.notes ? sample.notes.trim() : '');
            const finalSampleType = finalNotes ? finalNotes.slice(0, 100) : 'General';

            // Update sample fields directly via update() to prevent TypeORM relation overwrite
            await queryRunner.manager.update(SampleCollection, sample.id, {
                status,
                collectedAt: status === SampleStatus.COLLECTED ? new Date() : sample.collectedAt,
                collectedById: status === SampleStatus.COLLECTED ? userId : sample.collectedById,
                notes: (finalNotes || null) as any,
                sampleType: finalSampleType,
            });

            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }

        return await this.getSampleWithRelations(sampleId);
    }

    private async getSampleWithRelations(sampleId: string) {
        const sample = await this.db.repoSampleCollection().findOne({
            where: { id: sampleId },
            relations: {
                test: true,
                patient: true,
                collectedBy: true,
                inventoryItems: {
                    item: true
                }
            }
        });
        if (!sample) return null;
        return {
            ...sample,
            sampleType: sample.notes && sample.notes.trim() ? sample.notes.trim() : 'General',
        };
    }

    // Find sample by barcode
    async getSampleByBarcode(barcode: string) {
        const sampleRepo = this.db.repoSampleCollection();
        const sample = await sampleRepo.findOne({
            where: { barcode },
            relations: {
                test: true,
                patient: true,
                billing: true,
                collectedBy: true,
                inventoryItems: {
                    item: true
                }
            }
        });

        if (!sample) {
            throw new NotFoundException('Sample not found for barcode');
        }
        return sample;
    }
}
