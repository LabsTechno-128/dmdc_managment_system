import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Search, FlaskConical, ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';

export const SampleCollectionDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data: billings, isLoading } = useQuery({
    queryKey: ['sample-collection-search', search],
    queryFn: async () => {
      const res = await api.get(`/sample-collection/search?query=${encodeURIComponent(search)}`);
      return res.data; // res is { data: [...] } from interceptor, so res.data is the array
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FlaskConical className="text-blue-600" />
            Sample Collection
          </h2>
          <p className="text-slate-500">Search for patients or billings to collect samples</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search by Patient ID, Name, or Invoice ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice / Bill No</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tests Count</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="p-4 text-center text-slate-500">Searching...</td></tr>
              ) : billings?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    <FlaskConical size={48} className="mx-auto mb-4 text-slate-300" />
                    <p>No billings found. Try searching for a specific patient or invoice.</p>
                  </td>
                </tr>
              ) : (
                billings?.map((billing: any) => {
                  const testsCount = billing.items?.filter((i: any) => i.test).length || 0;
                  return (
                    <tr key={billing.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-slate-600">{new Date(billing.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 font-mono font-medium text-slate-800">{billing.billNumber}</td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-800">{billing.patient?.name}</div>
                        <div className="text-xs text-slate-500">ID: {billing.patient?.patientId}</div>
                      </td>
                      <td className="p-4 text-slate-600">{testsCount} Tests</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          billing.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {billing.paymentStatus}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => {
                            if (testsCount === 0) {
                              toast.warn('This billing has no lab tests to collect.');
                              return;
                            }
                            navigate(`/sample-collection/${billing.id}`);
                          }}
                          className="inline-flex items-center gap-1 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-medium transition-colors"
                        >
                          Collect
                          <ArrowRight size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
