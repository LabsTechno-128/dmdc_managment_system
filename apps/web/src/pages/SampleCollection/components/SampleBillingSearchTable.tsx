import React from 'react';
import { Search, FlaskConical, ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';

interface SampleBillingSearchTableProps {
  search: string;
  onSearchChange: (value: string) => void;
  billings: any[] | undefined;
  isLoading: boolean;
  onSelectBilling: (billingId: string) => void;
}

export const SampleBillingSearchTable: React.FC<SampleBillingSearchTableProps> = ({
  search,
  onSearchChange,
  billings,
  isLoading,
  onSelectBilling
}) => {
  return (
    <div className="w-full max-w-[1000px] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200">
        <div className="relative w-full max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by Patient ID, Name, or Invoice ID..."
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          />
        </div>
      </div>

      <div className="w-full max-w-[1000px] max-[999px]:overflow-x-auto min-[1000px]:overflow-x-hidden">
        <table className="w-full max-w-[1000px] max-[999px]:min-w-[640px] text-left border-collapse table-auto">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                Date
              </th>
              <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                Invoice / Bill No
              </th>
              <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Patient
              </th>
              <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                Tests Count
              </th>
              <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                Status
              </th>
              <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right whitespace-nowrap">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-slate-500">
                  Searching...
                </td>
              </tr>
            ) : billings?.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  <FlaskConical size={48} className="mx-auto mb-4 text-slate-300" />
                  <p>No billings found. Try searching for a specific patient or invoice.</p>
                </td>
              </tr>
            ) : (
              billings?.map((billing: any) => {
                const testsCount = billing.items?.filter((i: any) => i.test).length || 0;
                return (
                  <tr key={billing.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5 text-sm text-slate-600 whitespace-nowrap">
                      {new Date(billing.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-sm font-medium text-slate-800 whitespace-nowrap">
                      {billing.billNumber}
                    </td>
                    <td className="px-4 py-3.5 min-w-[160px]">
                      <div className="font-semibold text-slate-800 break-words">
                        {billing.patient?.name}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        ID: {billing.patient?.patientId}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-600 whitespace-nowrap">
                      {testsCount} Tests
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-1 rounded text-xs font-bold ${
                          billing.paymentStatus === 'Paid'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {billing.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          if (testsCount === 0) {
                            toast.warn('This billing has no lab tests to collect.');
                            return;
                          }
                          onSelectBilling(billing.id);
                        }}
                        className="inline-flex items-center gap-1 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-medium text-sm transition-colors cursor-pointer"
                      >
                        Collect
                        <ArrowRight size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

