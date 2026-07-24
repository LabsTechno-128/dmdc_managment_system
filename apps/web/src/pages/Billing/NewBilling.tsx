import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

const billingSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  items: z.array(z.object({
    testId: z.string().min(1, 'Test is required'),
    price: z.coerce.number().min(0, 'Price must be positive'),
  })).min(1, 'At least one item is required'),
  discount: z.coerce.number().min(0).default(0),
  additionalCharges: z.coerce.number().min(0).default(0),
  paymentMethod: z.string().default('Cash'),
  paymentStatus: z.string().default('Unpaid'),
});

type BillingFormValues = z.infer<typeof billingSchema>;

export const NewBilling: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: patients } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => (await api.get('/patients')).data,
  });

  const { data: tests } = useQuery({
    queryKey: ['tests'],
    queryFn: async () => (await api.get('/tests')).data,
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BillingFormValues>({
    resolver: zodResolver(billingSchema),
    defaultValues: {
      items: [{ testId: '', price: 0 }],
      discount: 0,
      additionalCharges: 0,
      paymentMethod: 'Cash',
      paymentStatus: 'Unpaid'
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchItems = watch('items');
  const watchDiscount = watch('discount');
  const watchAdditionalCharges = watch('additionalCharges');

  const subtotal = watchItems.reduce((acc, item) => acc + (Number(item.price) || 0), 0);
  const totalAmount = subtotal - (Number(watchDiscount) || 0) + (Number(watchAdditionalCharges) || 0);

  const mutation = useMutation({
    mutationFn: (data: BillingFormValues) => {
      const payload = {
        ...data,
        subtotal,
        totalAmount,
      };
      return api.post('/billing', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      navigate('/billing');
    },
  });

  const onSubmit = (data: BillingFormValues) => {
    mutation.mutate(data);
  };

  const handleTestChange = (index: number, testId: string) => {
    const selectedTest = tests?.find((t: any) => t.id === testId);
    if (selectedTest) {
      setValue(`items.${index}.price`, Number(selectedTest.price));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/billing')}
          className="p-2 bg-white rounded-full border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">New Invoice</h1>
          <p className="text-slate-500 mt-1">Create a billing invoice for a patient.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Patient Information</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Select Patient</label>
              <select
                {...register('patientId')}
                className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:outline-none transition-all ${
                  errors.patientId ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:border-primary focus:ring-primary/20'
                }`}
              >
                <option value="">-- Choose Patient --</option>
                {patients?.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                ))}
              </select>
              {errors.patientId && <p className="mt-1 text-sm text-red-500">{errors.patientId.message}</p>}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">Billing Items</h2>
              <button
                type="button"
                onClick={() => append({ testId: '', price: 0 })}
                className="flex items-center space-x-1 text-sm text-primary hover:text-primary-dark font-medium"
              >
                <Plus size={16} />
                <span>Add Item</span>
              </button>
            </div>
            
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-start space-x-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Diagnostic Test</label>
                    <select
                      {...register(`items.${index}.testId`)}
                      onChange={(e) => {
                        register(`items.${index}.testId`).onChange(e);
                        handleTestChange(index, e.target.value);
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:outline-none focus:border-primary focus:ring-primary/20"
                    >
                      <option value="">-- Select Test --</option>
                      {tests?.map((t: any) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    {errors.items?.[index]?.testId && <p className="mt-1 text-xs text-red-500">{errors.items[index]?.testId?.message}</p>}
                  </div>
                  
                  <div className="w-32">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Price (BDT)</label>
                    <input
                      type="number"
                      {...register(`items.${index}.price`)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:outline-none focus:border-primary focus:ring-primary/20 bg-slate-100"
                      readOnly
                    />
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="mt-6 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {errors.items && <p className="text-sm text-red-500">{errors.items.message}</p>}
            </div>
          </div>
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Payment Summary</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-medium">{subtotal.toFixed(2)} BDT</span>
              </div>

              <div>
                <label className="flex justify-between text-sm text-slate-600 mb-1">
                  <span>Discount</span>
                  <span>BDT</span>
                </label>
                <input
                  type="number"
                  {...register('discount')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:outline-none focus:border-primary focus:ring-primary/20 text-right"
                />
              </div>

              <div>
                <label className="flex justify-between text-sm text-slate-600 mb-1">
                  <span>Addl. Charges</span>
                  <span>BDT</span>
                </label>
                <input
                  type="number"
                  {...register('additionalCharges')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:outline-none focus:border-primary focus:ring-primary/20 text-right"
                />
              </div>
              
              <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between text-lg font-bold text-slate-900">
                  <span>Total Amount</span>
                  <span>{totalAmount.toFixed(2)} BDT</span>
                </div>
              </div>

              <div className="pt-4 space-y-3 border-t border-slate-100">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                  <select {...register('paymentMethod')} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="Mobile Banking">Mobile Banking</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select {...register('paymentStatus')} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                    <option value="Unpaid">Unpaid</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={mutation.isPending || totalAmount < 0}
                className="w-full mt-4 bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-70"
              >
                {mutation.isPending ? 'Generating...' : 'Generate Invoice'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
