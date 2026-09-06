import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Plus, Edit2, Trash2, PackageSearch } from 'lucide-react';
import { toast } from 'react-toastify';
import { DeleteModal } from '../../components/DeleteModal';

export const InventoryItems: React.FC = () => {
  const queryClient = useQueryClient();
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryName, setCategoryName] = useState('');
  
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, name: string} | null>(null);

  const { data: items, isLoading } = useQuery({
    queryKey: ['inventory-items', search],
    queryFn: async () => {
      const res = await api.get(`/inventory/items?search=${encodeURIComponent(search)}`);
      return res.data;
    }
  });

  const { data: categories } = useQuery({
    queryKey: ['inventory-categories'],
    queryFn: async () => {
      const res = await api.get('/inventory/categories');
      return res.data;
    }
  });

  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    description: '',
    unit: 'Piece',
    minStockLevel: 0,
    supplier: ''
  });

  const createItemMutation = useMutation({
    mutationFn: (data: any) => api.post('/inventory/items', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      setIsItemModalOpen(false);
      toast.success('Item created successfully');
      setFormData({ name: '', categoryId: '', description: '', unit: 'Piece', minStockLevel: 0, supplier: '' });
      setEditItemId(null);
    },
    onError: () => toast.error('Failed to create item')
  });

  const updateItemMutation = useMutation({
    mutationFn: (data: any) => api.put(`/inventory/items/${editItemId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      setIsItemModalOpen(false);
      toast.success('Item updated successfully');
      setFormData({ name: '', categoryId: '', description: '', unit: 'Piece', minStockLevel: 0, supplier: '' });
      setEditItemId(null);
    },
    onError: () => toast.error('Failed to update item')
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/inventory/items/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      toast.success('Item deleted successfully');
    },
    onError: () => toast.error('Failed to delete item. It might have stock history.')
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data: { name: string }) => api.post('/inventory/categories', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-categories'] });
      setIsCategoryModalOpen(false);
      toast.success('Category created successfully');
      setCategoryName('');
    },
    onError: () => toast.error('Failed to create category')
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editItemId) {
        updateItemMutation.mutate(formData);
    } else {
        createItemMutation.mutate(formData);
    }
  };

  const handleEditClick = (item: any) => {
      setFormData({
          name: item.name,
          categoryId: item.category?.id || '',
          description: item.description || '',
          unit: item.unit,
          minStockLevel: item.minStockLevel,
          supplier: item.supplier || ''
      });
      setEditItemId(item.id);
      setIsItemModalOpen(true);
  };

  const handleDeleteClick = (item: any) => {
      setItemToDelete({ id: item.id, name: item.name });
      setIsDeleteModalOpen(true);
  };

  const handleModalClose = () => {
      setIsItemModalOpen(false);
      setEditItemId(null);
      setFormData({ name: '', categoryId: '', description: '', unit: 'Piece', minStockLevel: 0, supplier: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Inventory Items</h2>
          <p className="text-slate-500">Manage your inventory catalog</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
          >
            <Plus size={20} />
            New Category
          </button>
          <button
            onClick={() => setIsItemModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            New Item
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <div className="relative max-w-md">
            <PackageSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Item Name</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Current Stock</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Min Stock</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr>
              ) : items?.length === 0 ? (
                <tr><td colSpan={5} className="p-4 text-center">No items found.</td></tr>
              ) : (
                items?.map((item: any) => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4 font-medium text-slate-800">{item.name}</td>
                    <td className="p-4 text-slate-600">{item.category?.name}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${item.currentStock <= item.minStockLevel ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {item.currentStock} {item.unit}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">{item.minStockLevel} {item.unit}</td>
                    <td className="p-4 flex gap-2">
                      <button onClick={() => handleEditClick(item)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded bg-slate-100 hover:bg-blue-50">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDeleteClick(item)} className="p-1.5 text-slate-400 hover:text-red-600 rounded bg-slate-100 hover:bg-red-50">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">{editItemId ? 'Edit Item' : 'Add New Item'}</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Item Name *</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                <select required value={formData.categoryId} onChange={e => setFormData({ ...formData, categoryId: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select a category</option>
                  {categories?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Unit *</label>
                  <input required type="text" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Box, Piece" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Min Stock *</label>
                  <input required type="number" min="0" value={formData.minStockLevel} onChange={e => setFormData({ ...formData, minStockLevel: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={handleModalClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={createItemMutation.isPending || updateItemMutation.isPending} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {createItemMutation.isPending || updateItemMutation.isPending ? 'Saving...' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">Add New Category</h3>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); createCategoryMutation.mutate({ name: categoryName }); }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category Name *</label>
                <input required type="text" value={categoryName} onChange={e => setCategoryName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500" placeholder="e.g. Reagents" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={createCategoryMutation.isPending || !categoryName.trim()} className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors disabled:opacity-50">
                  {createCategoryMutation.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <DeleteModal 
        isOpen={isDeleteModalOpen}
        onClose={() => {
            setIsDeleteModalOpen(false);
            setItemToDelete(null);
        }}
        onConfirm={() => {
            if (itemToDelete) {
                deleteItemMutation.mutate(itemToDelete.id);
            }
        }}
        itemName={itemToDelete?.name}
        isDeleting={deleteItemMutation.isPending}
      />
    </div>
  );
};
