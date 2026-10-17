import React, { useState } from 'react';
import { Receipt, Eye, FileText } from 'lucide-react';
import type { NavigateFunction } from 'react-router-dom';
import { InvoiceDetailsModal } from '../../Billing/InvoiceDetailsModal';

interface BillingTabProps {
    patient: any;
    navigate: NavigateFunction;
}

export const BillingTab: React.FC<BillingTabProps> = ({ patient }) => {
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

    return (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {patient.billings?.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-6 py-4 font-bold">Bill No</th>
                                <th className="px-6 py-4 font-bold">Invoice Date</th>
                                <th className="px-6 py-4 font-bold">Amount</th>
                                <th className="px-6 py-4 font-bold">Discount</th>
                                <th className="px-6 py-4 font-bold">Total</th>
                                <th className="px-6 py-4 font-bold">Status</th>
                                <th className="px-6 py-4 font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {patient.billings.map((bill: any) => (
                                <tr
                                    key={bill.id}
                                    className="hover:bg-slate-50/50 transition-colors"
                                >
                                    <td className="px-6 py-4 font-mono font-semibold text-slate-700">
                                        <div className="flex items-center gap-2">
                                            <FileText size={15} className="text-slate-400" />
                                            <span>{bill.billNumber || `#${bill.id.substring(0, 8)}`}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-600">
                                        {new Date(bill.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {Number(bill.subtotal || 0).toLocaleString()} BDT
                                    </td>
                                    <td className="px-6 py-4 text-red-500 font-medium">
                                        -{Number(bill.discountAmount || bill.discount || 0).toLocaleString()} BDT
                                    </td>
                                    <td className="px-6 py-4 font-black text-slate-900">
                                        {Number(bill.totalAmount || 0).toLocaleString()} BDT
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                                                bill.paymentStatus === 'Paid'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : bill.paymentStatus === 'Partial'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-amber-100 text-amber-700'
                                            }`}
                                        >
                                            {bill.paymentStatus || 'Unpaid'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedInvoiceId(bill.id)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary hover:text-white hover:bg-primary bg-primary/10 rounded-lg shadow-2xs transition-colors cursor-pointer"
                                            title="View Details"
                                        >
                                            <Eye size={14} />
                                            <span>View Details</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-12">
                    <Receipt size={40} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-bold text-slate-700">No Billing Records</h3>
                    <p className="text-sm text-slate-500 mt-1">This patient has no invoices or billing history.</p>
                </div>
            )}

            {/* Invoice Details Modal */}
            <InvoiceDetailsModal
                invoiceId={selectedInvoiceId}
                isOpen={!!selectedInvoiceId}
                onClose={() => setSelectedInvoiceId(null)}
            />
        </div>
    );
};
