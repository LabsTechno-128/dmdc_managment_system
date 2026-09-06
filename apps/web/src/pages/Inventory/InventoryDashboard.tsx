import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Package, AlertTriangle, Clock, TrendingUp } from 'lucide-react';

export const InventoryDashboard: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['inventory-stats'],
    queryFn: async () => {
      const res = await api.get('/inventory/dashboard-stats');
      return res.data;
    }
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['inventory-alerts'],
    queryFn: async () => {
      const res = await api.get('/inventory/alerts');
      return res.data;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Inventory Dashboard</h2>
          <p className="text-slate-500">Overview of your stock and alerts</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Items</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">
                {statsLoading ? '...' : stats?.totalItems || 0}
              </h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Package size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Categories</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">
                {statsLoading ? '...' : stats?.totalCategories || 0}
              </h3>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Inventory Value (BDT)</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">
                {statsLoading ? '...' : Number(stats?.totalInventoryValue || 0).toLocaleString()}
              </h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <span className="font-bold text-lg">৳</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-red-50/50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="text-red-500" size={20} />
              Low Stock Alerts
            </h3>
            <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full">
              {alerts?.lowStock?.length || 0} Items
            </span>
          </div>
          <div className="p-0">
            {alertsLoading ? (
              <p className="p-5 text-center text-slate-500">Loading...</p>
            ) : alerts?.lowStock?.length === 0 ? (
              <p className="p-5 text-center text-slate-500">No low stock items.</p>
            ) : (
              <ul className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {alerts?.lowStock?.map((item: any) => (
                  <li key={item.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                    <div>
                      <p className="font-semibold text-slate-800">{item.name}</p>
                      <p className="text-xs text-slate-500">Min: {item.minStockLevel} {item.unit}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${item.currentStock === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                        {item.currentStock} {item.unit}
                      </p>
                      <p className="text-xs text-slate-500">Current Stock</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Expiry Alerts */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-amber-50/50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Clock className="text-amber-500" size={20} />
              Expiring Soon (30 Days)
            </h3>
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">
              {alerts?.expiringBatches?.length || 0} Batches
            </span>
          </div>
          <div className="p-0">
            {alertsLoading ? (
              <p className="p-5 text-center text-slate-500">Loading...</p>
            ) : alerts?.expiringBatches?.length === 0 ? (
              <p className="p-5 text-center text-slate-500">No batches expiring soon.</p>
            ) : (
              <ul className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {alerts?.expiringBatches?.map((batch: any) => {
                  const daysLeft = Math.ceil((new Date(batch.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                  const isExpired = daysLeft < 0;
                  return (
                    <li key={batch.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                      <div>
                        <p className="font-semibold text-slate-800">{batch.item?.name}</p>
                        <p className="text-xs text-slate-500">Batch: {batch.batchNumber} • Qty: {batch.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${isExpired ? 'text-red-600' : 'text-amber-600'}`}>
                          {isExpired ? 'Expired' : `${daysLeft} days left`}
                        </p>
                        <p className="text-xs text-slate-500">{new Date(batch.expiryDate).toLocaleDateString()}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
