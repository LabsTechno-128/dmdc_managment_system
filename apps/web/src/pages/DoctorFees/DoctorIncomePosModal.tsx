import React, { useRef } from 'react';
import { X } from 'lucide-react';
// import { useReactToPrint } from 'react-to-print';

interface DoctorIncomePosModalProps {
    isOpen: boolean;
    onClose: () => void;
    incomes: any[];
    date: string;
    doctorId?: string | null;
}

export const DoctorIncomePosModal: React.FC<DoctorIncomePosModalProps> = ({
    isOpen,
    onClose,
    incomes,
    date,
    doctorId
}) => {
    const printRef = useRef<HTMLDivElement>(null);

    // const handlePrint = useReactToPrint({
    //     contentRef: printRef,
    //     documentTitle: 'Doctor_Income_Report'
    // });

    if (!isOpen) return null;

    // Filter by doctor if selected, else show all with appointments
    const incomeData = incomes || [];
    const baseIncomes = doctorId && doctorId !== 'ALL'
        ? incomeData.filter((i: any) => i.doctorId?.toString() === doctorId?.toString())
        : incomeData.filter((i: any) => i.appointmentCount > 0);

    const filteredIncomes = baseIncomes;
    const totalPayout = filteredIncomes?.reduce((sum: number, doc: any) => sum + doc.totalIncome, 0) || 0;
    const totalPatients = filteredIncomes?.reduce((sum: number, doc: any) => sum + doc.patientCount, 0) || 0;
    const totalAppointments = filteredIncomes?.reduce((sum: number, doc: any) => sum + doc.appointmentCount, 0) || 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm print:absolute print:inset-0 print:bg-white print:items-start print:justify-start">
            {/* Modal Container */}
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm max-h-[90vh] flex flex-col overflow-hidden print:shadow-none print:w-full print:max-w-none print:h-auto print:max-h-none print:m-0 print:p-0 print:overflow-visible">

                {/* Header (Hidden in print) */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 print:hidden">
                    <h2 className="text-lg font-bold text-slate-800">Print POS Invoice</h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 print:p-0 print:overflow-visible">
                    {filteredIncomes && filteredIncomes.length > 0 ? (
                        <div ref={printRef} className="pos-receipt text-black font-mono text-sm leading-tight bg-white p-4 mx-auto w-full max-w-[80mm] min-h-[100mm]">
                            <style type="text/css" media="print">
                                {`
                                    @page { size: auto; margin: 0; }
                                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                                `}
                            </style>
                            {filteredIncomes.map((doc: any, index: number) => {
                                const isLastItem = index === filteredIncomes.length - 1;
                                const showOverallSummary = !doctorId && filteredIncomes.length > 1;
                                const needsPageBreak = !isLastItem || showOverallSummary;

                                return (
                                    <div
                                        key={doc.doctorId}
                                        className="mb-8"
                                        style={needsPageBreak ? { pageBreakAfter: 'always' } : {}}
                                    >
                                        <div className="text-center mb-4 pb-4 border-b border-dashed border-gray-400">
                                            <h1 className="text-xl font-bold mb-1">DIAGNOSTIC PRO</h1>
                                            <p className="text-xs uppercase">Doctor Daily Income Report</p>
                                            <p className="text-xs mt-1">Date: {new Date(date).toLocaleDateString()}</p>
                                        </div>
                                        <p className="font-bold mb-2 uppercase border-b border-gray-200 pb-1">{doc.doctorName}</p>
                                        <table className="w-full text-xs text-left mb-2">
                                            <thead>
                                                <tr>
                                                    <th className="pb-1">Pat.</th>
                                                    <th className="pb-1">Type</th>
                                                    <th className="pb-1 text-right">Fee</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {doc.appointments.map((appt: any, idx: number) => (
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
                                        <div className="flex justify-between items-center text-[10px] pt-1 mt-1">
                                            <span>Consultation:</span>
                                            <span>৳{doc.consultationIncome}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] pb-1">
                                            <span>Follow-Up:</span>
                                            <span>৳{doc.followUpIncome}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs font-bold pt-1 border-t border-gray-400 border-dashed mt-1">
                                            <span>Total ({doc.patientCount} Pat / {doc.appointmentCount} Appt):</span>
                                            <span>৳{doc.totalIncome}</span>
                                        </div>
                                        <div className="text-center mt-4 text-gray-500">
                                            <p className="text-[10px]">Printed: {new Date().toLocaleString()}</p>
                                            <p className="text-[10px] mt-1">*** END OF REPORT ***</p>
                                        </div>
                                    </div>
                                );
                            })}

                            {!doctorId && filteredIncomes.length > 1 && (
                                <div className="pt-2">
                                    <div className="text-center mb-4 pb-4 border-b border-dashed border-gray-400">
                                        <h1 className="text-xl font-bold mb-1">DIAGNOSTIC PRO</h1>
                                        <p className="text-xs uppercase">Overall Daily Income Summary</p>
                                        <p className="text-xs mt-1">Date: {new Date(date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-center pt-2">
                                        <p className="font-bold text-base mb-1 border-b border-t py-1">GRAND TOTAL: ৳{totalPayout}</p>
                                        <p className="text-[11px]">Total Patients: {totalPatients}</p>
                                        <p className="text-[11px]">Total Appointments: {totalAppointments}</p>
                                        <p className="text-[10px] mt-4 text-gray-500">Printed: {new Date().toLocaleString()}</p>
                                        <p className="text-[10px] mt-1 text-gray-500">*** END OF REPORT ***</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-10 print:hidden">
                            <p className="text-slate-500">No completed appointments found for this criteria.</p>
                        </div>
                    )}
                </div>

                {/* Footer (Hidden in print) */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 print:hidden">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50">
                        Close
                    </button>
                    {/* <button onClick={handlePrint} disabled={!filteredIncomes || filteredIncomes.length === 0} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-50">
                        <Printer size={16} />
                        Print POS
                    </button> */}
                </div>
            </div>
        </div>
    );
};
