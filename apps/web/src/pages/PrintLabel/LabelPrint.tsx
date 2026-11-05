import React from 'react';
import { SampleQrMatrixSvg } from '../SampleCollection/components/SampleBarcodeComponents';

export interface LabelPrintProps {
    patient: {
        id?: string;
        patientId: string;
        name: string;
        gender: string;
        age: number | string;
        phone: string;
        address?: string;
        bloodGroup?: string;
        emergencyContactPhone?: string;
    };
    selectedBill?: {
        id?: string;
        billNumber: string;
        createdAt?: string;
        billingType?: string;
        tests?: Array<{ id: string; name: string }>;
    } | null;
    copies?: number;
    includeTestsOnSticker?: boolean;
    includeQrCode?: boolean;
}

export const LabelPrint = React.forwardRef<HTMLDivElement, LabelPrintProps>(
    ({ patient, selectedBill, copies = 1, includeTestsOnSticker = false, includeQrCode = true }, ref) => {
        if (!patient) return null;

        const copiesList = Array.from({ length: Math.max(1, copies) }, (_, i) => i);

        const formatGender = (gender: string | undefined) => {
            if (!gender) return 'N/A';
            const g = gender.toUpperCase();
            if (g === 'MALE' || g === 'M') return 'Male';
            if (g === 'FEMALE' || g === 'F') return 'Female';
            return gender;
        };

        const formatAge = (age: any) => {
            if (age === null || age === undefined || age === '') return 'N/A';
            const num = Number(age);
            return isNaN(num) ? String(age) : `${num} Y`;
        };

        const patientName = patient.name || '-';
        const patientSex = formatGender(patient.gender);
        const patientAge = formatAge(patient.age);
        const patientPhone = patient.phone || 'N/A';
        const patientId = patient.patientId || '-';
        const billNo = selectedBill?.billNumber || 'N/A';

        return (
            <div id="label-print-root" ref={ref} className="bg-white text-black">
                <style type="text/css" media="print">
                    {`
                        @page {
                            size: 75mm 50mm !important;
                            margin: 0 !important;
                        }
                        html, body {
                            width: 75mm !important;
                            height: 50mm !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            background: #ffffff !important;
                            color: #000000 !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                            font-family: Arial, Helvetica, sans-serif !important;
                        }
                        * {
                            box-sizing: border-box !important;
                        }
                        #label-print-root {
                            display: block !important;
                            visibility: visible !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            width: 75mm !important;
                            background: #ffffff !important;
                        }
                        .label-sticker-sheet {
                            width: 75mm !important;
                            height: 50mm !important;
                            max-width: 75mm !important;
                            max-height: 50mm !important;
                            padding: 3.5mm 4mm !important;
                            margin: 0 !important;
                            box-sizing: border-box !important;
                            page-break-after: always !important;
                            break-after: page !important;
                            display: flex !important;
                            flex-direction: column !important;
                            justify-content: space-between !important;
                            background: #ffffff !important;
                            color: #000000 !important;
                            overflow: hidden !important;
                        }
                        .label-sticker-sheet:last-child {
                            page-break-after: avoid !important;
                            break-after: avoid !important;
                        }
                    `}
                </style>

                {copiesList.map((copyIdx) => (
                    <div key={copyIdx} className="label-sticker-sheet">
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', width: '100%' }}>
                            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3.5mm' }}>
                                {/* Row 1: Name */}
                                <div style={{ fontSize: '11pt', fontWeight: 'bold', color: '#000000', display: 'flex', alignItems: 'baseline', gap: '5px', lineHeight: 1.2 }}>
                                    <span style={{ flexShrink: 0 }}>Name:</span>
                                    <span style={{ textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {patientName}
                                    </span>
                                </div>

                                {/* Row 2: Sex, Age, Phone */}
                                <div style={{ fontSize: '8.5pt', fontWeight: 'bold', color: '#000000', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '6px', lineHeight: 1.2 }}>
                                    <div>
                                        <span>Sex: </span>
                                        <span>{patientSex}</span>
                                    </div>
                                    <div>
                                        <span>Age: </span>
                                        <span>{patientAge}</span>
                                    </div>
                                    <div>
                                        <span>Phone: </span>
                                        <span>{patientPhone}</span>
                                    </div>
                                </div>

                                {/* Row 3: PTN ID */}
                                <div style={{ fontSize: '9.5pt', fontWeight: 'bold', color: '#000000', display: 'flex', alignItems: 'baseline', gap: '5px', lineHeight: 1.2 }}>
                                    <span style={{ flexShrink: 0 }}>PTN ID:</span>
                                    <span style={{ fontFamily: 'monospace', letterSpacing: '0.5px' }}>{patientId}</span>
                                </div>

                                {/* Row 4: BILL ID */}
                                <div style={{ fontSize: '9.5pt', fontWeight: 'bold', color: '#000000', display: 'flex', alignItems: 'baseline', gap: '5px', lineHeight: 1.2 }}>
                                    <span style={{ flexShrink: 0 }}>BILL ID:</span>
                                    <span style={{ fontFamily: 'monospace', letterSpacing: '0.5px' }}>{billNo}</span>
                                </div>
                            </div>

                            {/* Optional Scannable QR Code */}
                            {includeQrCode && billNo && billNo !== 'N/A' && (
                                <div style={{ flexShrink: 0, paddingTop: '2px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <SampleQrMatrixSvg value={billNo} size={54} />
                                </div>
                            )}
                        </div>

                        {/* Optional Tests line if enabled */}
                        {includeTestsOnSticker && selectedBill?.tests && selectedBill.tests.length > 0 && (
                            <div
                                style={{
                                    fontSize: '7pt',
                                    fontWeight: 'bold',
                                    color: '#222222',
                                    borderTop: '0.5px solid #666666',
                                    paddingTop: '1mm',
                                    marginTop: '1mm',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    lineHeight: 1.2,
                                }}
                            >
                                Tests: {selectedBill.tests.map((t: any) => t.name).join(', ')}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    }
);

LabelPrint.displayName = 'LabelPrint';
