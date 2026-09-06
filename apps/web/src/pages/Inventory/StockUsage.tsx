import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Minus, Search } from 'lucide-react';
import { toast } from 'react-toastify';

export const StockUsage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: usages, isLoading } = useQuery({
    queryKey: ['stock-usages', search],
    queryFn: async () => {
      const res = await api.get(`/inventory/stock-out?search=${encodeURIComponent(search)}`);
      return res.data;
    }
  });

  const { data: items } = useQuery({
    queryKey: ['inventory-items-available'],
    queryFn: async () => {
      const res = await api.get('/inventory/items');
      return res.data;
    }
  });

  const [formData, setFormData] = useState({
    itemId: '',
    quantity: 0,
    department: '',
    notes: ''
  });

  const recordUsageMutation = useMutation({
    mutationFn: (data: any) => api.post('/inventory/stock-out', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-usages'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-items-available'] });
      setIsModalOpen(false);
      toast.success('Stock usage recorded successfully');
      setFormData({ itemId: '', quantity: 0, department: '', notes: '' });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to record usage');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    recordUsageMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Stock Usage (Out)</h2>
          <p className="text-slate-500">Record daily item consumption (FEFO)</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Minus size={20} />
          Record Usage
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex gap-4">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search by item name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Item</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Batch Deducted</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Qty Used</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Department</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Used By</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="p-4 text-center">Loading...</td></tr>
              ) : usages?.length === 0 ? (
                <tr><td colSpan={6} className="p-4 text-center">No usage records found.</td></tr>
              ) : (
                usages?.map((usage: any) => (
                  <tr key={usage.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4 text-slate-600">{new Date(usage.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 font-medium text-slate-800">{usage.item?.name}</td>
                    <td className="p-4 text-slate-600 font-mono text-sm">{usage.batch?.batchNumber}</td>
                    <td className="p-4">
                      <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold">
                        -{usage.quantity} {usage.item?.unit}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">{usage.department || '-'}</td>
                    <td className="p-4 text-slate-600">{usage.usedBy?.firstName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Usage Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">Record Item Usage</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Item *</label>
                <select required value={formData.itemId} onChange={e => setFormData({ ...formData, itemId: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option value="">Select an item</option>
                  {items?.filter((i:any) => i.currentStock > 0).map((item: any) => (
                    <option key={item.id} value={item.id}>{item.name} (Stock: {item.currentStock} {item.unit})</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">Only items with available stock are shown. Oldest batch (FEFO) will be used first.</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Quantity Used *</label>
                <input required type="number" min="1" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Department / Purpose</label>
                <input type="text" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="e.g. Hematology Lab, Cleaning" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea rows={2} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={recordUsageMutation.isPending} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50">
                  {recordUsageMutation.isPending ? 'Recording...' : 'Record Usage'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
