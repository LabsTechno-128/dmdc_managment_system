import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, MapPin, Phone, Mail, DollarSign, Receipt, FileText, Percent, Save } from 'lucide-react';
import { FormSkeleton } from '../../components/skeleton/FormSkeleton';
import { toast } from 'react-toastify';
import { useAuthStore } from '../../store/authStore';

const fetchSettings = async () => {
  const { data } = await api.get('/settings');
  return data?.data || data;
};

export const Settings: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  const { data: settings, isLoading, isError } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  });

  const [formData, setFormData] = useState({
    centerName: '',
    address: '',
    phone: '',
    email: '',
    currency: 'BDT',
    bin: '',
    musakForm: '',
    defaultVatRate: 0,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        centerName: settings.centerName || '',
        address: settings.address || '',
        phone: settings.phone || '',
        email: settings.email || '',
        currency: settings.currency || 'BDT',
        bin: settings.bin || '001234567-0101',
        musakForm: settings.musakForm || 'Mushak-6.3 (মূসক-৬.৩)',
        defaultVatRate: Number(settings.defaultVatRate) || 0,
      });
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) => api.patch('/settings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Hospital settings updated successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update settings');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error('Only administrators can update hospital settings');
      return;
    }
    updateMutation.mutate(formData);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System & Tax Settings</h1>
          <p className="text-slate-500 mt-1">Configure diagnostic center profile, VAT, and Bangladesh NBR MUSAK compliance</p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            {updateMutation.isPending ? (
              <span>Saving...</span>
            ) : (
              <>
                <Save size={16} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6 sm:p-8">
        {isLoading ? (
          <FormSkeleton />
        ) : isError ? (
          <div className="p-8 text-center text-red-500">Error loading settings</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                <Building2 size={20} className="text-primary" />
                <span>Diagnostic Center Profile</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-slate-600 mb-2">
                    <Building2 size={16} className="text-slate-400" />
                    <span>Center Legal Name</span>
                  </label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={formData.centerName}
                    onChange={(e) => setFormData({ ...formData, centerName: e.target.value })}
                    className="w-full text-base font-semibold text-slate-800 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 focus:bg-white focus:border-primary focus:outline-none transition-colors disabled:opacity-80"
                  />
                </div>

                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-slate-600 mb-2">
                    <Phone size={16} className="text-slate-400" />
                    <span>Contact Phone</span>
                  </label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full text-base text-slate-800 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 focus:bg-white focus:border-primary focus:outline-none transition-colors disabled:opacity-80"
                  />
                </div>

                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-slate-600 mb-2">
                    <Mail size={16} className="text-slate-400" />
                    <span>Email Address</span>
                  </label>
                  <input
                    type="email"
                    disabled={!isAdmin}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full text-base text-slate-800 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 focus:bg-white focus:border-primary focus:outline-none transition-colors disabled:opacity-80"
                  />
                </div>

                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-slate-600 mb-2">
                    <DollarSign size={16} className="text-slate-400" />
                    <span>Base Currency</span>
                  </label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full text-base text-slate-800 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 focus:bg-white focus:border-primary focus:outline-none transition-colors disabled:opacity-80"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2 text-sm font-medium text-slate-600 mb-2">
                    <MapPin size={16} className="text-slate-400" />
                    <span>Clinic Address</span>
                  </label>
                  <textarea
                    rows={2}
                    disabled={!isAdmin}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full text-base text-slate-800 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 focus:bg-white focus:border-primary focus:outline-none transition-colors disabled:opacity-80"
                  />
                </div>
              </div>
            </div>

            {/* Tax & MUSAK Information Section */}
            <div className="pt-6 border-t border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                <Receipt size={20} className="text-primary" />
                <span>VAT & Bangladesh NBR MUSAK Compliance</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-slate-600 mb-2">
                    <FileText size={16} className="text-slate-400" />
                    <span>Business ID No. (BIN / VAT Reg.)</span>
                  </label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={formData.bin}
                    onChange={(e) => setFormData({ ...formData, bin: e.target.value })}
                    placeholder="e.g. 001234567-0101"
                    className="w-full font-mono text-base font-semibold text-slate-800 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 focus:bg-white focus:border-primary focus:outline-none transition-colors disabled:opacity-80"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">13-digit or 9-digit official VAT registration number</p>
                </div>

                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-slate-600 mb-2">
                    <FileText size={16} className="text-slate-400" />
                    <span>MUSAK Form Reference</span>
                  </label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={formData.musakForm}
                    onChange={(e) => setFormData({ ...formData, musakForm: e.target.value })}
                    placeholder="e.g. Mushak-6.3 (মূসক-৬.৩)"
                    className="w-full text-base font-semibold text-slate-800 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 focus:bg-white focus:border-primary focus:outline-none transition-colors disabled:opacity-80"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Official NBR tax invoice form designation</p>
                </div>

                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-slate-600 mb-2">
                    <Percent size={16} className="text-slate-400" />
                    <span>Default VAT Rate (%)</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    disabled={!isAdmin}
                    value={formData.defaultVatRate}
                    onChange={(e) => setFormData({ ...formData, defaultVatRate: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full font-mono text-base font-semibold text-slate-800 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 focus:bg-white focus:border-primary focus:outline-none transition-colors disabled:opacity-80"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Default percentage applied to post-discount taxable amount</p>
                </div>
              </div>
            </div>

            {isAdmin && (
              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Save size={18} />
                  <span>{updateMutation.isPending ? 'Saving Settings...' : 'Save Settings'}</span>
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

