import React from 'react';

interface DoctorIncomePrintProps {
    date: string;
    doctor: any;
}

export const DoctorIncomePrint = React.forwardRef<HTMLDivElement, DoctorIncomePrintProps>(({ date, doctor }, ref) => {
    if (!doctor) return <div ref={ref} />;

    return (
        <div id="doctor-income-print" ref={ref} className="bg-white text-black font-mono text-[13px] leading-tight mx-auto max-w-[80mm] min-h-[100mm]">
            <style type="text/css" media="print">
                {`
                    @page { size: 80mm auto; margin: 0; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                `}
            </style>

            <div className="p-4">
                <div className="mb-8">
                    <div className="text-center mb-4 pb-4 border-b border-dashed border-gray-400">
                        <h1 className="text-xl font-bold mb-1">DIAGNOSTIC PRO</h1>
                        <p className="text-xs uppercase tracking-wide">Doctor Daily Income Report</p>
                        <p className="text-xs mt-1">Date: {new Date(date).toLocaleDateString()}</p>
                    </div>
                    <p className="font-bold mb-2 uppercase border-b border-dashed border-gray-400 pb-2">{doctor.doctorName}</p>
                    <table className="w-full text-xs text-left mb-2">
                        <thead>
                            <tr>
                                <th className="pb-1 font-bold">Pat.</th>
                                <th className="pb-1 font-bold">Type</th>
                                <th className="pb-1 font-bold text-right">Fee</th>
                            </tr>
                        </thead>
                        <tbody>
                            {doctor.appointments?.map((appt: any, idx: number) => (
                                <tr key={idx}>
                                    <td className="py-0.5 truncate max-w-[80px]">{appt.patientName.split(' ')[0]}</td>
                                    <td className="py-0.5 text-[10px]">
                                        {appt.consultationFee > 0 ? 'Con' : ''}
                                        {appt.consultationFee > 0 && appt.followUpFee > 0 ? '+' : ''}
                                        {appt.followUpFee > 0 ? 'F/U' : ''}
                                    </td>
                                    <td className="py-0.5 text-right">{appt.feeEarned}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="flex justify-between items-center text-xs pt-2 mt-4">
                        <span>Consultation:</span>
                        <span>৳{doctor.consultationIncome}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs pb-2">
                        <span>Follow-Up:</span>
                        <span>৳{doctor.followUpIncome}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-bold pt-2 border-t border-gray-400 border-dashed mt-1">
                        <span>Total ({doctor.patientCount} Pat / {doctor.appointmentCount} Appt):</span>
                        <span>৳{doctor.totalIncome}</span>
                    </div>
                    <div className="text-center mt-6 text-gray-500">
                        <p className="text-[11px]">Printed: {new Date().toLocaleString()}</p>
                        <p className="text-[11px] mt-1 tracking-widest">*** END OF REPORT ***</p>
                    </div>
                </div>
            </div>
        </div>
    );
});
DoctorIncomePrint.displayName = 'DoctorIncomePrint';


// import React from 'react';
// import { Hospital, MapPin, Phone, Mail, FileText } from 'lucide-react';

// interface DoctorIncomePrintProps {
//     date: string;
//     doctor: any;
// }
// export const DoctorIncomePrint = React.forwardRef<HTMLDivElement, DoctorIncomePrintProps>(({ doctor, date }, ref) => {
//     if (!doctor) return null;

//     return (
//         <div id="doctor-income-print" ref={ref} className="bg-white text-slate-800 font-sans mx-auto max-w-[110mm] min-h-[297mm]">
//             <style type="text/css" media="print">
//                 {`
//           @page { size: A4; margin: 0; }
//           body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
//         `}
//             </style>
//             <div className="p-10">
//                 {/* Header */}
//                 <div className="flex justify-between items-start border-b-2 border-slate-200 pb-6 mb-6">
//                     <div className="flex items-center space-x-4">
//                         <div className="p-3 bg-blue-600/10 rounded-2xl">
//                             <Hospital className="w-10 h-10 text-blue-600" />
//                         </div>
//                         <div>
//                             <h1 className="text-3xl font-bold text-slate-900 tracking-tight">DMDC Hospital</h1>
//                             <p className="text-slate-500 font-medium tracking-wide">Diagnostic & Medical Center</p>
//                         </div>
//                     </div>
//                     <div className="text-right text-sm text-slate-500 space-y-1">
//                         <p className="flex items-center justify-end gap-1"><MapPin size={14} /> 123 Health Avenue, Medical District</p>
//                         <p className="flex items-center justify-end gap-1"><Phone size={14} /> +880 1234 567 890</p>
//                         <p className="flex items-center justify-end gap-1"><Mail size={14} /> doctor@dmdchospital.com</p>
//                     </div>
//                 </div>

//                 {/* Title & Info */}
//                 <div className="flex justify-between items-end mb-8">
//                     <div>
//                         <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
//                             <FileText size={24} className="text-blue-600" />
//                             PATIENT INVOICE
//                         </h2>
//                         <p className="text-slate-500 mt-1">
//                             Bill No: <span className="font-semibold text-slate-700">{doctor.billNumber || doctor.id?.substring(0, 8)}</span>
//                         </p>
//                     </div>
//                     <div className="text-right">
//                         <p className="text-sm text-slate-500">Date</p>
//                         <p className="font-semibold text-slate-800">{new Date(doctor.createdAt).toLocaleDateString()}</p>
//                     </div>
//                 </div>

//                 {/* Patient Information Box */}
//                 <div className="bg-slate-50 rounded-xl p-5 mb-8 border border-slate-100">
//                     <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Patient Details</h3>
//                     <div className="grid grid-cols-2 gap-y-3 gap-x-8 text-sm">
//                         <div className="flex justify-between border-b border-slate-200/60 pb-1">
//                             <span className="text-slate-500">Patient ID:</span>
//                             <span className="font-semibold text-slate-800">{doctor.patient?.patientId || 'N/A'}</span>
//                         </div>
//                         <div className="flex justify-between border-b border-slate-200/60 pb-1">
//                             <span className="text-slate-500">Name:</span>
//                             <span className="font-semibold text-slate-800">{doctor.patient?.name || `${doctor.patient?.firstName || ''} ${doctor.patient?.lastName || ''}`.trim() || 'Unknown'}</span>
//                         </div>
//                         <div className="flex justify-between border-b border-slate-200/60 pb-1">
//                             <span className="text-slate-500">Age / Sex:</span>
//                             <span className="font-semibold text-slate-800">{doctor.patient?.age || '-'} / {doctor.patient?.gender || '-'}</span>
//                         </div>
//                         <div className="flex justify-between border-b border-slate-200/60 pb-1">
//                             <span className="text-slate-500">Phone:</span>
//                             <span className="font-semibold text-slate-800">{doctor.patient?.phone || 'N/A'}</span>
//                         </div>
//                         <div className="flex justify-between border-b border-slate-200/60 pb-1">
//                             <span className="text-slate-500">Patient Type:</span>
//                             <span className="font-semibold text-slate-800">{doctor.patientType === 'OUTSIDE' ? 'Outside / Walk-in' : 'In-House'}</span>
//                         </div>
//                         <div className="flex justify-between border-b border-slate-200/60 pb-1">
//                             <span className="text-slate-500">Referred By:</span>
//                             <span className="font-semibold text-slate-800">Self / Walk-in</span>
//                         </div>
//                     </div>
//                 </div>

//                 {/* doctor Items Table */}
//                 <div className="mb-8">
//                     <table className="w-full text-left border-collapse">
//                         <thead>
//                             <tr className="bg-slate-800 text-white text-sm">
//                                 <th className="py-3 px-4 rounded-tl-lg font-medium w-16 text-center">SL</th>
//                                 <th className="py-3 px-4 font-medium">Test / Service Description</th>
//                                 <th className="py-3 px-4 font-medium text-center w-24">Qty</th>
//                                 <th className="py-3 px-4 font-medium text-right w-32">Rate (BDT)</th>
//                                 <th className="py-3 px-4 rounded-tr-lg font-medium text-right w-32">Amount (BDT)</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {doctor.items?.map((item: any, index: number) => (
//                                 <tr key={item.id || index} className="border-b border-slate-200 text-sm">
//                                     <td className="py-3 px-4 text-center text-slate-500">{index + 1}</td>
//                                     <td className="py-3 px-4 font-medium text-slate-800">{item.test?.name || item.name || item.description || 'Service / Consultation'}</td>
//                                     <td className="py-3 px-4 text-center text-slate-600">1</td>
//                                     <td className="py-3 px-4 text-right text-slate-600">{Number(item.price).toFixed(2)}</td>
//                                     <td className="py-3 px-4 text-right font-medium text-slate-800">{Number(item.price).toFixed(2)}</td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                 </div>

//                 {/* Totals */}
//                 <div className="flex justify-end mb-12">
//                     <div className="w-72 space-y-3">
//                         <div className="flex justify-between text-sm text-slate-600">
//                             <span>Subtotal</span>
//                             <span>{Number(doctor.subtotal || 0).toFixed(2)} BDT</span>
//                         </div>
//                         <div className="flex justify-between text-sm text-slate-600">
//                             <span>Discount {doctor.discountType === 'PERCENTAGE' ? `(${doctor.discount}%)` : ''}</span>
//                             <span className="text-red-500">- {Number(doctor.discountAmount || 0).toFixed(2)} BDT</span>
//                         </div>
//                         {Number(doctor.additionalCharges) > 0 && (
//                             <div className="flex justify-between text-sm text-slate-600">
//                                 <span>Additional Charges</span>
//                                 <span>+ {Number(doctor.additionalCharges).toFixed(2)} BDT</span>
//                             </div>
//                         )}
//                         <div className="flex justify-between text-lg font-bold text-slate-800 border-t-2 border-slate-800 pt-2 mt-2">
//                             <span>Net Payable</span>
//                             <span>{Number(doctor.totalAmount || 0).toFixed(2)} BDT</span>
//                         </div>

//                         <div className="flex justify-between text-sm text-slate-600 pt-2">
//                             <span>Paid Amount</span>
//                             <span className="font-semibold text-emerald-600">{Number(doctor.paidAmount || 0).toFixed(2)} BDT</span>
//                         </div>

//                         <div className="flex justify-between text-sm text-slate-600">
//                             <span>Due Amount</span>
//                             <span className="font-semibold text-red-500">{Number(doctor.dueAmount || 0).toFixed(2)} BDT</span>
//                         </div>

//                         <div className="flex justify-between text-sm pt-2">
//                             <span className="text-slate-500">Payment Status:</span>
//                             <span className={`font-bold ${doctor.paymentStatus === 'Paid' ? 'text-emerald-600' : doctor.paymentStatus === 'Partial' ? 'text-blue-600' : 'text-amber-600'}`}>
//                                 {doctor.paymentStatus?.toUpperCase() || 'UNPAID'}
//                             </span>
//                         </div>
//                     </div>
//                 </div>

//                 {/* Footer */}
//                 <div className="mt-auto border-t-2 border-slate-200 pt-8 flex justify-between items-end">
//                     <div className="text-xs text-slate-400 space-y-1">
//                         <p>1. Please collect report within 3 days.</p>
//                         <p>2. Bring this invoice at the time of report delivery.</p>
//                         <p>3. Money once paid is not refundable.</p>
//                     </div>
//                     <div className="text-center">
//                         <div className="w-40 border-b border-slate-400 mb-2"></div>
//                         <p className="text-sm font-medium text-slate-600">Authorized Signature</p>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// });
// DoctorIncomePrint.displayName = 'DoctorIncomePrint';
