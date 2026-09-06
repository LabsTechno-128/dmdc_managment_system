import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { LabResultStatus, SampleStatus, LabResult, ResultTemplate, LabTest, Billing, SampleCollection } from '@hospital/database';
import { In } from 'typeorm';

@Injectable()
export class LabResultService implements OnModuleInit {
    constructor(private readonly databaseService: DatabaseService) {}

    async onModuleInit() {
        await this.seedTemplates();
    }

    private async seedTemplates() {
        const repoTest = this.databaseService.repoLabTest();
        const repoTemplate = this.databaseService.repoResultTemplate();

        const defaultTemplates = [
            {
                name: 'CBC',
                fields: [
                    { name: 'Hemoglobin', type: 'number', unit: 'g/dL', referenceRange: '13.0 - 17.0', required: true },
                    { name: 'WBC', type: 'number', unit: '/µL', referenceRange: '4,000 - 11,000', required: true },
                    { name: 'RBC', type: 'number', unit: 'million/µL', referenceRange: '4.5 - 5.5', required: true },
                    { name: 'Platelet', type: 'number', unit: '/µL', referenceRange: '150,000 - 450,000', required: true }
                ]
            },
            {
                name: 'Blood Sugar',
                fields: [
                    { name: 'Glucose', type: 'number', unit: 'mg/dL', referenceRange: '70 - 99', required: true }
                ]
            },
            {
                name: 'Urine R/E',
                fields: [
                    { name: 'Color', type: 'select', options: ['Pale Yellow', 'Yellow', 'Amber', 'Red'], required: true },
                    { name: 'Appearance', type: 'select', options: ['Clear', 'Hazy', 'Cloudy', 'Turbid'], required: true },
                    { name: 'Protein', type: 'select', options: ['Nil', 'Trace', '+', '++', '+++'], required: true },
                    { name: 'Glucose', type: 'select', options: ['Nil', 'Trace', '+', '++', '+++'], required: true },
                    { name: 'RBC', type: 'number', unit: '/HPF', referenceRange: '0 - 2', required: false },
                    { name: 'WBC', type: 'number', unit: '/HPF', referenceRange: '0 - 5', required: false }
                ]
            }
        ];

        for (const t of defaultTemplates) {
            // Find existing test by name or create it
            let test = await repoTest.findOne({ where: { name: t.name } });
            if (!test) {
                test = repoTest.create({ name: t.name, billRate: 500 });
                test = await repoTest.save(test);
            }
            
            let template = await repoTemplate.findOne({ where: { testId: test.id } });
            if (!template) {
                template = repoTemplate.create({ testId: test.id, fields: t.fields });
                await repoTemplate.save(template);
            }
        }
    }

    async getTestsByBillingId(billingId: string) {
        const billing = await this.databaseService.repoBilling().findOne({
            where: { id: billingId },
            relations: { items: { test: true }, patient: true }
        });

        if (!billing) {
            throw new NotFoundException('Billing not found');
        }

        // Get samples for this billing
        const samples = await this.databaseService.repoSampleCollection().find({
            where: { billingId }
        });

        // Get lab results for this billing
        const results = await this.databaseService.repoLabResult().find({
            where: { billingId }
        });

        // Combine test, sample, and result status
        const testsWithStatus = billing.items.map(item => {
            const sample = samples.find(s => s.testId === item.testId);
            const result = results.find(r => r.testId === item.testId);
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
            where: { sampleId: sample.id }
        });

        return { sample, result };
    }

    async getTemplateByTestId(testId: number) {
        const template = await this.databaseService.repoResultTemplate().findOne({
            where: { testId }
        });

        if (!template) {
            // Return empty template if none configured
            return { fields: [] };
        }
        return template;
    }

    async upsertResult(sampleId: string, resultData: any, status: LabResultStatus, remarks: string, performedById: string) {
        const sample = await this.databaseService.repoSampleCollection().findOne({
            where: { id: sampleId }
        });

        if (!sample) throw new NotFoundException('Sample not found');
        
        if (sample.status !== SampleStatus.COLLECTED) {
            throw new BadRequestException('Cannot enter result for an uncollected sample');
        }

        let labResult = await this.databaseService.repoLabResult().findOne({
            where: { sampleId }
        });

        if (labResult && labResult.status === LabResultStatus.VERIFIED) {
            throw new BadRequestException('Result is already verified and cannot be modified');
        }

        if (status === LabResultStatus.COMPLETED) {
            // Validate required fields
            const template = await this.getTemplateByTestId(sample.testId);
            const fields: any[] = template.fields || [];
            for (const field of fields) {
                if (field.required && (resultData[field.name] === undefined || resultData[field.name] === null || resultData[field.name] === '')) {
                    throw new BadRequestException(`Field ${field.name} is required to submit result`);
                }
            }
        }

        if (!labResult) {
            labResult = this.databaseService.repoLabResult().create({
                billingId: sample.billingId,
                testId: sample.testId,
                sampleId: sample.id,
                patientId: sample.patientId,
                resultData,
                status,
                remarks,
                performedById,
                performedAt: new Date()
            });
        } else {
            labResult.resultData = resultData;
            labResult.status = status;
            if (remarks) labResult.remarks = remarks;
            labResult.performedById = performedById;
            labResult.performedAt = new Date();
        }

        return this.databaseService.repoLabResult().save(labResult);
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
}
