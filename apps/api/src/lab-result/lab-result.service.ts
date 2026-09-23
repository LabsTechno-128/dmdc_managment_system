import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { LabResultStatus, SampleStatus, LabResult, TestParameter, ParameterResult, LabTest, Billing, SampleCollection } from '@hospital/database';
import { In } from 'typeorm';

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

        if (sample.status !== SampleStatus.COLLECTED) {
            throw new BadRequestException('Cannot enter result for an uncollected sample');
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
                remarks,
                performedById,
                performedAt: new Date()
            });
            labResult = await this.databaseService.repoLabResult().save(labResult);
        } else {
            labResult.status = status;
            if (remarks) labResult.remarks = remarks;
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
            result.remarks = remarks;
        }

        return this.databaseService.repoLabResult().save(result);
    }
}
