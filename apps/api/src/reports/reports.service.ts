import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Report, ReportStatus, LabResultStatus, Billing } from '@hospital/database';
import { In } from 'typeorm';

@Injectable()
export class ReportsService {
    constructor(private readonly databaseService: DatabaseService) { }

    private formatDoctorName(billing?: Billing | null): string {
        if (!billing) return 'Self';
        if (billing.referredByDoctor) {
            const doc = billing.referredByDoctor;
            const name = `Dr. ${doc.firstName || ''} ${doc.lastName || ''}`.trim();
            const spec = doc.specialization ? ` (${doc.specialization})` : '';
            if (billing.referredBy && billing.referredBy.trim()) {
                const refText = billing.referredBy.trim();
                return spec && !refText.toLowerCase().includes(spec.toLowerCase())
                    ? `${refText}${spec}`
                    : refText;
            }
            return `${name}${spec}` || 'Self';
        }
        if (billing.referredBy && billing.referredBy.trim()) {
            return billing.referredBy.trim();
        }
        return 'Self';
    }

    async findAll(page: number = 1, limit: number = 10, search?: string) {
        const qb = this.databaseService.repoReport().createQueryBuilder('report')
            .innerJoin('report.patient', 'patient')
            .leftJoin('report.labResult', 'labResult')
            .leftJoin('labResult.billing', 'billing')
            .leftJoin('labResult.test', 'test');

        if (search && search.trim()) {
            const term = `%${search.trim().toLowerCase()}%`;
            qb.where(
                '(LOWER(patient.name) LIKE :term OR LOWER(patient.patientId) LIKE :term OR LOWER(billing.billNumber) LIKE :term OR LOWER(test.name) LIKE :term)',
                { term }
            );
        }

        // Group by patientId AND billingId (or report.id if unbilled)
        // This ensures the same patient on different dates/bills are displayed as separate entries,
        // while multiple tests for the same patient on the same date/bill transaction are consolidated.
        const rawGrouped = await qb
            .select('report.patientId', 'patientId')
            .addSelect('labResult.billingId', 'billingId')
            .addSelect('MAX(report.createdAt)', 'latestCreatedAt')
            .addSelect('MAX(CAST(report.id AS text))', 'primaryReportId')
            .groupBy('report.patientId')
            .addGroupBy('labResult.billingId')
            .orderBy('MAX(report.createdAt)', 'DESC')
            .getRawMany();

        const total = rawGrouped.length;
        const pagedGroup = rawGrouped.slice((page - 1) * limit, page * limit);

        if (pagedGroup.length === 0) {
            return {
                data: [],
                meta: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit) || 1,
                }
            };
        }

        const pagedBillingIds = pagedGroup.map(g => g.billingId).filter(Boolean);
        const pagedPatientIds = pagedGroup.map(g => g.patientId);
        const nullBillingReportIds = pagedGroup.filter(g => !g.billingId).map(g => g.primaryReportId);

        const whereConditions: any[] = [];
        const reportQb = this.databaseService.repoReport().createQueryBuilder('report')
            .leftJoinAndSelect('report.patient', 'patient')
            .leftJoinAndSelect('report.labResult', 'labResult')
            .leftJoinAndSelect('labResult.test', 'test')
            .leftJoinAndSelect('labResult.sample', 'sample')
            .leftJoinAndSelect('labResult.performedBy', 'performedBy')
            .leftJoinAndSelect('labResult.verifiedBy', 'verifiedBy')
            .leftJoinAndSelect('labResult.billing', 'billing')
            .leftJoinAndSelect('billing.referredByDoctor', 'referredByDoctor');

        if (pagedBillingIds.length > 0 && nullBillingReportIds.length > 0) {
            reportQb.where('(labResult.billingId IN (:...pagedBillingIds) OR report.id IN (:...nullBillingReportIds))', {
                pagedBillingIds,
                nullBillingReportIds
            });
        } else if (pagedBillingIds.length > 0) {
            reportQb.where('labResult.billingId IN (:...pagedBillingIds)', { pagedBillingIds });
        } else if (nullBillingReportIds.length > 0) {
            reportQb.where('report.id IN (:...nullBillingReportIds)', { nullBillingReportIds });
        } else {
            reportQb.where('report.patientId IN (:...pagedPatientIds)', { pagedPatientIds });
        }

        const allReports = await reportQb.orderBy('report.createdAt', 'DESC').getMany();

        // Also retrieve all lab_results for paged bills so all tests for a visit appear in the listing
        let allBillingLabResults: any[] = [];
        if (pagedBillingIds.length > 0) {
            allBillingLabResults = await this.databaseService.repoLabResult().find({
                where: { billingId: In(pagedBillingIds) },
                relations: {
                    test: true,
                    sample: true,
                    performedBy: true,
                    verifiedBy: true,
                }
            });
        }

        const data = pagedGroup.map((groupItem) => {
            const groupReports = allReports.filter(r => {
                if (groupItem.billingId) {
                    return r.labResult?.billingId === groupItem.billingId && r.patientId === groupItem.patientId;
                }
                return r.id === groupItem.primaryReportId || (r.patientId === groupItem.patientId && !r.labResult?.billingId);
            });

            const primaryReport = groupReports.find(r => r.id === groupItem.primaryReportId) || groupReports[0];
            const patient = primaryReport?.patient;
            const billing = primaryReport?.labResult?.billing;
            const billNumber = billing?.billNumber || 'N/A';
            const docName = this.formatDoctorName(billing);

            const tests = groupReports
                .filter(r => r.labResult?.test)
                .map(r => ({
                    reportId: r.id,
                    testId: r.labResult!.test.id,
                    testName: r.labResult!.test.name,
                    department: r.labResult!.test.department,
                    sampleBarcode: r.labResult?.sample?.barcode || '',
                    sampleCollectedAt: r.labResult?.sample?.collectedAt,
                    performedBy: r.labResult?.performedBy ? {
                        id: r.labResult.performedBy.id,
                        firstName: r.labResult.performedBy.firstName,
                        lastName: r.labResult.performedBy.lastName,
                    } : null,
                    verifiedBy: r.labResult?.verifiedBy ? {
                        id: r.labResult.verifiedBy.id,
                        firstName: r.labResult.verifiedBy.firstName,
                        lastName: r.labResult.verifiedBy.lastName,
                    } : null,
                    isDelivered: r.isDelivered,
                    isVerified: r.labResult?.status === LabResultStatus.VERIFIED,
                    status: r.status,
                    labResultStatus: r.labResult?.status,
                }));

            // Merge any lab results for this billing that don't yet have an explicit report entry
            if (groupItem.billingId) {
                const groupBillingLrs = allBillingLabResults.filter(lr => lr.billingId === groupItem.billingId);
                for (const lr of groupBillingLrs) {
                    if (lr.test && !tests.some(t => t.testId === lr.test.id)) {
                        tests.push({
                            reportId: primaryReport?.id || '',
                            testId: lr.test.id,
                            testName: lr.test.name,
                            department: lr.test.department,
                            sampleBarcode: lr.sample?.barcode || '',
                            sampleCollectedAt: lr.sample?.collectedAt,
                            performedBy: lr.performedBy ? {
                                id: lr.performedBy.id,
                                firstName: lr.performedBy.firstName,
                                lastName: lr.performedBy.lastName,
                            } : null,
                            verifiedBy: lr.verifiedBy ? {
                                id: lr.verifiedBy.id,
                                firstName: lr.verifiedBy.firstName,
                                lastName: lr.verifiedBy.lastName,
                            } : null,
                            isDelivered: false,
                            isVerified: lr.status === LabResultStatus.VERIFIED,
                            status: lr.status === LabResultStatus.VERIFIED ? ReportStatus.FINALIZED : ReportStatus.UNDER_REVIEW,
                            labResultStatus: lr.status,
                        });
                    }
                }
            }

            const allDelivered = groupReports.length > 0 && groupReports.every(r => r.isDelivered);
            const isFullyVerified = groupReports.length > 0 && groupReports.every(r => r.labResult?.status === LabResultStatus.VERIFIED);
            const anyVerified = groupReports.some(r => r.labResult?.status === LabResultStatus.VERIFIED);

            return {
                id: primaryReport?.id,
                patientId: patient?.patientId || groupItem.patientId,
                billingId: groupItem.billingId,
                billNumber: billNumber,
                patient: patient,
                date: primaryReport?.createdAt,
                createdAt: primaryReport?.createdAt,
                updatedAt: primaryReport?.updatedAt,
                tests: tests,
                totalTests: tests.length,
                referringDoctorName: docName,
                isDelivered: allDelivered,
                isFullyVerified: isFullyVerified,
                reviewStatus: isFullyVerified ? 'Verified' : anyVerified ? 'Partially Verified' : 'Pending Review',
                status: allDelivered ? ReportStatus.PUBLISHED : isFullyVerified ? ReportStatus.FINALIZED : ReportStatus.UNDER_REVIEW,
                reportIds: groupReports.map(r => r.id),
                labResult: primaryReport?.labResult
            };
        });

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit) || 1,
            }
        };
    }

    async findOne(id: string) {
        return this.databaseService.repoReport().findOne({
            where: { id },
            relations: {
                patient: true,
                labResult: {
                    test: true,
                    sample: true,
                    billing: {
                        referredByDoctor: true
                    }
                }
            }
        });
    }

    async update(id: string, data: Partial<Report>) {
        await this.databaseService.repoReport().update(id, data);
        return this.findOne(id);
    }

    async markDelivered(id: string) {
        const report = await this.findOne(id);
        if (!report) throw new NotFoundException('Report not found');

        const billingId = report.labResult?.billingId;
        if (billingId) {
            const siblings = await this.databaseService.repoReport().createQueryBuilder('report')
                .leftJoin('report.labResult', 'labResult')
                .where('labResult.billingId = :billingId', { billingId })
                .getMany();
            for (const s of siblings) {
                await this.databaseService.repoReport().update(s.id, {
                    isDelivered: true,
                    status: ReportStatus.PUBLISHED
                });
            }
        } else {
            await this.databaseService.repoReport().update(id, {
                isDelivered: true,
                status: ReportStatus.PUBLISHED
            });
        }

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

        const billingId = report.labResult?.billingId;
        if (billingId) {
            const siblings = await this.databaseService.repoReport().createQueryBuilder('report')
                .leftJoin('report.labResult', 'labResult')
                .where('labResult.billingId = :billingId', { billingId })
                .getMany();
            for (const s of siblings) {
                await this.databaseService.repoReport().update(s.id, {
                    status: ReportStatus.PUBLISHED,
                    isDelivered: true
                });
            }
        } else {
            if (report.status !== ReportStatus.FINALIZED) {
                throw new BadRequestException('Only finalized reports can be published');
            }
            report.status = ReportStatus.PUBLISHED;
            report.isDelivered = true;
            await this.databaseService.repoReport().save(report);
        }

        return this.findOne(id);
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
                        referredByDoctor: true,
                        items: { test: true }
                    },
                    parameterResults: {
                        testParameter: true
                    }
                }
            }
        });

        if (!report) throw new NotFoundException('Report not found');

        let billingId = report.labResult?.billingId;
        const patientId = report.patientId;

        // Fallback: If billingId wasn't populated on labResult, lookup via labResultId
        if (!billingId && report.labResultId) {
            const directLr = await this.databaseService.repoLabResult().findOne({
                where: { id: report.labResultId },
                relations: { billing: true }
            });
            if (directLr?.billingId) {
                billingId = directLr.billingId;
            }
        }

        // Query sibling reports using QueryBuilder to ensure robust PostgreSQL relation queries
        let siblingReports: Report[] = [];
        if (billingId) {
            siblingReports = await this.databaseService.repoReport().createQueryBuilder('report')
                .leftJoinAndSelect('report.patient', 'patient')
                .leftJoinAndSelect('report.labResult', 'labResult')
                .leftJoinAndSelect('labResult.test', 'test')
                .leftJoinAndSelect('labResult.sample', 'sample')
                .leftJoinAndSelect('labResult.performedBy', 'performedBy')
                .leftJoinAndSelect('labResult.verifiedBy', 'verifiedBy')
                .leftJoinAndSelect('labResult.billing', 'billing')
                .leftJoinAndSelect('billing.referredByDoctor', 'referredByDoctor')
                .leftJoinAndSelect('labResult.parameterResults', 'parameterResults')
                .leftJoinAndSelect('parameterResults.testParameter', 'testParameter')
                .where('labResult.billingId = :billingId', { billingId })
                .orderBy('report.createdAt', 'ASC')
                .getMany();
        } else if (patientId) {
            siblingReports = await this.databaseService.repoReport().createQueryBuilder('report')
                .leftJoinAndSelect('report.patient', 'patient')
                .leftJoinAndSelect('report.labResult', 'labResult')
                .leftJoinAndSelect('labResult.test', 'test')
                .leftJoinAndSelect('labResult.sample', 'sample')
                .leftJoinAndSelect('labResult.performedBy', 'performedBy')
                .leftJoinAndSelect('labResult.verifiedBy', 'verifiedBy')
                .leftJoinAndSelect('labResult.billing', 'billing')
                .leftJoinAndSelect('billing.referredByDoctor', 'referredByDoctor')
                .leftJoinAndSelect('labResult.parameterResults', 'parameterResults')
                .leftJoinAndSelect('parameterResults.testParameter', 'testParameter')
                .where('report.patientId = :patientId', { patientId })
                .andWhere('DATE(report.createdAt) = DATE(:repDate)', { repDate: report.createdAt })
                .orderBy('report.createdAt', 'ASC')
                .getMany();
        }

        if (!siblingReports.some(r => r.id === report.id)) {
            siblingReports.unshift(report);
        }

        // Retrieve all lab_results for this billing to ensure any test in this bill/visit is included
        let allLabResults: any[] = [];
        if (billingId) {
            allLabResults = await this.databaseService.repoLabResult().find({
                where: { billingId },
                relations: {
                    test: true,
                    sample: true,
                    performedBy: true,
                    verifiedBy: true,
                    parameterResults: {
                        testParameter: true
                    }
                },
                order: { createdAt: 'ASC' }
            });
        }

        let billing = report.labResult?.billing;
        if (!billing && billingId) {
            billing = await this.databaseService.repoBilling().findOne({
                where: { id: billingId },
                relations: {
                    referredByDoctor: true,
                    patient: true,
                    items: { test: true }
                }
            }) || undefined;
        }

        const testsMap = new Map<string, any>();

        // 1. Process reports
        for (const rep of siblingReports) {
            const lr = rep.labResult;
            const key = lr?.id || rep.id;
            let parsedReportData: any = null;
            try {
                if (rep.reportData) {
                    parsedReportData = JSON.parse(rep.reportData);
                }
            } catch (e) {
                // Ignore parse errors
            }

            const rawParams = (parsedReportData?.parameterResults && parsedReportData.parameterResults.length > 0)
                ? parsedReportData.parameterResults
                : (lr?.parameterResults || []);

            const parameterResults = rawParams.map((pr: any) => ({
                snapshotParameterName: pr.snapshotParameterName || pr.testParameter?.name || pr.name || '',
                resultValue: pr.resultValue ?? '',
                snapshotUnit: pr.snapshotUnit || pr.testParameter?.unit || pr.unit || '',
                snapshotReferenceValue: pr.snapshotReferenceValue || pr.testParameter?.referenceValue || pr.referenceRange || '',
                displayOrder: pr.snapshotDisplayOrder ?? pr.testParameter?.displayOrder ?? 0,
            })).sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0));

            const remarks = parsedReportData?.remarks || lr?.remarks || '';

            testsMap.set(key, {
                reportId: rep.id,
                labResultId: lr?.id,
                testId: lr?.test?.id,
                testName: lr?.test?.name || 'Unknown Test',
                testCode: lr?.test?.id ? `TEST-${lr.test.id}` : '',
                department: lr?.test?.department,
                sampleType: lr?.test?.sampleType,
                sampleBarcode: lr?.sample?.barcode || '',
                sampleCollectedAt: lr?.sample?.collectedAt || rep.createdAt,
                status: rep.status,
                labResultStatus: lr?.status || (rep.status === ReportStatus.FINALIZED || rep.status === ReportStatus.PUBLISHED ? LabResultStatus.VERIFIED : LabResultStatus.COMPLETED),
                isVerified: lr?.status === LabResultStatus.VERIFIED || rep.status === ReportStatus.FINALIZED || rep.status === ReportStatus.PUBLISHED,
                parameterResults,
                remarks,
                performedBy: lr?.performedBy ? {
                    id: lr.performedBy.id,
                    firstName: lr.performedBy.firstName,
                    lastName: lr.performedBy.lastName,
                } : null,
                performedAt: lr?.performedAt,
                verifiedBy: lr?.verifiedBy ? {
                    id: lr.verifiedBy.id,
                    firstName: lr.verifiedBy.firstName,
                    lastName: lr.verifiedBy.lastName,
                } : null,
                verifiedAt: lr?.verifiedAt
            });
        }

        // 2. Process all lab results for the bill to include any test not yet finalized into reports
        for (const lr of allLabResults) {
            const alreadyMapped = Array.from(testsMap.values()).some(
                t => t.labResultId === lr.id || (t.testId && t.testId === lr.test?.id)
            );
            if (!alreadyMapped) {
                const rawParams = lr.parameterResults || [];
                const parameterResults = rawParams.map((pr: any) => ({
                    snapshotParameterName: pr.snapshotParameterName || pr.testParameter?.name || pr.name || '',
                    resultValue: pr.resultValue ?? '',
                    snapshotUnit: pr.snapshotUnit || pr.testParameter?.unit || pr.unit || '',
                    snapshotReferenceValue: pr.snapshotReferenceValue || pr.testParameter?.referenceValue || pr.referenceRange || '',
                    displayOrder: pr.snapshotDisplayOrder ?? pr.testParameter?.displayOrder ?? 0,
                })).sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0));

                const isVerified = lr.status === LabResultStatus.VERIFIED;

                // Auto-finalize into reports table if verified so future queries find it immediately
                let createdReportId = '';
                if (isVerified) {
                    try {
                        const snap = JSON.stringify({
                            parameterResults: lr.parameterResults,
                            remarks: lr.remarks
                        });
                        const newRep = await this.databaseService.repoReport().save(
                            this.databaseService.repoReport().create({
                                patientId: lr.patientId || patientId,
                                labResultId: lr.id,
                                reportData: snap,
                                status: ReportStatus.FINALIZED
                            })
                        );
                        createdReportId = newRep.id;
                    } catch {
                        // ignore if already created or constraint
                    }
                }

                testsMap.set(lr.id, {
                    reportId: createdReportId || report.id,
                    labResultId: lr.id,
                    testId: lr.test?.id,
                    testName: lr.test?.name || 'Unknown Test',
                    testCode: lr.test?.id ? `TEST-${lr.test.id}` : '',
                    department: lr.test?.department,
                    sampleType: lr.test?.sampleType,
                    sampleBarcode: lr.sample?.barcode || '',
                    sampleCollectedAt: lr.sample?.collectedAt || lr.createdAt,
                    status: isVerified ? ReportStatus.FINALIZED : ReportStatus.UNDER_REVIEW,
                    labResultStatus: lr.status,
                    isVerified: isVerified,
                    parameterResults,
                    remarks: lr.remarks || '',
                    performedBy: lr.performedBy ? {
                        id: lr.performedBy.id,
                        firstName: lr.performedBy.firstName,
                        lastName: lr.performedBy.lastName,
                    } : null,
                    performedAt: lr.performedAt,
                    verifiedBy: lr.verifiedBy ? {
                        id: lr.verifiedBy.id,
                        firstName: lr.verifiedBy.firstName,
                        lastName: lr.verifiedBy.lastName,
                    } : null,
                    verifiedAt: lr.verifiedAt
                });
            }
        }

        const tests = Array.from(testsMap.values());

        const verifiedDoctor = siblingReports.map(r => r.labResult?.verifiedBy).find(Boolean) ||
            allLabResults.map(l => l.verifiedBy).find(Boolean);

        const latestVerifiedAt = [
            ...siblingReports.map(r => r.labResult?.verifiedAt),
            ...allLabResults.map(l => l.verifiedAt)
        ]
            .filter(Boolean)
            .sort()
            .pop();

        const allVerified = tests.length > 0 && tests.every(t => t.isVerified);
        const anyVerified = tests.some(t => t.isVerified);

        const allReviewRemarks = tests
            .map(t => t.remarks)
            .filter(r => r && r.trim().length > 0)
            .join('<hr class="my-3 border-slate-300" />');

        const referringDoctorName = this.formatDoctorName(billing);

        return {
            id: report.id,
            status: report.status,
            isDelivered: siblingReports.every(r => r.isDelivered),
            createdAt: report.createdAt,
            updatedAt: report.updatedAt,
            patient: report.patient,
            billing: billing,
            billNumber: billing?.billNumber || 'N/A',
            referringDoctorName: referringDoctorName,
            tests: tests,
            totalTests: tests.length,
            pathologistReview: {
                isReviewed: allVerified,
                anyReviewed: anyVerified,
                reviewStatus: allVerified ? 'Verified / Approved' : anyVerified ? 'Partially Verified' : 'Pending Review',
                pathologistName: verifiedDoctor ? `Dr. ${verifiedDoctor.firstName || ''} ${verifiedDoctor.lastName || ''}`.trim() : null,
                reviewedAt: latestVerifiedAt || null,
                remarks: allReviewRemarks
            },
            labResult: report.labResult,
            reportData: report.reportData,
        };
    }
}
