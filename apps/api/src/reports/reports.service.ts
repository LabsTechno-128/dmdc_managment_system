import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Report, ReportStatus, LabResultStatus } from '@hospital/database';

@Injectable()
export class ReportsService {
    constructor(private readonly databaseService: DatabaseService) { }

    async findAll(page: number = 1, limit: number = 10) {
        const [data, total] = await this.databaseService.repoReport().findAndCount({
            relations: { patient: true, labResult: { test: true } },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            }
        };
    }

    async findOne(id: string) {
        return this.databaseService.repoReport().findOne({
            where: { id },
            relations: { patient: true, labResult: { test: true } }
        });
    }

    async update(id: string, data: Partial<Report>) {
        await this.databaseService.repoReport().update(id, data);
        return this.findOne(id);
    }

    async markDelivered(id: string) {
        await this.databaseService.repoReport().update(id, { isDelivered: true, status: ReportStatus.PUBLISHED });
        return this.findOne(id);
    }

    async finalizeReport(labResultId: string) {
        const labResult = await this.databaseService.repoLabResult().findOne({
            where: { id: labResultId },
            relations: { patient: true, test: true, sample: true, parameterResults: { testParameter: true } }
        });

        if (!labResult) throw new NotFoundException('Lab Result not found');
        if (labResult.status !== LabResultStatus.VERIFIED) {
            throw new BadRequestException('Can only finalize reports for verified lab results');
        }

        let report = await this.databaseService.repoReport().findOne({
            where: { labResultId }
        });

        // We stringify the parameter results as the baseline reportData
        const reportDataSnapshot = JSON.stringify({
            parameterResults: labResult.parameterResults,
            remarks: labResult.remarks
        });

        if (!report) {
            report = this.databaseService.repoReport().create({
                patientId: labResult.patientId,
                labResultId: labResult.id,
                reportData: reportDataSnapshot,
                status: ReportStatus.FINALIZED
            });
        } else {
            report.reportData = reportDataSnapshot;
            report.status = ReportStatus.FINALIZED;
        }

        return this.databaseService.repoReport().save(report);
    }

    async publishReport(id: string) {
        const report = await this.findOne(id);
        if (!report) throw new NotFoundException('Report not found');

        if (report.status !== ReportStatus.FINALIZED) {
            throw new BadRequestException('Only finalized reports can be published');
        }

        report.status = ReportStatus.PUBLISHED;
        report.isDelivered = true;
        return this.databaseService.repoReport().save(report);
    }

    async getPrintData(id: string) {
        const report = await this.databaseService.repoReport().findOne({
            where: { id },
            relations: {
                patient: true,
                labResult: {
                    test: true,
                    sample: true,
                    performedBy: true,
                    verifiedBy: true,
                    billing: {
                        items: { test: true }
                    }
                }
            }
        });

        if (!report) throw new NotFoundException('Report not found');
        return report;
    }
}
