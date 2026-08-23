import React from 'react';
import { Receipt } from 'lucide-react';
import type { NavigateFunction } from 'react-router-dom';

interface BillingTabProps {
    patient: any;
    navigate: NavigateFunction;
}

export const BillingTab: React.FC<BillingTabProps> = ({ patient, navigate }) => {
    return (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {patient.billings?.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-6 py-4 font-bold">Invoice Date</th>
                                <th className="px-6 py-4 font-bold">Amount</th>
                                <th className="px-6 py-4 font-bold">Discount</th>
                                <th className="px-6 py-4 font-bold">Total</th>
                                <th className="px-6 py-4 font-bold">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {patient.billings.map((bill: any) => (
                                <tr key={bill.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => navigate(`/billing/${bill.id}`)}>
                                    <td className="px-6 py-4 font-semibold text-slate-700">{new Date(bill.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-slate-600">{Number(bill.subtotal || 0).toLocaleString()} BDT</td>
                                    <td className="px-6 py-4 text-red-500 font-medium">-{Number(bill.discount || 0).toLocaleString()} BDT</td>
                                    <td className="px-6 py-4 font-black text-slate-900">{Number(bill.totalAmount || 0).toLocaleString()} BDT</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${bill.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                            {bill.paymentStatus || 'Unpaid'}
                                        </span>
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
        </div>
    );
};
