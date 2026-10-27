import React, { useRef, useState, useEffect } from 'react';
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
import JsBarcode from 'jsbarcode';

interface UsedItemInput {
  itemId: string;
  quantity: number;
}

// Reusable SVG Barcode generator using JsBarcode
const BarcodeSvg: React.FC<{ value: string; width?: number; height?: number }> = ({
  value,
  width = 1.3,
  height = 28
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: 'CODE128',
          width,
          height,
          displayValue: false,
          margin: 0,
          background: 'transparent',
          lineColor: '#000000'
        });
      } catch (err) {
        console.warn('Failed to render barcode:', err);
      }
    }
  }, [value, width, height]);

  return <svg ref={svgRef} className="max-w-full h-auto inline-block" />;
};

// Helper to format items used for a sample
const getSampleItemsSummary = (sample: any) => {
  if (!sample.inventoryItems || sample.inventoryItems.length === 0) {
    return 'No equipment logged';
  }
  const map = new Map<string, { name: string; quantity: number }>();
  for (const si of sample.inventoryItems) {
    const key = si.itemId || si.item?.id || si.id;
    const name = si.item?.name || 'Equipment';
    const qty = Number(si.quantity) || 0;
    const existing = map.get(key);
    if (existing) {
      existing.quantity += qty;
    } else {
      map.set(key, { name, quantity: qty });
    }
  }
  return Array.from(map.values())
    .map(i => `${i.quantity}x ${i.name}`)
    .join(', ');
};

export const SampleCollectionInterface: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const printRef = useRef<HTMLDivElement>(null);
  const singlePrintRef = useRef<HTMLDivElement>(null);

  // Modal State for Collection & Inventory Deduction
  const [selectedSampleForCollection, setSelectedSampleForCollection] = useState<any | null>(null);
  const [usedItems, setUsedItems] = useState<UsedItemInput[]>([]);
  const [collectionNotes, setCollectionNotes] = useState('');
  const [singleSampleToPrint, setSingleSampleToPrint] = useState<any | null>(null);

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
      toast.success('Sample updated and inventory recorded successfully!');
      setSelectedSampleForCollection(null);
      setUsedItems([]);
      setCollectionNotes('');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['sample-collection-billing', id] });
      queryClient.invalidateQueries({ queryKey: ['inventory-items-available'] });
      queryClient.invalidateQueries({ queryKey: ['stock-usages'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-alerts'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || err?.response?.data?.message || 'Failed to update sample');
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
        #print-barcode, #print-single-barcode {
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

  const handleSinglePrint = useReactToPrint({
    contentRef: singlePrintRef,
    documentTitle: `Barcode-${singleSampleToPrint?.barcode || 'Print'}`,
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
        #print-single-barcode {
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

  const triggerSinglePrint = (sample: any) => {
    setSingleSampleToPrint(sample);
    setTimeout(() => {
      handleSinglePrint();
    }, 50);
  };

  const billing = data?.billing;
  const initialized = data?.initialized;
  const samples = data?.samples;
  const isPaid = billing?.paymentStatus === 'Paid';

  // Calculate collection-wide equipment totals across all samples (called unconditionally above early returns)
  const allCollectionItems: Array<{ id: string; name: string; unit?: string; quantity: number }> =
    React.useMemo(() => {
      if (!samples || !Array.isArray(samples)) return [];
      const itemMap = new Map<string, { id: string; name: string; unit?: string; quantity: number }>();

      for (const sample of samples) {
        if (sample.inventoryItems && Array.isArray(sample.inventoryItems)) {
          for (const si of sample.inventoryItems) {
            const itemId = si.itemId || si.item?.id;
            const name = si.item?.name || 'Equipment / Consumable';
            const unit = si.item?.unit || 'pcs';
            const qty = Number(si.quantity) || 0;
            if (itemId) {
              const existing = itemMap.get(itemId);
              if (existing) {
                existing.quantity += qty;
              } else {
                itemMap.set(itemId, { id: itemId, name, unit, quantity: qty });
              }
            }
          }
        }
      }
      return Array.from(itemMap.values());
    }, [samples]);

  const totalCollectionItemsCount: number = allCollectionItems.reduce(
    (sum: number, item) => sum + item.quantity,
    0
  );

  const openCollectModal = (sample: any) => {
    setSelectedSampleForCollection(sample);
    // Pre-populate with 1 empty item selector if inventory items exist and no items logged yet
    if (inventoryItemsData.length > 0 && (!sample.inventoryItems || sample.inventoryItems.length === 0)) {
      setUsedItems([{ itemId: '', quantity: 1 }]);
    } else {
      setUsedItems([]);
    }
    setCollectionNotes(sample.notes || '');
  };

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">
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

            <h3 className="text-base sm:text-lg font-bold text-slate-800 mt-6 mb-4 border-b border-slate-100 pb-2">
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
                  className="w-full flex justify-center items-center gap-2 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
                >
                  <FlaskConical size={18} />
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
                  className="w-full flex justify-center items-center gap-2 py-3 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-900 transition-colors text-sm"
                >
                  <Printer size={18} />
                  Print All Barcodes
                </button>
              </div>
            )}
          </div>

          {/* Collection Equipment & Supplies Summary Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                <Package className="text-blue-600" size={18} />
                Equipment &amp; Supplies Used
              </h3>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                  totalCollectionItemsCount > 0
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {totalCollectionItemsCount} item{totalCollectionItemsCount === 1 ? '' : 's'} total
              </span>
            </div>

            {allCollectionItems.length > 0 ? (
              <div className="space-y-2">
                {allCollectionItems.map(item => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-2.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-lg text-sm transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Package size={14} className="text-blue-500 shrink-0" />
                      <span className="font-medium text-slate-800 truncate">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-900 font-mono shrink-0 ml-2 bg-white px-2 py-0.5 rounded border border-slate-200 text-xs">
                      {item.quantity} {item.unit || 'pcs'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Package className="mx-auto text-slate-400 mb-1" size={24} />
                <p className="text-xs font-semibold text-slate-600">No equipment logged yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Supplies used will be tracked here across all collections &amp; recollections.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">Test List & Samples</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Test Name</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Sample Type</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Barcode</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Items Used</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {samples.map((sample: any) => {
                    const sampleItems = sample.inventoryItems || [];
                    const groupedMap = new Map<string, { id: string; name: string; unit?: string; quantity: number }>();
                    for (const si of sampleItems) {
                      const key = si.itemId || si.item?.id || si.id;
                      const name = si.item?.name || 'Item';
                      const unit = si.item?.unit || 'pcs';
                      const qty = Number(si.quantity) || 0;
                      const ex = groupedMap.get(key);
                      if (ex) {
                        ex.quantity += qty;
                      } else {
                        groupedMap.set(key, { id: key, name, unit, quantity: qty });
                      }
                    }
                    const groupedList = Array.from(groupedMap.values());
                    const sampleItemsCount = groupedList.reduce((acc, si) => acc + si.quantity, 0);

                    return (
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
                          {groupedList.length > 0 ? (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 text-xs font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full border border-blue-200">
                                  <Package size={11} className="text-blue-600" />
                                  {sampleItemsCount} item{sampleItemsCount === 1 ? '' : 's'} used
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {groupedList.map((si: any) => (
                                  <span
                                    key={si.id}
                                    className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium border border-slate-200"
                                  >
                                    <Package size={11} className="text-slate-400" />
                                    {si.quantity}x {si.name}
                                  </span>
                                ))}
                              </div>
                              {sample.status === 'COLLECTED' && (
                                <button
                                  type="button"
                                  onClick={() => openCollectModal(sample)}
                                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer flex items-center gap-1 pt-0.5"
                                >
                                  <Plus size={11} /> Add More
                                </button>
                              )}
                            </div>
                          ) : sample.status === 'COLLECTED' ? (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium border border-amber-200">
                                0 items logged
                              </span>
                              <button
                                type="button"
                                onClick={() => openCollectModal(sample)}
                                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                              >
                                + Log Equipment
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-4">{getStatusBadge(sample.status)}</td>
                        <td className="p-4 text-right">
                          {initialized && (sample.status === 'PENDING' || sample.status === 'RECOLLECTION_REQUIRED') && (
                            <button
                              onClick={() => openCollectModal(sample)}
                              className="px-3.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm transition-colors cursor-pointer shadow-sm"
                            >
                              Collect
                            </button>
                          )}
                          {initialized && sample.status === 'COLLECTED' && (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => triggerSinglePrint(sample)}
                                title="Print Label"
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer border border-slate-200 flex items-center gap-1 text-xs"
                              >
                                <Printer size={14} />
                              </button>
                              {groupedList.length === 0 && (
                                <button
                                  onClick={() => openCollectModal(sample)}
                                  className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-medium transition-colors cursor-pointer border border-blue-200"
                                >
                                  Log Items
                                </button>
                              )}
                              <button
                                onClick={() =>
                                  statusMutation.mutate({
                                    sampleId: sample.id,
                                    status: 'RECOLLECTION_REQUIRED'
                                  })
                                }
                                disabled={statusMutation.isPending}
                                className="px-2.5 py-1 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 border border-orange-200"
                              >
                                Recollect
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Collect Sample & Inventory Deduction Modal */}
      {selectedSampleForCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="pr-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                  <FlaskConical className="text-blue-600" size={18} />
                  {selectedSampleForCollection.status === 'COLLECTED'
                    ? 'Log Additional Equipment'
                    : 'Collect Sample'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  Test: <span className="font-semibold text-slate-700">{selectedSampleForCollection.test?.name}</span> ({selectedSampleForCollection.sampleType}) &bull; Barcode: <span className="font-mono text-slate-700">{selectedSampleForCollection.barcode}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedSampleForCollection(null)}
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
                        Equipment &amp; Consumables Used
                      </label>
                      {usedItems.filter(u => u.itemId).length > 0 && (
                        <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200">
                          {usedItems.filter(u => u.itemId).reduce((sum, u) => sum + (Number(u.quantity) || 0), 0)} item(s) selected
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
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
            <div className="px-5 sm:px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setSelectedSampleForCollection(null)}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCollection}
                disabled={statusMutation.isPending || hasInvalidItems}
                className="w-full sm:w-auto px-5 py-2 text-sm font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-center"
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

      {/* Hidden Print Area - All Barcodes */}
      <div className="hidden">
        <div ref={printRef} id="print-barcode">
          {initialized &&
            samples.map((sample: any) => (
              <div key={sample.id} className="barcode-label">
                <div className="w-full flex justify-center">
                  <div className="w-11/12 flex flex-col items-start justify-center text-left py-1">
                    {/* 1. Patient Name */}
                    <div className="text-[12px] font-bold text-black truncate w-full leading-tight">
                      <span className="text-[9px] font-normal text-slate-500 uppercase block">Patient Name</span>
                      <span className="truncate">{billing.patient?.name}</span>
                    </div>

                    {/* 2. Bill ID & 3. Sample ID */}
                    <div className="w-full flex justify-between items-center text-[10px] text-black leading-tight mt-1 border-t border-slate-200 pt-0.5">
                      <div>
                        <span className="text-[9px] text-slate-500 block">Bill ID</span>
                        <strong className="font-mono">{billing.billNumber}</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-slate-500 block">Sample ID</span>
                        <strong className="font-mono">
                          {sample.id ? sample.id.slice(0, 8).toUpperCase() : sample.barcode}
                        </strong>
                      </div>
                    </div>

                    {/* 4. Barcode */}
                    <div className="w-full flex flex-col items-center justify-center my-1">
                      <BarcodeSvg value={sample.barcode} width={1.2} height={26} />
                      <span className="text-[9px] font-mono font-bold text-black tracking-wider mt-0.5">
                        {sample.barcode}
                      </span>
                    </div>

                    {/* 5. Item Name Used */}
                    <div className="w-full text-[10px] leading-tight border-t border-slate-200 pt-1">
                      <span className="text-[9px] text-slate-500 uppercase block">Item Name Used</span>
                      <span className="font-semibold text-black break-words">
                        {getSampleItemsSummary(sample)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Hidden Print Area - Single Sample Barcode */}
      <div className="hidden">
        <div ref={singlePrintRef} id="print-single-barcode">
          {singleSampleToPrint && (
            <div className="barcode-label">
              <div className="w-full flex justify-center">
                <div className="w-11/12 flex flex-col items-start justify-center text-left py-1">
                  {/* 1. Patient Name */}
                  <div className="text-[12px] font-bold text-black truncate w-full leading-tight">
                    <span className="text-[9px] font-normal text-slate-500 uppercase block">Patient Name</span>
                    <span className="truncate">{billing.patient?.name}</span>
                  </div>

                  {/* 2. Bill ID & 3. Sample ID */}
                  <div className="w-full flex justify-between items-center text-[10px] text-black leading-tight mt-1 border-t border-slate-200 pt-0.5">
                    <div>
                      <span className="text-[9px] text-slate-500 block">Bill ID</span>
                      <strong className="font-mono">{billing.billNumber}</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-500 block">Sample ID</span>
                      <strong className="font-mono">
                        {singleSampleToPrint.id
                          ? singleSampleToPrint.id.slice(0, 8).toUpperCase()
                          : singleSampleToPrint.barcode}
                      </strong>
                    </div>
                  </div>

                  {/* 4. Barcode */}
                  <div className="w-full flex flex-col items-center justify-center my-1">
                    <BarcodeSvg value={singleSampleToPrint.barcode} width={1.2} height={26} />
                    <span className="text-[9px] font-mono font-bold text-black tracking-wider mt-0.5">
                      {singleSampleToPrint.barcode}
                    </span>
                  </div>

                  {/* 5. Item Name Used */}
                  <div className="w-full text-[10px] leading-tight border-t border-slate-200 pt-1">
                    <span className="text-[9px] text-slate-500 uppercase block">Item Name Used</span>
                    <span className="font-semibold text-black break-words">
                      {getSampleItemsSummary(singleSampleToPrint)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
