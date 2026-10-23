import React, { useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import {
  ArrowLeft,
  Printer,
  FlaskConical,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Plus,
  Trash2,
  Package,
  X,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useReactToPrint } from 'react-to-print';

interface UsedItemInput {
  itemId: string;
  quantity: number;
}

export const SampleCollectionInterface: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const printRef = useRef<HTMLDivElement>(null);

  // Modal State for Collection & Inventory Deduction
  const [selectedSampleForCollection, setSelectedSampleForCollection] = useState<any | null>(null);
  const [usedItems, setUsedItems] = useState<UsedItemInput[]>([]);
  const [collectionNotes, setCollectionNotes] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['sample-collection-billing', id],
    queryFn: async () => {
      const res = await api.get(`/sample-collection/billing/${id}`);
      return res.data;
    },
    enabled: !!id
  });

  // Query available inventory items
  const { data: inventoryItemsData = [] } = useQuery({
    queryKey: ['inventory-items-available'],
    queryFn: async () => {
      const res = await api.get('/inventory/items');
      return res.data;
    }
  });

  const initMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/sample-collection/billing/${id}/initialize`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Sample collection initialized successfully!');
      refetch();
    },
    onError: (err: any) => {
      toast.error(err?.message || err?.response?.data?.message || 'Failed to initialize');
    }
  });

  const statusMutation = useMutation({
    mutationFn: async ({
      sampleId,
      status,
      notes,
      items
    }: {
      sampleId: string;
      status: string;
      notes?: string;
      items?: UsedItemInput[];
    }) => {
      const res = await api.patch(`/sample-collection/${sampleId}/status`, {
        status,
        notes,
        items
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Sample collected and inventory deducted successfully!');
      setSelectedSampleForCollection(null);
      setUsedItems([]);
      setCollectionNotes('');
      queryClient.invalidateQueries({ queryKey: ['sample-collection-billing', id] });
      queryClient.invalidateQueries({ queryKey: ['inventory-items-available'] });
      queryClient.invalidateQueries({ queryKey: ['stock-usages'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-alerts'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || err?.response?.data?.message || 'Failed to update status');
    }
  });

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Barcodes-${data?.billing?.billNumber || 'Print'}`,
    pageStyle: `
      @page {
        size: auto !important;
        margin: 0 !important;
      }
      @media print {
        html, body {
          width: 100% !important;
          height: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          background: white;
        }
        #print-barcode {
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
        }
        .barcode-label {
          width: 100% !important;
          height: 100vh !important;
          padding: 2mm;
          margin: 0;
          page-break-after: always;
          break-after: page;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: white;
        }
      }
    `
  });

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading billing information...</div>;
  }

  if (!data || !data.billing) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-slate-800">Billing Not Found</h2>
        <button onClick={() => navigate('/sample-collection')} className="mt-4 text-blue-600 hover:underline">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const { billing, initialized, samples } = data;
  const isPaid = billing.paymentStatus === 'Paid';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COLLECTED':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">
            <CheckCircle size={14} /> Collected
          </span>
        );
      case 'PENDING':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-bold">
            <Clock size={14} /> Pending
          </span>
        );
      case 'RECOLLECTION_REQUIRED':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-bold">
            <AlertTriangle size={14} /> Recollection
          </span>
        );
      case 'REJECTED':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">
            <XCircle size={14} /> Rejected
          </span>
        );
      default:
        return null;
    }
  };

  // Used items management in modal
  const handleAddItem = () => {
    setUsedItems(prev => [...prev, { itemId: '', quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    setUsedItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof UsedItemInput, value: any) => {
    setUsedItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const hasInvalidItems = usedItems.some(u => {
    if (!u.itemId) return true;
    const inv = inventoryItemsData.find((item: any) => item.id === u.itemId);
    if (!inv) return true;
    return u.quantity <= 0 || u.quantity > inv.currentStock;
  });

  const handleConfirmCollection = () => {
    if (!selectedSampleForCollection) return;
    if (hasInvalidItems) return;

    statusMutation.mutate({
      sampleId: selectedSampleForCollection.id,
      status: 'COLLECTED',
      notes: collectionNotes.trim() || undefined,
      items: usedItems
        .filter(u => u.itemId && u.quantity > 0)
        .map(u => ({ itemId: u.itemId, quantity: Number(u.quantity) }))
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/sample-collection')}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            Sample Collection
            {!initialized && (
              <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full uppercase ml-2">
                Preview Mode
              </span>
            )}
          </h2>
          <p className="text-slate-500">Invoice: {billing.billNumber}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">
              Patient Details
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Patient ID:</span>{' '}
                <span className="font-semibold text-slate-800">{billing.patient?.patientId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Name:</span>{' '}
                <span className="font-semibold text-slate-800">{billing.patient?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Age/Gender:</span>{' '}
                <span className="font-semibold text-slate-800">
                  {billing.patient?.age} / {billing.patient?.gender}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>{' '}
                <span className="font-semibold text-slate-800">
                  {billing.patient?.contactNumber || '-'}
                </span>
              </div>
            </div>

            <h3 className="text-lg font-bold text-slate-800 mt-6 mb-4 border-b border-slate-100 pb-2">
              Billing Details
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice:</span>{' '}
                <span className="font-mono font-bold text-slate-800">{billing.billNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>{' '}
                <span className="font-semibold text-slate-800">
                  {new Date(billing.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className={`font-bold ${isPaid ? 'text-green-600' : 'text-orange-600'}`}>
                  {billing.paymentStatus}
                </span>
              </div>
            </div>

            {!initialized && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <button
                  onClick={() => initMutation.mutate()}
                  disabled={initMutation.isPending}
                  className="w-full flex justify-center items-center gap-2 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <FlaskConical size={20} />
                  {initMutation.isPending ? 'Initializing...' : 'Initialize Sample Collection'}
                </button>
                <p className="text-xs text-center text-slate-500 mt-2">
                  Click to generate tracking barcodes and start collection.
                </p>
              </div>
            )}

            {initialized && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <button
                  onClick={() => handlePrint()}
                  className="w-full flex justify-center items-center gap-2 py-3 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-900 transition-colors"
                >
                  <Printer size={20} />
                  Print All Barcodes
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h3 className="font-bold text-slate-800">Test List & Samples</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Test Name</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Sample Type</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Barcode</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Items Used</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {samples.map((sample: any) => (
                    <tr
                      key={sample.id || sample.barcodePreview}
                      className={!initialized ? 'opacity-60 bg-slate-50' : 'hover:bg-slate-50'}
                    >
                      <td className="p-4 font-medium text-slate-800">{sample.test?.name}</td>
                      <td className="p-4 text-slate-600">{sample.sampleType}</td>
                      <td className="p-4 font-mono text-sm text-slate-600">
                        {sample.barcode || sample.barcodePreview}
                      </td>
                      <td className="p-4">
                        {sample.inventoryItems && sample.inventoryItems.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {sample.inventoryItems.map((si: any) => (
                              <span
                                key={si.id}
                                className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium border border-slate-200"
                              >
                                <Package size={11} className="text-slate-400" />
                                {si.quantity}x {si.item?.name || 'Item'}
                              </span>
                            ))}
                          </div>
                        ) : sample.status === 'COLLECTED' ? (
                          <span className="text-xs text-slate-400 italic">No equipment logged</span>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                      <td className="p-4">{getStatusBadge(sample.status)}</td>
                      <td className="p-4 text-right">
                        {initialized && (sample.status === 'PENDING' || sample.status === 'RECOLLECTION_REQUIRED') && (
                          <button
                            onClick={() => {
                              setSelectedSampleForCollection(sample);
                              setUsedItems([]);
                              setCollectionNotes(sample.notes || '');
                            }}
                            className="px-3 py-1 bg-green-50 text-green-700 hover:bg-green-100 rounded font-medium text-sm transition-colors cursor-pointer"
                          >
                            Collect
                          </button>
                        )}
                        {initialized && sample.status === 'COLLECTED' && (
                          <button
                            onClick={() =>
                              statusMutation.mutate({
                                sampleId: sample.id,
                                status: 'RECOLLECTION_REQUIRED'
                              })
                            }
                            disabled={statusMutation.isPending}
                            className="px-3 py-1 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded font-medium text-sm transition-colors cursor-pointer disabled:opacity-50"
                          >
                            Recollect
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Collect Sample & Inventory Deduction Modal */}
      {selectedSampleForCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <FlaskConical className="text-blue-600" size={20} />
                  Collect Sample
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Test: <span className="font-semibold text-slate-700">{selectedSampleForCollection.test?.name}</span> ({selectedSampleForCollection.sampleType}) &bull; Barcode: <span className="font-mono text-slate-700">{selectedSampleForCollection.barcode}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedSampleForCollection(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Equipment and Inventory Deduction Section */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <label className="block text-sm font-bold text-slate-800">
                      Equipment & Consumables Used
                    </label>
                    <p className="text-xs text-slate-500">
                      Select syringes, collection tubes, or consumables used. Available stock will decrease automatically.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus size={14} /> Add Item
                  </button>
                </div>

                {usedItems.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center text-xs text-slate-500">
                    <Package className="mx-auto text-slate-400 mb-1" size={24} />
                    <p>No inventory items selected. Click &quot;Add Item&quot; if supplies were used, or proceed if none are required.</p>
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
                                Item
                              </label>
                              <select
                                value={usedItem.itemId}
                                onChange={e =>
                                  handleItemChange(index, 'itemId', e.target.value)
                                }
                                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">-- Select Item --</option>
                                {inventoryItemsData.map((item: any) => (
                                  <option
                                    key={item.id}
                                    value={item.id}
                                    disabled={item.currentStock <= 0}
                                  >
                                    {item.name} ({item.currentStock > 0 ? `Stock: ${item.currentStock} ${item.unit}` : 'Out of Stock'})
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Quantity Input */}
                            <div className="w-28">
                              <label className="block text-xs font-medium text-slate-600 mb-1">
                                Qty {selectedInvItem ? `(${selectedInvItem.unit})` : ''}
                              </label>
                              <input
                                type="number"
                                min="1"
                                max={selectedInvItem?.currentStock || 9999}
                                value={usedItem.quantity}
                                onChange={e =>
                                  handleItemChange(
                                    index,
                                    'quantity',
                                    parseInt(e.target.value, 10) || 0
                                  )
                                }
                                className={`w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 ${
                                  isOverStock || isInvalidQty
                                    ? 'border-red-400 focus:ring-red-500'
                                    : 'border-slate-200 focus:ring-blue-500'
                                }`}
                              />
                            </div>

                            {/* Remove Row Button */}
                            <div className="pt-6">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
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
                                Current available stock: <span className="font-semibold text-slate-700">{selectedInvItem.currentStock} {selectedInvItem.unit}</span>
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
                  Collection Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={collectionNotes}
                  onChange={e => setCollectionNotes(e.target.value)}
                  placeholder="e.g. Left arm venipuncture, fast completed, good sample volume..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedSampleForCollection(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCollection}
                disabled={statusMutation.isPending || hasInvalidItems}
                className="px-5 py-2 text-sm font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {statusMutation.isPending ? (
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
      )}

      {/* Hidden Print Area */}
      <div className="hidden">
        <div ref={printRef} id="print-barcode">
          {initialized &&
            samples.map((sample: any) => (
              <div key={sample.id} className="barcode-label">
                {/* Content left-aligned but block centered */}
                <div className="w-full flex justify-center">
                  <div className="w-11/12 flex flex-col items-start justify-center text-left">
                    {/* 1. Name and Age/Gender */}
                    <div className="font-bold text-[12px] text-black truncate w-full leading-tight flex items-center justify-start gap-1">
                      <span className="truncate">{billing.patient?.name}</span>
                      {(billing.patient?.age || billing.patient?.gender) && (
                        <span className="text-[10px] shrink-0 whitespace-nowrap">
                          ({billing.patient?.age ? `${billing.patient.age}y` : ''}
                          {billing.patient?.age && billing.patient?.gender ? ' ' : ''}
                          {billing.patient?.gender ? billing.patient.gender.charAt(0) : ''})
                        </span>
                      )}
                    </div>

                    {/* 2. Patient ID */}
                    <div className="text-[10px] font-bold text-black leading-tight mt-[2px]">
                      ID: {billing.patient?.patientId}
                    </div>

                    {/* 3. Test Name */}
                    <div className="font-bold text-[11px] text-black truncate w-full mt-[2px]">
                      {sample.test?.name}
                    </div>

                    {/* 4. Barcode Text */}
                    <div className="w-full flex flex-col items-start justify-center overflow-hidden mt-[2px]">
                      <span className="text-[10px] font-bold text-black leading-tight">Sample No:</span>
                      <h1 className="text-[9px] font-bold text-black leading-tight">{sample.barcode}</h1>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
