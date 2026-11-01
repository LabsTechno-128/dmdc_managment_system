import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { FlaskConical } from 'lucide-react';
import { SampleBillingSearchTable } from './components/SampleBillingSearchTable';

export const SampleCollectionDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data: billings, isLoading } = useQuery({
    queryKey: ['sample-collection-search', search],
    queryFn: async () => {
      const res = await api.get(`/sample-collection/search?query=${encodeURIComponent(search)}`);
      return res.data;
    }
  });

  return (
    <div className="space-y-6 w-full max-w-[1000px]">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FlaskConical className="text-blue-600" />
            Sample Collection
          </h2>
          <p className="text-slate-500">Search for patients or billings to collect samples</p>
        </div>
      </div>

      <SampleBillingSearchTable
        search={search}
        onSearchChange={setSearch}
        billings={billings}
        isLoading={isLoading}
        onSelectBilling={billingId => navigate(`/sample-collection/${billingId}`)}
      />
    </div>
  );
};
