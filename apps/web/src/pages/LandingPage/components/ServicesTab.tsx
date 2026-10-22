import React, { useState } from 'react';
import { Plus, Trash2, Edit2, HeartPulse, X } from 'lucide-react';
import type { ServicesSection, ServiceItem } from '../../../services/landing.service';

interface ServicesTabProps {
  services: ServicesSection;
  onChange: (updatedServices: Partial<ServicesSection>) => void;
}

export const ServicesTab: React.FC<ServicesTabProps> = ({ services, onChange }) => {
  const items = services.items || [];
  const [editingItem, setEditingItem] = useState<{ index: number; item: ServiceItem } | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const [newItem, setNewItem] = useState<ServiceItem>({
    id: `srv-${Date.now()}`,
    title: '',
    description: '',
    icon: 'Stethoscope',
    tag: 'Specialized Care',
    link: '#appointment',
  });

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem !== null) {
      const updated = [...items];
      updated[editingItem.index] = editingItem.item;
      onChange({ items: updated });
      setEditingItem(null);
    } else if (isAddingNew) {
      if (!newItem.title) return;
      onChange({ items: [...items, { ...newItem, id: `srv-${Date.now()}` }] });
      setIsAddingNew(false);
      setNewItem({
        id: `srv-${Date.now()}`,
        title: '',
        description: '',
        icon: 'Stethoscope',
        tag: 'Specialized Care',
        link: '#appointment',
      });
    }
  };

  const handleRemoveItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    onChange({ items: updated });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Services & Specialties Section</h3>
        <p className="text-sm text-slate-500 mt-1">
          Manage clinical specialties, service descriptions, tags, and the featured diagnostic check-up card.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-3">
          Section Header Copy
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">Section Badge</label>
            <input
              type="text"
              value={services.badge || ''}
              onChange={(e) => onChange({ badge: e.target.value })}
              placeholder="e.g. Our Specialities"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">Main Heading</label>
            <input
              type="text"
              value={services.title || ''}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="e.g. Comprehensive Medical Services & Diagnostic Specialties"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">Section Description</label>
          <textarea
            rows={2}
            value={services.description || ''}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Overview of departmental equipment and clinical scope..."
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
          />
        </div>
      </div>

      {/* Services List */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h4 className="text-base font-bold text-slate-900">Configured Specialties ({items.length})</h4>
            <p className="text-xs text-slate-500">Displayed in the interactive services grid on the landing page</p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddingNew(true)}
            className="cursor-pointer inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow transition"
          >
            <Plus size={15} />
            <span>Add Specialty</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          {items.map((item, index) => (
            <div
              key={item.id || index}
              className="border border-slate-200/80 rounded-2xl p-5 hover:border-blue-300 hover:shadow-md transition bg-white flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                    <HeartPulse size={20} />
                  </span>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {item.tag || 'Specialty'}
                  </span>
                </div>
                <div>
                  <h5 className="font-bold text-slate-900 text-base">{item.title}</h5>
                  <p className="text-xs text-slate-500 line-clamp-3 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100 mt-4">
                <button
                  type="button"
                  onClick={() => setEditingItem({ index, item: { ...item } })}
                  className="cursor-pointer p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
                  title="Edit Specialty"
                >
                  <Edit2 size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  className="cursor-pointer p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                  title="Remove Specialty"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400">
              No specialties configured. Click "Add Specialty" above to create one.
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Specialty Modal */}
      {(isAddingNew || editingItem !== null) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-100">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-lg font-bold text-slate-900">
                {isAddingNew ? 'Add New Clinical Specialty' : `Edit: ${editingItem?.item.title}`}
              </h4>
              <button
                type="button"
                onClick={() => {
                  setIsAddingNew(false);
                  setEditingItem(null);
                }}
                className="cursor-pointer p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                  Specialty Title
                </label>
                <input
                  type="text"
                  value={editingItem ? editingItem.item.title : newItem.title}
                  onChange={(e) =>
                    editingItem
                      ? setEditingItem({
                          ...editingItem,
                          item: { ...editingItem.item, title: e.target.value },
                        })
                      : setNewItem({ ...newItem, title: e.target.value })
                  }
                  placeholder="e.g. Cardiology & Cardiovascular Care"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                  Category Tag Badge
                </label>
                <input
                  type="text"
                  value={editingItem ? editingItem.item.tag : newItem.tag}
                  onChange={(e) =>
                    editingItem
                      ? setEditingItem({
                          ...editingItem,
                          item: { ...editingItem.item, tag: e.target.value },
                        })
                      : setNewItem({ ...newItem, tag: e.target.value })
                  }
                  placeholder="e.g. 24/7 Monitoring"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                  Service Description
                </label>
                <textarea
                  rows={3}
                  value={editingItem ? editingItem.item.description : newItem.description}
                  onChange={(e) =>
                    editingItem
                      ? setEditingItem({
                          ...editingItem,
                          item: { ...editingItem.item, description: e.target.value },
                        })
                      : setNewItem({ ...newItem, description: e.target.value })
                  }
                  placeholder="Clinical procedures, tests offered, and specialist oversight..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNew(false);
                    setEditingItem(null);
                  }}
                  className="cursor-pointer px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cursor-pointer px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow"
                >
                  Save Specialty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
