import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Plus, Search } from 'lucide-react';
import { toast } from 'react-toastify';

export const StockEntry: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: entries, isLoading } = useQuery({
    queryKey: ['stock-entries', search],
    queryFn: async () => {
      const res = await api.get(`/inventory/stock-in?search=${encodeURIComponent(search)}`);
      return res.data;
    }
  });

  const { data: items } = useQuery({
    queryKey: ['inventory-items-list'],
    queryFn: async () => {
      const res = await api.get('/inventory/items');
      return res.data;
    }
  });

  const [formData, setFormData] = useState({
    itemId: '',
    batchNumber: '',
    expiryDate: '',
    quantity: 0,
    unitPrice: 0,
    supplier: '',
    notes: ''
  });

  const createEntryMutation = useMutation({
    mutationFn: (data: any) => api.post('/inventory/stock-in', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-entries'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      setIsModalOpen(false);
      toast.success('Stock added successfully');
      setFormData({ itemId: '', batchNumber: '', expiryDate: '', quantity: 0, unitPrice: 0, supplier: '', notes: '' });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to add stock');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEntryMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Stock Entry (In)</h2>
          <p className="text-slate-500">Record incoming inventory stock</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus size={20} />
          Add Stock
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
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Item</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Batch & Expiry</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Quantity</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Total Price</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Added By</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="p-4 text-center">Loading...</td></tr>
              ) : entries?.length === 0 ? (
                <tr><td colSpan={6} className="p-4 text-center">No stock entries found.</td></tr>
              ) : (
                entries?.map((entry: any) => (
                  <tr key={entry.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4 text-slate-600">{new Date(entry.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 font-medium text-slate-800">{entry.item?.name}</td>
                    <td className="p-4">
                      <div className="text-sm font-semibold text-slate-700">{entry.batch?.batchNumber}</div>
                      <div className="text-xs text-slate-500">Exp: {new Date(entry.batch?.expiryDate).toLocaleDateString()}</div>
                    </td>
                    <td className="p-4">
                      <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold">
                        +{entry.quantity} {entry.item?.unit}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-slate-700">৳ {Number(entry.totalPrice).toLocaleString()}</td>
                    <td className="p-4 text-slate-600">{entry.createdBy?.firstName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Stock Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">Add New Stock</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Item *</label>
                  <select required value={formData.itemId} onChange={e => setFormData({ ...formData, itemId: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">Select an item</option>
                    {items?.map((item: any) => <option key={item.id} value={item.id}>{item.name} ({item.currentStock} {item.unit} available)</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Batch Number *</label>
                  <input required type="text" value={formData.batchNumber} onChange={e => setFormData({ ...formData, batchNumber: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date *</label>
                  <input required type="date" value={formData.expiryDate} onChange={e => setFormData({ ...formData, expiryDate: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quantity *</label>
                  <input required type="number" min="1" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Unit Price (BDT) *</label>
                  <input required type="number" min="0" step="0.01" value={formData.unitPrice} onChange={e => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>

                <div className="col-span-2 bg-slate-50 p-4 rounded-lg border border-slate-200 flex justify-between items-center">
                  <span className="font-medium text-slate-600">Total Price Calculated:</span>
                  <span className="text-xl font-bold text-emerald-600">৳ {(formData.quantity * formData.unitPrice).toLocaleString()}</span>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Supplier (Optional)</label>
                  <input type="text" value={formData.supplier} onChange={e => setFormData({ ...formData, supplier: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={createEntryMutation.isPending} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">
                  {createEntryMutation.isPending ? 'Saving...' : 'Save Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
