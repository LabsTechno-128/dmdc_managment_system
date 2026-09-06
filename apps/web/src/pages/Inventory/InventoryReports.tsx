import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Download } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { useRef } from 'react';

export const InventoryReports: React.FC = () => {
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: 'Inventory_Report',
  });

  const { data: items, isLoading } = useQuery({
    queryKey: ['inventory-report-items'],
    queryFn: async () => {
      const res = await api.get('/inventory/items');
      return res.data;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Inventory Reports</h2>
          <p className="text-slate-500">Current stock status report</p>
        </div>
        <button
          onClick={() => handlePrint()}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors"
        >
          <Download size={20} />
          Print / PDF
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div ref={componentRef} className="p-8 bg-white" id="inventory-print">
          <div className="text-center mb-8 border-b border-slate-200 pb-6">
            <h1 className="text-3xl font-bold text-slate-800">Diagnostic Center</h1>
            <h2 className="text-xl font-semibold text-slate-600 mt-2">Inventory Stock Report</h2>
            <p className="text-slate-500 mt-1">Generated on: {new Date().toLocaleString()}</p>
          </div>

          <table className="w-full text-left border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100">
                <th className="p-3 border border-slate-300 font-bold text-slate-700">Category</th>
                <th className="p-3 border border-slate-300 font-bold text-slate-700">Item Name</th>
                <th className="p-3 border border-slate-300 font-bold text-slate-700">Min Stock</th>
                <th className="p-3 border border-slate-300 font-bold text-slate-700">Current Stock</th>
                <th className="p-3 border border-slate-300 font-bold text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr>
              ) : items?.length === 0 ? (
                <tr><td colSpan={5} className="p-4 text-center">No data available.</td></tr>
              ) : (
                items?.map((item: any) => (
                  <tr key={item.id}>
                    <td className="p-3 border border-slate-300 text-slate-700">{item.category?.name}</td>
                    <td className="p-3 border border-slate-300 font-medium text-slate-800">{item.name}</td>
                    <td className="p-3 border border-slate-300 text-slate-700">{item.minStockLevel} {item.unit}</td>
                    <td className="p-3 border border-slate-300 font-bold text-slate-800">{item.currentStock} {item.unit}</td>
                    <td className="p-3 border border-slate-300">
                      {item.currentStock === 0 ? (
                        <span className="text-red-600 font-bold">Out of Stock</span>
                      ) : item.currentStock <= item.minStockLevel ? (
                        <span className="text-amber-600 font-bold">Low Stock</span>
                      ) : (
                        <span className="text-emerald-600 font-bold">In Stock</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="mt-16 flex justify-between">
            <div className="border-t border-slate-800 pt-2 w-48 text-center font-bold">Prepared By</div>
            <div className="border-t border-slate-800 pt-2 w-48 text-center font-bold">Authorized By</div>
          </div>
        </div>
      </div>
    </div>
  );
};
