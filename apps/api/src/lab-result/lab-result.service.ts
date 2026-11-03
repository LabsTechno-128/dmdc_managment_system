import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { LabResultStatus, SampleStatus, LabResult, TestParameter, ParameterResult, LabTest, Billing, SampleCollection } from '@hospital/database';
import { In } from 'typeorm';
import { sanitizeRichTextHtml, processAiTextTransformation, checkAiRateLimit, type AiAssistRequest } from './rich-text-ai.helper';

@Injectable()
export class LabResultService implements OnModuleInit {
    constructor(private readonly databaseService: DatabaseService) { }

    async onModuleInit() {
        await this.seedTemplates();
    }

    private async seedTemplates() {
        // Will implement via API instead of hardcoded seeder.
    }

    async getTestsByBillingId(billingId: string) {
        // Detect if the input is a bill number (e.g., BILL-...) or a UUID
        const isBillNumber = billingId.startsWith('BILL-') || !billingId.includes('-');
        const whereCondition = isBillNumber ? { billNumber: billingId } : { id: billingId };

        const billing = await this.databaseService.repoBilling().findOne({
            where: whereCondition,
            relations: { items: { test: true }, patient: true }
        });

        if (!billing) {
            throw new NotFoundException('Billing not found');
        }

        // Get samples for this billing
        const samples = await this.databaseService.repoSampleCollection().find({
            where: { billingId: billing.id }
        });

        // Get lab results for this billing
        const results = await this.databaseService.repoLabResult().find({
            where: { billingId: billing.id },
            relations: { parameterResults: { testParameter: true } }
        });

        // Combine test, sample, and result status
        const testsWithStatus = billing.items.map(item => {
            const sample = samples.find(s => s.billingItemId === item.id) || samples.find(s => s.testId === item.testId);
            const result = sample ? results.find(r => r.sampleId === sample.id) : null;
            return {
                billingItemId: item.id,
                test: item.test,
                sample: sample || null,
                result: result || null
            };
        });

        return {
            billing,
            tests: testsWithStatus
        };
    }

    /**
     * Ensures every lab-test item of a billing has a sample record so results can be
     * entered directly (e.g. tests that don't require sample collection).
     * Missing samples are created as PENDING using the standard barcode scheme.
     */
    async ensureSamplesForBilling(billingId: string) {
        const billing = await this.databaseService.repoBilling().findOne({
            where: { id: billingId },
            relations: { items: { test: true }, patient: true }
        });

        if (!billing) {
            throw new NotFoundException('Billing not found');
        }

        const sampleRepo = this.databaseService.repoSampleCollection();
        const existing = await sampleRepo.find({ where: { billingId: billing.id } });
        const validItems = billing.items.filter(item => item.test);

        const toCreate: SampleCollection[] = [];
        for (let index = 0; index < validItems.length; index++) {
            const item = validItems[index];
            const hasSample = existing.some(s => s.billingItemId === item.id)
                || existing.some(s => !s.billingItemId && s.testId === item.testId);
            if (hasSample) continue;

            const baseBarcode = `${billing.patient?.patientId || 'P'}-${billing.billNumber || 'INV'}-S${String(index + 1).padStart(2, '0')}`;
            let barcode = baseBarcode;
            let suffix = 1;
            while (await sampleRepo.exists({ where: { barcode }, withDeleted: true })) {
                barcode = `${baseBarcode}-${suffix++}`;
            }

            toCreate.push(sampleRepo.create({
                billingId: billing.id,
                billingItemId: item.id,
                patientId: billing.patientId,
                testId: item.test!.id,
                barcode,
                status: SampleStatus.PENDING,
                sampleType: 'General'
            }));
        }

        if (toCreate.length > 0) {
            await sampleRepo.save(toCreate);
        }

        return this.getTestsByBillingId(billing.id);
    }

    async getByBarcode(barcode: string) {
        const sample = await this.databaseService.repoSampleCollection().findOne({
            where: { barcode },
            relations: { billing: { patient: true }, test: true, patient: true }
        });

        if (!sample) {
            throw new NotFoundException('Sample barcode not found');
        }

        let result = await this.databaseService.repoLabResult().findOne({
            where: { sampleId: sample.id },
            relations: { parameterResults: { testParameter: true } }
        });

        return { sample, result };
    }

    async getTemplateByTestId(testId: number) {
        // Obsolete
        return { fields: [] };
    }

    // resultData is expected to be an array: { testParameterId: string, resultValue: string }[]
    async upsertResult(sampleId: string, resultData: any[], status: LabResultStatus, remarks: string, performedById: string) {
        const sample = await this.databaseService.repoSampleCollection().findOne({
            where: { id: sampleId }
        });

        if (!sample) throw new NotFoundException('Sample not found');

        // Sample collection is not mandatory: some tests don't need a collected sample.
        if (sample.status === SampleStatus.REJECTED) {
            throw new BadRequestException('Cannot enter result for a rejected sample');
        }

        let labResult = await this.databaseService.repoLabResult().findOne({
            where: { sampleId },
            relations: { parameterResults: true }
        });

        if (labResult && labResult.status === LabResultStatus.VERIFIED) {
            throw new BadRequestException('Result is already verified and cannot be modified');
        }

        const parameters = await this.databaseService.repoTestParameter().find({
            where: { testId: sample.testId, isActive: true }
        });

        if (status === LabResultStatus.COMPLETED) {
            // Validate required fields
            for (const param of parameters) {
                if (param.isRequired) {
                    const entered = resultData.find(r => r.testParameterId === param.id);
                    if (!entered || entered.resultValue === undefined || entered.resultValue === null || entered.resultValue === '') {
                        throw new BadRequestException(`Field ${param.name} is required to submit result`);
                    }
                }
            }
        }

        if (!labResult) {
            labResult = this.databaseService.repoLabResult().create({
                billingId: sample.billingId,
                testId: sample.testId,
                sampleId: sample.id,
                patientId: sample.patientId,
                status,
                remarks: remarks !== undefined ? sanitizeRichTextHtml(remarks) : '',
                performedById,
                performedAt: new Date()
            });
            labResult = await this.databaseService.repoLabResult().save(labResult);
        } else {
            labResult.status = status;
            if (remarks !== undefined) labResult.remarks = sanitizeRichTextHtml(remarks);
            labResult.performedById = performedById;
            labResult.performedAt = new Date();
            labResult = await this.databaseService.repoLabResult().save(labResult);
        }

        // Save parameter results
        for (const data of resultData) {
            let pr = await this.databaseService.repoParameterResult().findOne({
                where: { labResultId: labResult.id, testParameterId: data.testParameterId }
            });

            if (!pr) {
                pr = this.databaseService.repoParameterResult().create({
                    labResultId: labResult.id,
                    testParameterId: data.testParameterId,
                    resultValue: data.resultValue,
                    enteredById: performedById,
                    enteredAt: new Date()
                });
            } else {
                pr.resultValue = data.resultValue;
                pr.updatedById = performedById;
            }
            await this.databaseService.repoParameterResult().save(pr);
        }

        return labResult;
    }

    async recollectSample(sampleId: string) {
        const sample = await this.databaseService.repoSampleCollection().findOne({
            where: { id: sampleId }
        });

        if (!sample) throw new NotFoundException('Sample not found');

        sample.status = SampleStatus.RECOLLECTION_REQUIRED;
        await this.databaseService.repoSampleCollection().save(sample);

        // Optionally, update result status to REJECTED if it exists
        const result = await this.databaseService.repoLabResult().findOne({
            where: { sampleId }
        });

        if (result) {
            result.status = LabResultStatus.REJECTED;
            await this.databaseService.repoLabResult().save(result);
        }

        return sample;
    }

    async getPendingReview() {
        return this.databaseService.repoLabResult().find({
            where: { status: LabResultStatus.COMPLETED },
            relations: { sample: true, patient: true, test: true, performedBy: true, parameterResults: { testParameter: true } },
            order: { updatedAt: 'DESC' }
        });
    }

    async verifyResult(sampleId: string, verifiedById: string) {
        const result = await this.databaseService.repoLabResult().findOne({
            where: { sampleId }
        });

        if (!result) throw new NotFoundException('Result not found');
        if (result.status !== LabResultStatus.COMPLETED) {
            throw new BadRequestException('Only completed results can be verified');
        }

        result.status = LabResultStatus.VERIFIED;
        result.verifiedById = verifiedById;
        result.verifiedAt = new Date();

        await this.databaseService.repoLabResult().save(result);

        // Snapshot all parameters at the time of verification
        const parameterResults = await this.databaseService.repoParameterResult().find({
            where: { labResultId: result.id },
            relations: { testParameter: true }
        });

        for (const pr of parameterResults) {
            const param = pr.testParameter;
            if (param) {
                pr.snapshotParameterName = param.name;
                pr.snapshotUnit = param.unit;
                pr.snapshotReferenceValue = param.referenceValue;
                pr.snapshotDataType = param.dataType;
                pr.snapshotDisplayOrder = param.displayOrder;
                pr.snapshotGroup = param.group;
                pr.snapshotIsSubItem = param.isSubItem;
                await this.databaseService.repoParameterResult().save(pr);
            }
        }

        return result;
    }

    async rejectResult(sampleId: string, remarks: string) {
        const result = await this.databaseService.repoLabResult().findOne({
            where: { sampleId }
        });

        if (!result) throw new NotFoundException('Result not found');
        if (result.status !== LabResultStatus.COMPLETED) {
            throw new BadRequestException('Only completed results can be rejected');
        }

        result.status = LabResultStatus.REJECTED;
        if (remarks) {
            result.remarks = sanitizeRichTextHtml(remarks);
        }

        return this.databaseService.repoLabResult().save(result);
    }

    async aiAssist(payload: AiAssistRequest, userId: string) {
        checkAiRateLimit(userId);
        return processAiTextTransformation(payload);
    }
}
