import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { SampleStatus, SampleCollection } from '@hospital/database';
import { Like, ILike } from 'typeorm';

@Injectable()
export class SampleCollectionService {
    constructor(private readonly db: DatabaseService) {}

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
                collectedBy: true
            },
            order: { createdAt: 'ASC' }
        });

        if (existingSamples.length > 0) {
            return {
                initialized: true,
                billing,
                samples: existingSamples
            };
        }

        // If not initialized, return a preview
        return {
            initialized: false,
            billing,
            samples: billing.items.filter(item => item.test).map((item, index) => ({
                test: item.test,
                billingItem: item,
                sampleType: item.test?.sampleType || 'General',
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
                    sampleType: item.test!.sampleType || 'General'
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

    // Update Sample Status
    async updateStatus(sampleId: string, status: SampleStatus, userId: string, notes?: string) {
        const sampleRepo = this.db.repoSampleCollection();
        const sample = await sampleRepo.findOne({ where: { id: sampleId } });

        if (!sample) {
            throw new NotFoundException('Sample not found');
        }

        sample.status = status;
        if (status === SampleStatus.COLLECTED) {
            sample.collectedAt = new Date();
            sample.collectedById = userId;
        }
        
        if (notes !== undefined) {
            sample.notes = notes;
        }

        await sampleRepo.save(sample);
        return sampleRepo.findOne({
            where: { id: sampleId },
            relations: {
                test: true,
                patient: true,
                collectedBy: true
            }
        });
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
                collectedBy: true
            }
        });

        if (!sample) {
            throw new NotFoundException('Sample not found for barcode');
        }
        return sample;
    }
}
