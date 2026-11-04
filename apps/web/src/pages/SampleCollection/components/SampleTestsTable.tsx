import React from 'react';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Package,
  Plus
} from 'lucide-react';

interface SampleTestsTableProps {
  samples: any[];
  initialized: boolean;
  isUpdatingStatus: boolean;
  onOpenCollectModal: (sample: any) => void;
  onPrintSingleSample?: (sample: any) => void;
  onRequestRecollect: (sampleId: string) => void;
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

export const SampleTestsTable: React.FC<SampleTestsTableProps> = ({
  samples,
  initialized,
  isUpdatingStatus,
  onOpenCollectModal,
  onPrintSingleSample: _onPrintSingleSample,
  onRequestRecollect
}) => {
  return (
    <div className="lg:col-span-2 min-w-0">
      <div className="w-full max-w-[1400px] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <h3 className="font-bold text-slate-800 text-sm sm:text-base">Test List &amp; Samples</h3>
        </div>
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse table-auto min-w-0 max-[999px]:min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="p-3.5 text-xs font-bold text-slate-500 uppercase">Test Name</th>
                <th className="p-3.5 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">
                  Sample Type
                </th>
                <th className="p-3.5 text-xs font-bold text-slate-500 uppercase">Items Used</th>
                <th className="p-3.5 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">
                  Status
                </th>
                <th className="p-3.5 text-xs font-bold text-slate-500 uppercase text-right whitespace-nowrap">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {samples.map((sample: any) => {
                const sampleItems = sample.inventoryItems || [];
                const groupedMap = new Map<
                  string,
                  { id: string; name: string; unit?: string; quantity: number }
                >();
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
                    <td className="p-3.5 font-medium text-slate-800 break-words">
                      {sample.test?.name}
                    </td>
                    <td className="p-3.5 text-slate-600 break-words">
                      {sample.notes?.trim() ? sample.notes.trim() : 'General'}
                    </td>
                    <td className="p-3.5">
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
                              onClick={() => onOpenCollectModal(sample)}
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
                            onClick={() => onOpenCollectModal(sample)}
                            className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                          >
                            + Log Equipment
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">{getStatusBadge(sample.status)}</td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      {initialized &&
                        (sample.status === 'PENDING' ||
                          sample.status === 'RECOLLECTION_REQUIRED') && (
                          <button
                            onClick={() => onOpenCollectModal(sample)}
                            className="px-3.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm transition-colors cursor-pointer shadow-sm"
                          >
                            Collect
                          </button>
                        )}
                      {initialized && sample.status === 'COLLECTED' && (
                        <div className="flex items-center justify-end gap-1.5">
                          {/* <button
                            onClick={() => onPrintSingleSample(sample)}
                            title="Print Label"
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer border border-slate-200 flex items-center gap-1 text-xs"
                          >
                            <Printer size={14} />
                          </button> */}
                          {groupedList.length === 0 && (
                            <button
                              onClick={() => onOpenCollectModal(sample)}
                              className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-medium transition-colors cursor-pointer border border-blue-200"
                            >
                              Log Items
                            </button>
                          )}
                          <button
                            onClick={() => onRequestRecollect(sample.id)}
                            disabled={isUpdatingStatus}
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
  );
};

