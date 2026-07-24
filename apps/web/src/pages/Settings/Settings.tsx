import React from 'react';
import { api } from '../../lib/api';
import { useQuery } from '@tanstack/react-query';
import { Building2, MapPin, Phone, Mail, DollarSign } from 'lucide-react';

const fetchSettings = async () => {
  const { data } = await api.get('/settings');
  return data;
};

export const Settings: React.FC = () => {
  const { data: settings, isLoading, isError } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-slate-500 mt-1">View system configuration and general settings</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading settings...</div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500">Error loading settings</div>
        ) : (
          <div className="p-6 sm:p-8 space-y-8">
            <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-4">General Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                <div className="space-y-6">
                    <div>
                        <label className="flex items-center space-x-2 text-sm font-medium text-slate-500 mb-2">
                            <Building2 size={16} />
                            <span>Diagnostic Center Name</span>
                        </label>
                        <div className="text-lg font-semibold text-slate-800 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                            {settings?.centerName}
                        </div>
                    </div>

                    <div>
                        <label className="flex items-center space-x-2 text-sm font-medium text-slate-500 mb-2">
                            <MapPin size={16} />
                            <span>Address</span>
                        </label>
                        <div className="text-base text-slate-800 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                            {settings?.address}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="flex items-center space-x-2 text-sm font-medium text-slate-500 mb-2">
                            <Phone size={16} />
                            <span>Phone Number</span>
                        </label>
                        <div className="text-base font-medium text-slate-800 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                            {settings?.phone}
                        </div>
                    </div>

                    <div>
                        <label className="flex items-center space-x-2 text-sm font-medium text-slate-500 mb-2">
                            <Mail size={16} />
                            <span>Email Address</span>
                        </label>
                        <div className="text-base font-medium text-slate-800 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                            {settings?.email}
                        </div>
                    </div>

                    <div>
                        <label className="flex items-center space-x-2 text-sm font-medium text-slate-500 mb-2">
                            <DollarSign size={16} />
                            <span>Default Currency</span>
                        </label>
                        <div className="text-base font-medium text-slate-800 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                            {settings?.currency}
                        </div>
                    </div>
                </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};
