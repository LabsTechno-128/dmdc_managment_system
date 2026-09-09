import React, { useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { ArrowLeft, Printer, FlaskConical, CheckCircle, Clock, AlertTriangle, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { useReactToPrint } from 'react-to-print';
import JsBarcode from 'jsbarcode';

export const SampleCollectionInterface: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const printRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['sample-collection-billing', id],
    queryFn: async () => {
      const res = await api.get(`/sample-collection/billing/${id}`);
      return res.data;
    },
    enabled: !!id
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
      toast.error(err?.response?.data?.message || 'Failed to initialize');
    }
  });

  const statusMutation = useMutation({
    mutationFn: async ({ sampleId, status }: { sampleId: string; status: string }) => {
      const res = await api.patch(`/sample-collection/${sampleId}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Sample status updated');
      queryClient.invalidateQueries({ queryKey: ['sample-collection-billing', id] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update status');
    }
  });

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Barcodes-${data?.billing?.billNumber || 'Print'}`,
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
      case 'COLLECTED': return <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold"><CheckCircle size={14} /> Collected</span>;
      case 'PENDING': return <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-bold"><Clock size={14} /> Pending</span>;
      case 'RECOLLECTION_REQUIRED': return <span className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-bold"><AlertTriangle size={14} /> Recollection</span>;
      case 'REJECTED': return <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold"><XCircle size={14} /> Rejected</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/sample-collection')} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            Sample Collection
            {!initialized && <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full uppercase ml-2">Preview Mode</span>}
          </h2>
          <p className="text-slate-500">Invoice: {billing.billNumber}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Patient Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Patient ID:</span> <span className="font-semibold text-slate-800">{billing.patient?.patientId}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Name:</span> <span className="font-semibold text-slate-800">{billing.patient?.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Age/Gender:</span> <span className="font-semibold text-slate-800">{billing.patient?.age} / {billing.patient?.gender}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Phone:</span> <span className="font-semibold text-slate-800">{billing.patient?.contactNumber || '-'}</span></div>
            </div>

            <h3 className="text-lg font-bold text-slate-800 mt-6 mb-4 border-b border-slate-100 pb-2">Billing Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Invoice:</span> <span className="font-mono font-bold text-slate-800">{billing.billNumber}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Date:</span> <span className="font-semibold text-slate-800">{new Date(billing.createdAt).toLocaleDateString()}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Status:</span>
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
                <p className="text-xs text-center text-slate-500 mt-2">Click to generate tracking barcodes and start collection.</p>
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
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {samples.map((sample: any) => (
                    <tr key={sample.id || sample.barcodePreview} className={!initialized ? 'opacity-60 bg-slate-50' : 'hover:bg-slate-50'}>
                      <td className="p-4 font-medium text-slate-800">{sample.test?.name}</td>
                      <td className="p-4 text-slate-600">{sample.sampleType}</td>
                      <td className="p-4 font-mono text-sm text-slate-600">
                        {sample.barcode || sample.barcodePreview}
                      </td>
                      <td className="p-4">
                        {getStatusBadge(sample.status)}
                      </td>
                      <td className="p-4 text-right">
                        {initialized && sample.status === 'PENDING' && (
                          <button
                            onClick={() => statusMutation.mutate({ sampleId: sample.id, status: 'COLLECTED' })}
                            disabled={statusMutation.isPending}
                            className="px-3 py-1 bg-green-50 text-green-700 hover:bg-green-100 rounded font-medium text-sm transition-colors"
                          >
                            Collect
                          </button>
                        )}
                        {initialized && sample.status === 'COLLECTED' && (
                          <button
                            onClick={() => statusMutation.mutate({ sampleId: sample.id, status: 'RECOLLECTION_REQUIRED' })}
                            disabled={statusMutation.isPending}
                            className="px-3 py-1 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded font-medium text-sm transition-colors"
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

      {/* Hidden Print Area */}
      <div className="hidden">
        <div ref={printRef} className="print:p-0" id='print-barcode'>
          <div className="flex flex-wrap gap-2">
            {initialized && samples.map((sample: any) => (
              <div key={sample.id} className="w-[50mm] h-[25mm] p-1.5 flex flex-col break-inside-avoid bg-white text-black font-sans box-border overflow-hidden leading-tight border border-gray-200 print:border-none relative rounded-sm">
                
                {/* Top section: Patient Name & Age/Sex */}
                <div className="flex justify-between items-start w-full">
                  <div className="font-bold text-[10px] truncate pr-1 max-w-[70%] leading-none">{billing.patient?.name}</div>
                  <div className="text-[8px] font-semibold leading-none">{billing.patient?.age ? `${billing.patient.age}y` : ''} {billing.patient?.gender ? billing.patient.gender.charAt(0) : ''}</div>
                </div>
                
                {/* Second row: Patient ID and Invoice No */}
                <div className="flex justify-between w-full text-[8px] font-medium text-gray-800 mt-1 leading-none">
                  <span>ID: {billing.patient?.patientId}</span>
                  <span>INV: {billing.billNumber}</span>
                </div>
                
                {/* Third row: Test Name */}
                <div className="font-bold text-[9px] truncate w-full mt-1 leading-none pb-0.5 border-b border-gray-300 border-dashed">{sample.test?.name}</div>
                
                {/* Barcode component rendering */}
                <div className="w-full flex-grow flex items-end justify-center mt-0.5">
                  <Barcode value={sample.barcode} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

function Barcode({ value }: { value: string }) {
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (barcodeRef.current && value) {
      JsBarcode(barcodeRef.current, value, {
        format: "CODE128",
        width: 1.1,
        height: 24,
        displayValue: true,
        fontSize: 10,
        textMargin: 1,
        margin: 0,
        background: "transparent",
        lineColor: "#000000",
      });
    }
  }, [value]);

  return (
    <div className="flex flex-col items-center justify-center w-full overflow-hidden">
      <svg ref={barcodeRef} className="max-w-full max-h-full"></svg>
    </div>
  );
}
