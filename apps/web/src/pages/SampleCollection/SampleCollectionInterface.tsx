import React, { useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import { useReactToPrint } from 'react-to-print';
import {
  BarcodeSvg,
  SampleQrMatrixSvg,
  getSampleItemsSummary,
  SamplePrintLabels,
  type UsedItemInput
} from './components/SampleBarcodeComponents';
import { SamplePatientBillingSidebar } from './components/SamplePatientBillingSidebar';
import { SampleTestsTable } from './components/SampleTestsTable';
import { CollectSampleModal } from './components/CollectSampleModal';

export { BarcodeSvg, SampleQrMatrixSvg, getSampleItemsSummary };

const PRINT_PAGE_STYLE = `
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
`;

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
    pageStyle: PRINT_PAGE_STYLE
  });

  const handleSinglePrint = useReactToPrint({
    contentRef: singlePrintRef,
    documentTitle: `Barcode-${singleSampleToPrint?.barcode || 'Print'}`,
    pageStyle: PRINT_PAGE_STYLE
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

  // Calculate collection-wide equipment totals across all samples
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
    setUsedItems([{ itemId: '', quantity: 1 }]);
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

  const hasInvalidItems =
    usedItems.length === 0 ||
    usedItems.some(u => {
      if (!u.itemId) return true;
      const inv = inventoryItemsData.find((item: any) => item.id === u.itemId);
      if (!inv) return true;
      return u.quantity <= 0 || u.quantity > inv.currentStock;
    });

  const isCollectionNotesEmpty = !collectionNotes.trim();
  const isCollectionFormInvalid = hasInvalidItems || isCollectionNotesEmpty;

  const handleConfirmCollection = () => {
    if (!selectedSampleForCollection) return;
    if (hasInvalidItems) {
      toast.error('Please add and select at least one valid inventory item');
      return;
    }
    if (isCollectionNotesEmpty) {
      toast.error('Collection notes are required');
      return;
    }

    statusMutation.mutate({
      sampleId: selectedSampleForCollection.id,
      status: 'COLLECTED',
      notes: collectionNotes.trim(),
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
        <SamplePatientBillingSidebar
          billing={billing}
          initialized={initialized}
          isPaid={isPaid}
          isInitializing={initMutation.isPending}
          onInitialize={() => initMutation.mutate()}
          onPrintAll={() => handlePrint()}
          allCollectionItems={allCollectionItems}
          totalCollectionItemsCount={totalCollectionItemsCount}
        />

        <SampleTestsTable
          samples={samples}
          initialized={initialized}
          isUpdatingStatus={statusMutation.isPending}
          onOpenCollectModal={openCollectModal}
          onPrintSingleSample={triggerSinglePrint}
          onRequestRecollect={sampleId =>
            statusMutation.mutate({
              sampleId,
              status: 'RECOLLECTION_REQUIRED'
            })
          }
        />
      </div>

      <CollectSampleModal
        sample={selectedSampleForCollection}
        usedItems={usedItems}
        inventoryItemsData={inventoryItemsData}
        collectionNotes={collectionNotes}
        isCollectionNotesEmpty={isCollectionNotesEmpty}
        isCollectionFormInvalid={isCollectionFormInvalid}
        isPending={statusMutation.isPending}
        onClose={() => setSelectedSampleForCollection(null)}
        onAddItem={handleAddItem}
        onRemoveItem={handleRemoveItem}
        onItemChange={handleItemChange}
        onNotesChange={setCollectionNotes}
        onConfirm={handleConfirmCollection}
      />

      <SamplePrintLabels
        printRef={printRef}
        singlePrintRef={singlePrintRef}
        initialized={initialized}
        samples={samples}
        billing={billing}
        singleSampleToPrint={singleSampleToPrint}
      />
    </div>
  );
};
