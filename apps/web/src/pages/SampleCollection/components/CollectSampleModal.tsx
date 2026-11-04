import React from 'react';
import {
  FlaskConical,
  X,
  Plus,
  Package,
  Trash2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import type { UsedItemInput } from './SampleBarcodeComponents';

interface CollectSampleModalProps {
  sample: any | null;
  usedItems: UsedItemInput[];
  inventoryItemsData: any[];
  collectionNotes: string;
  isCollectionNotesEmpty: boolean;
  isCollectionFormInvalid: boolean;
  isPending: boolean;
  onClose: () => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onItemChange: (index: number, field: keyof UsedItemInput, value: any) => void;
  onNotesChange: (value: string) => void;
  onConfirm: () => void;
}

export const CollectSampleModal: React.FC<CollectSampleModalProps> = ({
  sample,
  usedItems,
  inventoryItemsData,
  collectionNotes,
  isCollectionNotesEmpty,
  isCollectionFormInvalid,
  isPending,
  onClose,
  onAddItem,
  onRemoveItem,
  onItemChange,
  onNotesChange,
  onConfirm
}) => {
  if (!sample) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="pr-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
              <FlaskConical className="text-blue-600" size={18} />
              {sample.status === 'COLLECTED' ? 'Log Additional Equipment' : 'Collect Sample'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              Test: <span className="font-semibold text-slate-700">{sample.test?.name}</span> (
              {sample.notes?.trim() ? sample.notes.trim() : 'General'}) &bull; Barcode:{' '}
              <span className="font-mono text-slate-700">{sample.barcode}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6">
          {/* Equipment and Inventory Deduction Section */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <label className="block text-sm font-bold text-slate-800">
                    Equipment &amp; Consumables Used <span className="text-red-500">*</span>
                  </label>
                  {usedItems.filter(u => u.itemId).length > 0 && (
                    <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200">
                      {usedItems
                        .filter(u => u.itemId)
                        .reduce((sum, u) => sum + (Number(u.quantity) || 0), 0)}{' '}
                      item(s) selected
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select syringes, collection tubes, or consumables used. Available stock will
                  decrease automatically.
                </p>
              </div>
              <button
                type="button"
                onClick={onAddItem}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
              >
                <Plus size={14} /> Add Item
              </button>
            </div>

            {usedItems.length === 0 ? (
              <div className="p-4 bg-red-50/60 border border-dashed border-red-300 rounded-xl text-center text-xs text-red-600">
                <Package className="mx-auto text-red-400 mb-1" size={24} />
                <p className="font-medium">
                  At least one inventory item is required. Click &quot;Add Item&quot; to select
                  supplies used.
                </p>
              </div>
            ) : (
              <div className="space-y-3 mt-3">
                {usedItems.map((usedItem, index) => {
                  const selectedInvItem = inventoryItemsData.find(
                    (i: any) => i.id === usedItem.itemId
                  );
                  const isOutOfStock = selectedInvItem && selectedInvItem.currentStock <= 0;
                  const isOverStock =
                    selectedInvItem && usedItem.quantity > selectedInvItem.currentStock;
                  const isInvalidQty = usedItem.quantity <= 0;

                  return (
                    <div
                      key={index}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2"
                    >
                      <div className="flex gap-2 items-start">
                        {/* Item Selector */}
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Item <span className="text-red-500">*</span>
                          </label>
                          <select
                            required
                            value={usedItem.itemId}
                            onChange={e => onItemChange(index, 'itemId', e.target.value)}
                            className={`w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 ${!usedItem.itemId
                              ? 'border-amber-300 focus:ring-blue-500'
                              : 'border-slate-200 focus:ring-blue-500'
                              }`}
                          >
                            <option value="">-- Select Item --</option>
                            {inventoryItemsData.map((item: any) => (
                              <option
                                key={item.id}
                                value={item.id}
                                disabled={item.currentStock <= 0}
                              >
                                {item.name} (
                                {item.currentStock > 0
                                  ? `Stock: ${item.currentStock} ${item.unit}`
                                  : 'Out of Stock'}
                                )
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quantity Input */}
                        <div className="w-28">
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Qty {selectedInvItem ? `(${selectedInvItem.unit})` : ''}{' '}
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            required
                            min="1"
                            max={selectedInvItem?.currentStock || 9999}
                            value={usedItem.quantity}
                            onChange={e =>
                              onItemChange(index, 'quantity', parseInt(e.target.value, 10) || 0)
                            }
                            className={`w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 ${isOverStock || isInvalidQty
                              ? 'border-red-400 focus:ring-red-500'
                              : 'border-slate-200 focus:ring-blue-500'
                              }`}
                          />
                        </div>

                        {/* Remove Row Button */}
                        <div className="pt-6">
                          <button
                            type="button"
                            onClick={() => onRemoveItem(index)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Inline Feedback / Warnings */}
                      {selectedInvItem && (
                        <div className="text-[11px] flex items-center justify-between px-1">
                          <span className="text-slate-500">
                            Current available stock:{' '}
                            <span className="font-semibold text-slate-700">
                              {selectedInvItem.currentStock} {selectedInvItem.unit}
                            </span>
                          </span>
                          {isOverStock && (
                            <span className="text-red-600 font-semibold flex items-center gap-1">
                              <AlertCircle size={12} />
                              Exceeds available stock
                            </span>
                          )}
                          {isOutOfStock && (
                            <span className="text-red-600 font-semibold flex items-center gap-1">
                              <AlertCircle size={12} />
                              Item is out of stock
                            </span>
                          )}
                          {isInvalidQty && (
                            <span className="text-red-600 font-semibold flex items-center gap-1">
                              <AlertCircle size={12} />
                              Must be &ge; 1
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notes Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Sample Types <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              required
              value={collectionNotes}
              onChange={e => onNotesChange(e.target.value)}
              placeholder="e.g. Left arm venipuncture, fast completed, good sample volume..."
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${isCollectionNotesEmpty
                ? 'border-amber-300 focus:ring-blue-500'
                : 'border-slate-200 focus:ring-blue-500'
                }`}
            />
            {isCollectionNotesEmpty && (
              <p className="mt-1 text-xs text-slate-500">
                Please enter sample type and select at least one item to confirm collection.
              </p>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer text-center"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending || isCollectionFormInvalid}
            className="w-full sm:w-auto px-5 py-2 text-sm font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-center"
          >
            {isPending ? (
              <>Processing...</>
            ) : (
              <>
                <CheckCircle size={16} />
                Confirm &amp; Collect
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

