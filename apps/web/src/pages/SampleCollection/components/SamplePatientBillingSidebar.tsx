import React from 'react';
import { FlaskConical, Printer, Package } from 'lucide-react';

interface CollectionItemSummary {
  id: string;
  name: string;
  unit?: string;
  quantity: number;
}

interface SamplePatientBillingSidebarProps {
  billing: any;
  initialized: boolean;
  isPaid: boolean;
  isInitializing: boolean;
  onInitialize: () => void;
  onPrintAll: () => void;
  allCollectionItems: CollectionItemSummary[];
  totalCollectionItemsCount: number;
}

export const SamplePatientBillingSidebar: React.FC<SamplePatientBillingSidebarProps> = ({
  billing,
  initialized,
  isPaid,
  isInitializing,
  onInitialize,
  onPrintAll,
  allCollectionItems,
  totalCollectionItemsCount
}) => {
  return (
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
              onClick={onInitialize}
              disabled={isInitializing}
              className="w-full flex justify-center items-center gap-2 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
            >
              <FlaskConical size={18} />
              {isInitializing ? 'Initializing...' : 'Initialize Sample Collection'}
            </button>
            <p className="text-xs text-center text-slate-500 mt-2">
              Click to generate tracking barcodes and start collection.
            </p>
          </div>
        )}

        {initialized && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <button
              onClick={onPrintAll}
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
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${totalCollectionItemsCount > 0
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
  );
};

