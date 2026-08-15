import React, { useState, useRef, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Trash2, Printer, Search, User, FileText, CheckCircle2 } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { InvoicePrint } from './InvoicePrint';



// Schema for outside patient
const outsidePatientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(1, 'Phone is required'),
  age: z.number().min(0).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  referredBy: z.string().optional(),
});

const billingSchema = z.object({
  items: z.array(z.object({
    testId: z.string().min(1, 'Test is required'),
    price: z.number().min(0, 'Price must be positive'),
    name: z.string().optional(),
  })).min(1, 'At least one item is required'),
  discountType: z.enum(['PERCENTAGE', 'FIXED']),
  discount: z.number().min(0),
  additionalCharges: z.number().min(0),
  paymentMethod: z.string(),
  paymentStatus: z.string(),
});

export const NewBilling: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const printRef = useRef<HTMLDivElement>(null);
  
  const [activeTab, setActiveTab] = useState<'EXISTING' | 'OUTSIDE'>('EXISTING');
  const [searchPatientId, setSearchPatientId] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientSearchError, setPatientSearchError] = useState('');
  const [isSearchingPatient, setIsSearchingPatient] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState<any>(null);

  // Queries
  const { data: tests } = useQuery({
    queryKey: ['tests'],
    queryFn: async () => {
      const response = await api.get('/tests');
      return response.data?.data || response.data || [];
    },
  });

  // Forms
  const outsideForm = useForm({
    resolver: zodResolver(outsidePatientSchema),
    defaultValues: { name: '', phone: '', age: undefined, gender: 'MALE', referredBy: '' }
  });

  const billingForm = useForm({
    resolver: zodResolver(billingSchema),
    defaultValues: {
      items: [],
      discountType: 'FIXED' as const,
      discount: 0,
      additionalCharges: 0,
      paymentMethod: 'Cash',
      paymentStatus: 'Unpaid'
    }
  });

  const { fields: billingItems, append: appendItem, remove: removeItem } = useFieldArray({
    control: billingForm.control,
    name: 'items',
  });

  // Print function
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    onAfterPrint: () => {
      navigate('/billing');
    }
  });

  // Trigger print automatically when invoice is created and print is requested
  useEffect(() => {
    if (createdInvoice) {
      setTimeout(() => {
        handlePrint();
      }, 500); // Wait for render
    }
  }, [createdInvoice]);

  // Derived calculations
  const watchItems = billingForm.watch('items');
  const watchDiscountType = billingForm.watch('discountType');
  const watchDiscount = billingForm.watch('discount') || 0;
  const watchAdditionalCharges = billingForm.watch('additionalCharges') || 0;

  const subtotal = watchItems.reduce((acc, item) => acc + (Number(item.price) || 0), 0);
  let discountAmount = 0;
  if (watchDiscountType === 'PERCENTAGE') {
    discountAmount = subtotal * (watchDiscount / 100);
  } else {
    discountAmount = watchDiscount;
  }
  const totalAmount = Math.max(0, subtotal - discountAmount + watchAdditionalCharges);

  // Patient Search
  const searchPatient = async () => {
    if (!searchPatientId.trim()) return;
    setIsSearchingPatient(true);
    setPatientSearchError('');
    try {
      // Assuming GET /patients?search=... returns an array
      const res = await api.get(`/patients`, { params: { search: searchPatientId } });
      const data = res.data?.data || res.data;
      // Find exact match by patientId
      const match = data.find((p: any) => p.patientId === searchPatientId);
      if (match) {
        setSelectedPatient(match);
      } else {
        setPatientSearchError('Patient not found. Register as Outside Patient.');
        setSelectedPatient(null);
      }
    } catch (error) {
      setPatientSearchError('Error searching patient.');
      setSelectedPatient(null);
    } finally {
      setIsSearchingPatient(false);
    }
  };

  // Mutations
  const createPatientMutation = useMutation({
    mutationFn: (data: any) => api.post('/patients', { ...data, patientType: 'OUTSIDE' }),
  });

  const createBillingMutation = useMutation({
    mutationFn: (data: any) => api.post('/billing', data),
    onSuccess: (res, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ['billings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      if (variables.print) {
        setCreatedInvoice(res.data?.data || res.data);
      } else {
        navigate('/billing');
      }
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to create billing');
    }
  });

  const onSubmitBilling = async (data: any, shouldPrint: boolean = false) => {
    if (activeTab === 'EXISTING' && !selectedPatient) {
      setPatientSearchError('Please select a patient first');
      return;
    }

    let finalPatientId = selectedPatient?.id;

    // Create outside patient if needed
    if (activeTab === 'OUTSIDE') {
      const patientValid = await outsideForm.trigger();
      if (!patientValid) return;
      try {
        const patientData = outsideForm.getValues();
        const res = await createPatientMutation.mutateAsync(patientData);
        finalPatientId = res.data?.data?.id || res.data?.id;
        setSelectedPatient(res.data?.data || res.data); // Keep for print
      } catch (e: any) {
        alert('Failed to create outside patient');
        return;
      }
    }

    // Submit Billing
    createBillingMutation.mutate({
      ...data,
      patientId: finalPatientId,
      print: shouldPrint
    });
  };

  const handleTestSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const testId = e.target.value;
    if (!testId) return;
    
    // Check if already added
    if (billingItems.some(i => i.testId === testId)) {
      alert('Test already added');
      e.target.value = '';
      return;
    }

    const test = tests?.find((t: any) => t.id === testId);
    if (test) {
      appendItem({ testId: test.id, name: test.name, price: Number(test.price) });
    }
    e.target.value = ''; // Reset select
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto pb-20">
      {/* Hidden Print Container */}
      <div className="hidden">
        <InvoicePrint ref={printRef} billing={createdInvoice} />
      </div>

      {/* Header */}
      <div className="flex items-center space-x-4">
        <button onClick={() => navigate('/billing')}
          className="p-2 bg-white rounded-full border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Patient Billing</h1>
          <p className="text-slate-500 mt-1">Create and manage diagnostic test invoices</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Patient & Tests */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Patient Selection Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50 p-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <User size={20} className="text-primary" />
                Select Patient
              </h2>
            </div>
            
            <div className="p-1 bg-slate-100/50 m-4 rounded-xl flex gap-1">
              <button type="button"
                onClick={() => setActiveTab('EXISTING')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  activeTab === 'EXISTING' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Existing Patient
              </button>
              <button type="button"
                onClick={() => setActiveTab('OUTSIDE')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  activeTab === 'OUTSIDE' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Outside / Walk-in
              </button>
            </div>

            <div className="p-6 pt-2">
              {activeTab === 'EXISTING' ? (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Enter Patient ID (e.g. DMDCPTN-0000001)"
                        value={searchPatientId}
                        onChange={(e) => setSearchPatientId(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && searchPatient()}
                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:border-primary focus:outline-none"
                      />
                    </div>
                    <button onClick={searchPatient}
                      disabled={isSearchingPatient}
                      className="bg-primary hover:bg-primary-dark text-white px-6 rounded-xl font-semibold transition-colors disabled:opacity-70"
                    >
                      {isSearchingPatient ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                  {patientSearchError && <p className="text-red-500 text-sm font-medium">{patientSearchError}</p>}
                  
                  {selectedPatient && (
                    <div className="mt-6 border border-emerald-100 bg-emerald-50/50 rounded-xl p-4 flex items-start gap-4">
                      <div className="p-3 bg-emerald-100 rounded-full text-emerald-600">
                        <CheckCircle2 size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg">
                          {selectedPatient.name || `${selectedPatient.firstName} ${selectedPatient.lastName}`}
                        </h3>
                        <div className="flex gap-4 text-sm text-slate-600 mt-1">
                          <p><strong>ID:</strong> {selectedPatient.patientId}</p>
                          <p><strong>Phone:</strong> {selectedPatient.phone || 'N/A'}</p>
                          <p><strong>Age/Sex:</strong> {selectedPatient.age || '-'}/{selectedPatient.gender || '-'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                    <input {...outsideForm.register('name')} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:border-primary focus:outline-none" />
                    {outsideForm.formState.errors.name && <p className="text-red-500 text-xs mt-1">{outsideForm.formState.errors.name.message as string}</p>}
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
                    <input {...outsideForm.register('phone')} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:border-primary focus:outline-none" />
                    {outsideForm.formState.errors.phone && <p className="text-red-500 text-xs mt-1">{outsideForm.formState.errors.phone.message as string}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
                    <input type="number" {...outsideForm.register('age', { valueAsNumber: true })} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:border-primary focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                    <select {...outsideForm.register('gender')} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:border-primary focus:outline-none">
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Test Selection Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50 p-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileText size={20} className="text-primary" />
                Tests & Services
              </h2>
            </div>
            <div className="p-6">
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <select
                  onChange={handleTestSelection}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:border-primary focus:outline-none appearance-none bg-slate-50 hover:bg-white transition-colors cursor-pointer"
                >
                  <option value="">Search and select test or service...</option>
                  {tests?.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name} (BDT {t.price})</option>
                  ))}
                </select>
              </div>

              {billingItems.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                      <tr>
                        <th className="px-4 py-3 w-12 text-center">SL</th>
                        <th className="px-4 py-3">Test / Service</th>
                        <th className="px-4 py-3 text-center w-20">Qty</th>
                        <th className="px-4 py-3 text-right w-28">Unit Price</th>
                        <th className="px-4 py-3 text-right w-28">Total</th>
                        <th className="px-4 py-3 text-center w-16">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {billingItems.map((item, index) => (
                        <tr key={item.id} className="text-sm hover:bg-slate-50/50">
                          <td className="px-4 py-3 text-center text-slate-500">{index + 1}</td>
                          <td className="px-4 py-3 font-medium text-slate-800">{item.name}</td>
                          <td className="px-4 py-3 text-center text-slate-600">1</td>
                          <td className="px-4 py-3 text-right text-slate-600">{Number(item.price).toFixed(2)}</td>
                          <td className="px-4 py-3 text-right font-medium text-slate-800">{Number(item.price).toFixed(2)}</td>
                          <td className="px-4 py-3 text-center">
                            <button type="button"
                              onClick={() => removeItem(index)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
                  <FileText className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                  <p className="text-slate-500 font-medium">No tests added yet.</p>
                  <p className="text-slate-400 text-sm">Select tests from the dropdown above.</p>
                </div>
              )}
              {billingForm.formState.errors.items && (
                <p className="text-red-500 text-sm mt-2">{billingForm.formState.errors.items.message as string}</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 sticky top-6">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
              <h2 className="text-lg font-bold text-slate-800">Billing Summary</h2>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="flex justify-between items-center text-slate-600 text-sm">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-800 text-base">{subtotal.toFixed(2)} BDT</span>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex gap-2">
                  <div className="w-1/3">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Discount Type</label>
                    <select
                      {...billingForm.register('discountType')}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:border-primary focus:outline-none"
                    >
                      <option value="PERCENTAGE">%</option>
                      <option value="FIXED">Flat (BDT)</option>
                    </select>
                  </div>
                  <div className="w-2/3">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Discount Value</label>
                    <input
                      type="number"
                      step="0.01"
                      {...billingForm.register('discount', { valueAsNumber: true })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:border-primary focus:outline-none text-right"
                    />
                  </div>
                </div>
                
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600 font-medium">
                    <span>Discount Amount</span>
                    <span>- {discountAmount.toFixed(2)} BDT</span>
                  </div>
                )}
                {((watchDiscountType === 'PERCENTAGE' && watchDiscount > 100) || (watchDiscountType === 'FIXED' && watchDiscount > subtotal)) && (
                   <p className="text-xs text-red-500">Invalid discount amount</p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100">
                <label className="flex justify-between items-center text-sm font-semibold text-slate-500 mb-1">
                  <span>Additional Charges (BDT)</span>
                </label>
                <input
                  type="number"
                  {...billingForm.register('additionalCharges', { valueAsNumber: true })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:border-primary focus:outline-none text-right"
                />
              </div>

              <div className="pt-4 border-t-2 border-slate-200">
                <div className="flex justify-between items-center text-lg font-bold text-slate-900">
                  <span>Net Payable</span>
                  <span className="text-primary">{totalAmount.toFixed(2)} BDT</span>
                </div>
              </div>

              <div className="pt-6 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Payment Method</label>
                    <select {...billingForm.register('paymentMethod')} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg">
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                      <option value="Mobile">Mobile Banking</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Status</label>
                    <select {...billingForm.register('paymentStatus')} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg">
                      <option value="Unpaid">Unpaid</option>
                      <option value="Paid">Paid</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <button type="button"
                  onClick={() => billingForm.handleSubmit((d) => onSubmitBilling(d, false))()}
                  disabled={createBillingMutation.isPending || createPatientMutation.isPending || billingItems.length === 0}
                  className="w-full py-3 bg-white border border-primary text-primary hover:bg-primary/5 rounded-xl font-bold transition-all disabled:opacity-50"
                >
                  Save Only
                </button>
                <button type="button"
                  onClick={() => billingForm.handleSubmit((d) => onSubmitBilling(d, true))()}
                  disabled={createBillingMutation.isPending || createPatientMutation.isPending || billingItems.length === 0}
                  className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-[0_4px_14px_0_rgb(59,130,246,0.39)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.23)] disabled:opacity-50"
                >
                  <Printer size={18} />
                  {createBillingMutation.isPending ? 'Processing...' : 'Save & Print'}
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
