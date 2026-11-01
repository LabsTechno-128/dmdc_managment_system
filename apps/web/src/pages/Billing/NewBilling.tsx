import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../lib/api';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Trash2, Printer, Search, User, FileText, CheckCircle2, Stethoscope, Loader2, AlertCircle, Clock } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { toast } from 'react-toastify';
import { InvoicePrint } from './InvoicePrint';
import {
  BD_PHONE_REGEX,
  type DoctorSuggestion,
  type ReferralState,
  formatDoctorName,
  formatDoctorWithSpecialization,
  isExpectedPhoneLengthReached,
  isExpectedAgeLengthReached,
  focusNextField,
  handleReferralInputEdit,
  handleReferralDoctorSelect,
  handleReferralBlur,
  buildReferralSubmissionPayload,
  splitTextForHighlight,
} from './outsideFormHelpers';

// Schema for outside patient
const outsidePatientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(1, 'Phone is required').regex(BD_PHONE_REGEX, 'Must be a valid Bangladeshi phone number'),
  age: z.preprocess(
    (val) => (val === '' || val === undefined || val === null || (typeof val === 'number' && Number.isNaN(val)) ? undefined : Number(val)),
    z.number({ error: 'Age must be a valid number' }).int('Age must be a whole number').min(0, 'Age must be positive').max(150, 'Age must be valid').optional()
  ),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
});

const billingSchema = z.object({
  items: z.array(z.object({
    testId: z.string().min(1, 'Test is required'),
    price: z.number({ error: 'Price must be a valid number' })
      .int('Price must be a whole number')
      .min(0, 'Price cannot be negative'),
    name: z.string().optional(),
  })).min(1, 'At least one item is required'),
  discountType: z.enum(['PERCENTAGE', 'FIXED']),
  discount: z.preprocess(
    (val) => (val === '' || val === undefined || val === null || (typeof val === 'number' && Number.isNaN(val)) ? 0 : Number(val)),
    z.number({ error: 'Discount must be a valid number' })
      .finite('Discount must be a valid number')
      .int('Discount must be a whole number')
      .min(0, 'Discount cannot be negative')
  ),
  vatRate: z.preprocess(
    (val) => (val === '' || val === undefined || val === null || (typeof val === 'number' && Number.isNaN(val)) ? 0 : Number(val)),
    z.number({ error: 'VAT rate must be a valid number' })
      .finite('VAT rate must be a valid number')
      .int('VAT rate must be a whole number')
      .min(0, 'VAT rate cannot be negative')
      .max(100, 'VAT rate cannot exceed 100%')
  ).optional(),
  additionalCharges: z.preprocess(
    (val) => (val === '' || val === undefined || val === null || (typeof val === 'number' && Number.isNaN(val)) ? 0 : Number(val)),
    z.number({ error: 'Additional charges must be a valid number' })
      .finite('Additional charges must be a valid number')
      .int('Additional charges must be a whole number')
      .min(0, 'Additional charges cannot be negative')
  ),
  paidAmount: z.preprocess(
    (val) => (val === '' || val === undefined || val === null || (typeof val === 'number' && Number.isNaN(val)) ? 0 : Number(val)),
    z.number({ error: 'Paid amount must be a valid number' })
      .finite('Paid amount must be a valid number')
      .int('Paid amount must be a whole number')
      .min(0, 'Paid amount cannot be negative')
  ),
  paymentDone: z.boolean().optional(),
  paymentMethod: z.string(),
  paymentStatus: z.string(),
  referredBy: z.string().optional(),
  referredByDoctorId: z.string().nullable().optional(),
  referredBySpecialization: z.string().nullable().optional(),
  testAvailabilityNote: z
    .string()
    .max(2000, 'Test availability note cannot exceed 2000 characters')
    .optional()
    .nullable(),
}).superRefine((data, ctx) => {
  const subtotal = data.items.reduce((acc, item) => acc + (Number(item.price) || 0), 0);

  let discountAmount = 0;
  if (data.discountType === 'PERCENTAGE') {
    if (data.discount > 100) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Discount percentage cannot exceed 100%', path: ['discount'] });
    }
    discountAmount = Math.round(subtotal * (data.discount / 100) * 100) / 100;
  } else {
    if (data.discount > subtotal) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Discount cannot exceed subtotal (৳${subtotal.toFixed(2)})`, path: ['discount'] });
    }
    discountAmount = data.discount;
  }

  const taxableAmount = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);
  const vatRate = Number(data.vatRate) || 0;
  const vatAmount = Math.round(taxableAmount * (vatRate / 100) * 100) / 100;
  const totalAmount = Math.round((taxableAmount + vatAmount + (data.additionalCharges || 0)) * 100) / 100;

  if (data.paidAmount > totalAmount) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Paid amount cannot exceed total bill amount (৳${totalAmount.toFixed(2)})`,
      path: ['paidAmount']
    });
  }
});

export const NewBilling: React.FC = () => {
  const navigate = useNavigate();
  const { id: routeBillingId } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const editBillingId = routeBillingId || searchParams.get('edit') || null;
  const isEditMode = Boolean(editBillingId);
  const hasHydratedEditRef = useRef<string | null>(null);
  const queryClient = useQueryClient();
  const printRef = useRef<HTMLDivElement>(null);
  const billingWorkspaceRef = useRef<HTMLDivElement>(null);
  const outsideNameInputRef = useRef<HTMLInputElement | null>(null);
  const referredByInputRef = useRef<HTMLInputElement | null>(null);
  const referralContainerRef = useRef<HTMLDivElement>(null);

  const prevPhoneValueRef = useRef<string>('');
  const prevAgeValueRef = useRef<string>('');
  const genderArrowKeyRef = useRef<boolean>(false);

  const [activeTab, setActiveTab] = useState<'EXISTING' | 'OUTSIDE'>('EXISTING');
  const [searchPatientId, setSearchPatientId] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientSearchError, setPatientSearchError] = useState('');
  const [isSearchingPatient, setIsSearchingPatient] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [createdInvoice, setCreatedInvoice] = useState<any>(null);

  // Referred By Autocomplete State
  const [referralState, setReferralState] = useState<ReferralState>({
    referredBy: '',
    referredByDoctorId: null,
    selectedDoctor: null,
  });
  const referralStateRef = useRef<ReferralState>({
    referredBy: '',
    referredByDoctorId: null,
    selectedDoctor: null,
  });
  const [doctorSuggestions, setDoctorSuggestions] = useState<DoctorSuggestion[]>([]);
  const [isDoctorDropdownOpen, setIsDoctorDropdownOpen] = useState(false);
  const [isSearchingDoctors, setIsSearchingDoctors] = useState(false);
  const [doctorSearchError, setDoctorSearchError] = useState<string | null>(null);
  const [highlightedDoctorIndex, setHighlightedDoctorIndex] = useState<number>(-1);
  const [hasSearchedCurrentQuery, setHasSearchedCurrentQuery] = useState(false);

  const doctorDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doctorAbortControllerRef = useRef<AbortController | null>(null);

  // Queries
  const { data: tests } = useQuery({
    queryKey: ['tests'],
    queryFn: async () => {
      const response = await api.get('/lab-tests?limit=100');
      return response.data?.data || response.data || [];
    },
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data?.data || res.data;
    },
  });

  const { data: existingBilling, isLoading: isLoadingExistingBilling } = useQuery({
    queryKey: ['billing-details', editBillingId],
    queryFn: async () => {
      if (!editBillingId) return null;
      const res = await api.get(`/billing/${editBillingId}`);
      return res.data?.data || res.data || res;
    },
    enabled: isEditMode,
    staleTime: 0,
  });

  // Forms
  const outsideForm = useForm({
    resolver: zodResolver(outsidePatientSchema),
    defaultValues: { name: '', phone: '', age: undefined, gender: 'MALE' as const }
  });

  const billingForm = useForm({
    resolver: zodResolver(billingSchema),
    defaultValues: {
      items: [],
      discountType: 'FIXED' as const,
      discount: 0,
      vatRate: 0,
      additionalCharges: 0,
      paidAmount: 0,
      paymentDone: false,
      paymentMethod: 'Cash',
      paymentStatus: 'Unpaid',
      referredBy: '',
      referredByDoctorId: null as string | null,
      referredBySpecialization: null as string | null,
      testAvailabilityNote: '',
    }
  });

  // Focus first field when switching to OUTSIDE tab
  useEffect(() => {
    if (activeTab === 'OUTSIDE') {
      const timer = setTimeout(() => {
        if (outsideNameInputRef.current && !outsideNameInputRef.current.disabled) {
          outsideNameInputRef.current.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  // Close doctor autocomplete dropdown on outside click without losing manual input
  useEffect(() => {
    const handleDocumentMouseDown = (event: MouseEvent) => {
      if (
        referralContainerRef.current &&
        !referralContainerRef.current.contains(event.target as Node)
      ) {
        setIsDoctorDropdownOpen(false);
        setHighlightedDoctorIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleDocumentMouseDown);
    return () => {
      document.removeEventListener('mousedown', handleDocumentMouseDown);
    };
  }, []);

  // Cleanup debounce & abort controller on unmount
  useEffect(() => {
    return () => {
      if (doctorDebounceTimerRef.current) {
        clearTimeout(doctorDebounceTimerRef.current);
      }
      if (doctorAbortControllerRef.current) {
        doctorAbortControllerRef.current.abort();
      }
    };
  }, []);

  const updateReferralState = useCallback(
    (nextState: ReferralState, options?: { shouldDirty?: boolean; shouldValidate?: boolean }) => {
      referralStateRef.current = nextState;
      setReferralState(nextState);
      if (referredByInputRef.current && referredByInputRef.current.value !== nextState.referredBy) {
        referredByInputRef.current.value = nextState.referredBy;
      }
      billingForm.setValue('referredBy', nextState.referredBy, {
        shouldDirty: options?.shouldDirty ?? true,
        shouldValidate: options?.shouldValidate ?? true,
      });
      billingForm.setValue('referredByDoctorId', nextState.referredByDoctorId, {
        shouldDirty: options?.shouldDirty ?? true,
        shouldValidate: options?.shouldValidate ?? true,
      });
      billingForm.setValue(
        'referredBySpecialization',
        nextState.selectedDoctor?.specialization || null,
        {
          shouldDirty: options?.shouldDirty ?? true,
          shouldValidate: options?.shouldValidate ?? true,
        }
      );
    },
    [billingForm]
  );

  // Debounced dynamic doctor search with request cancellation
  const triggerDoctorSearch = useCallback((query: string) => {
    if (doctorDebounceTimerRef.current) {
      clearTimeout(doctorDebounceTimerRef.current);
    }
    if (doctorAbortControllerRef.current) {
      doctorAbortControllerRef.current.abort();
    }

    const trimmed = query.trim();
    if (!trimmed) {
      setDoctorSuggestions([]);
      setIsDoctorDropdownOpen(false);
      setIsSearchingDoctors(false);
      setDoctorSearchError(null);
      setHasSearchedCurrentQuery(false);
      return;
    }

    setIsDoctorDropdownOpen(true);
    setIsSearchingDoctors(true);
    setDoctorSearchError(null);
    setHasSearchedCurrentQuery(false);

    doctorDebounceTimerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      doctorAbortControllerRef.current = controller;

      try {
        let res: any;
        try {
          res = await api.get('/doctors/autocomplete', {
            params: { search: trimmed, limit: 10 },
            signal: controller.signal,
          });
        } catch (primaryErr: any) {
          if (
            controller.signal.aborted ||
            primaryErr?.name === 'CanceledError' ||
            primaryErr?.name === 'AbortError' ||
            primaryErr?.code === 'ERR_CANCELED'
          ) {
            throw primaryErr;
          }
          // Fallback to GET /doctors if /doctors/autocomplete endpoint is not yet active on the running server
          const fallbackQuery = trimmed.replace(/^dr\.?\s*/i, '').trim() || trimmed;
          res = await api.get('/doctors', {
            params: { page: 1, limit: 10, search: fallbackQuery },
            signal: controller.signal,
          });
        }

        if (controller.signal.aborted) return;

        const rawList = Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res)
              ? res
              : [];

        const normalized: DoctorSuggestion[] = rawList.map((doc: any) => ({
          id: String(doc.id),
          firstName: doc.firstName || doc.first_name || '',
          lastName: doc.lastName || doc.last_name || '',
          name: formatDoctorName(doc),
          specialization: doc.specialization || '',
          degree: doc.degree || null,
          department: doc.department || null,
        }));

        setDoctorSuggestions(normalized);
        setHighlightedDoctorIndex(-1);
        setHasSearchedCurrentQuery(true);
        setIsSearchingDoctors(false);
      } catch (err: any) {
        if (
          controller.signal.aborted ||
          err?.name === 'CanceledError' ||
          err?.name === 'AbortError' ||
          err?.code === 'ERR_CANCELED'
        ) {
          return;
        }
        setDoctorSuggestions([]);
        setHasSearchedCurrentQuery(true);
        setIsSearchingDoctors(false);
        setDoctorSearchError('Could not load doctor suggestions. You can still enter the name manually.');
      }
    }, 280);
  }, []);

  const handleReferredByChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const nextState = handleReferralInputEdit(referralStateRef.current, newValue);
    updateReferralState(nextState);
    triggerDoctorSearch(newValue);
  };

  const handleSelectDoctorSuggestion = (doctor: DoctorSuggestion) => {
    if (doctorDebounceTimerRef.current) {
      clearTimeout(doctorDebounceTimerRef.current);
    }
    if (doctorAbortControllerRef.current) {
      doctorAbortControllerRef.current.abort();
    }

    const nextState = handleReferralDoctorSelect(doctor);
    updateReferralState(nextState);
    setIsDoctorDropdownOpen(false);
    setIsSearchingDoctors(false);
    setHighlightedDoctorIndex(-1);

    setTimeout(() => {
      if (referredByInputRef.current && billingWorkspaceRef.current) {
        focusNextField(referredByInputRef.current, billingWorkspaceRef.current);
      }
    }, 0);
  };

  const handleReferredByBlur = () => {
    const nextState = handleReferralBlur(referralStateRef.current);
    updateReferralState(nextState, { shouldDirty: false, shouldValidate: true });
  };

  const handleReferredByKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      if (doctorSuggestions.length > 0) {
        e.preventDefault();
        setIsDoctorDropdownOpen(true);
        setHighlightedDoctorIndex((prev) => (prev + 1) % doctorSuggestions.length);
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      if (isDoctorDropdownOpen && doctorSuggestions.length > 0) {
        e.preventDefault();
        setHighlightedDoctorIndex((prev) => (prev <= 0 ? doctorSuggestions.length - 1 : prev - 1));
      }
      return;
    }

    if (e.key === 'Escape') {
      if (isDoctorDropdownOpen) {
        e.preventDefault();
        setIsDoctorDropdownOpen(false);
        setHighlightedDoctorIndex(-1);
      }
      return;
    }

    if (e.key === 'Tab') {
      setIsDoctorDropdownOpen(false);
      setHighlightedDoctorIndex(-1);
      handleReferredByBlur();
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      const target = e.currentTarget;

      if (
        isDoctorDropdownOpen &&
        highlightedDoctorIndex >= 0 &&
        highlightedDoctorIndex < doctorSuggestions.length
      ) {
        handleSelectDoctorSuggestion(doctorSuggestions[highlightedDoctorIndex]);
        return;
      }

      setIsDoctorDropdownOpen(false);
      setHighlightedDoctorIndex(-1);
      handleReferredByBlur();
      focusNextField(target, billingWorkspaceRef.current);
    }
  };

  // Populate default VAT from clinic settings when loaded
  useEffect(() => {
    if (!isEditMode && settings && settings.defaultVatRate !== undefined) {
      const cur = billingForm.getValues('vatRate');
      if (cur === 0 || cur === undefined) {
        billingForm.setValue('vatRate', Number(settings.defaultVatRate) || 0);
      }
    }
  }, [settings, billingForm, isEditMode]);

  // Hydrate form when editing an existing billing record
  useEffect(() => {
    if (!isEditMode || !existingBilling || hasHydratedEditRef.current === existingBilling.id) {
      return;
    }
    hasHydratedEditRef.current = existingBilling.id;

    if (existingBilling.patient) {
      setActiveTab('EXISTING');
      setSelectedPatient(existingBilling.patient);
    }

    const initialReferredBy = existingBilling.referredByDoctor
      ? formatDoctorWithSpecialization(existingBilling.referredByDoctor)
      : existingBilling.referredBy || '';
    const initialReferralState: ReferralState = {
      referredBy: initialReferredBy,
      referredByDoctorId: existingBilling.referredByDoctorId || null,
      selectedDoctor: existingBilling.referredByDoctor
        ? {
            id: String(existingBilling.referredByDoctor.id),
            firstName: existingBilling.referredByDoctor.firstName || '',
            lastName: existingBilling.referredByDoctor.lastName || '',
            name: formatDoctorName(existingBilling.referredByDoctor),
            specialization: existingBilling.referredByDoctor.specialization || '',
          }
        : null,
    };
    referralStateRef.current = initialReferralState;
    setReferralState(initialReferralState);

    const mappedItems = Array.isArray(existingBilling.items)
      ? existingBilling.items.map((item: any) => ({
          testId: String(item.testId || item.test?.id || item.id || '1'),
          name: item.test?.name || item.name || item.description || 'Diagnostic Test',
          price: Math.round(Number(item.price || item.test?.billRate || 0)),
        }))
      : [];

    billingForm.reset({
      items: mappedItems,
      discountType: (existingBilling.discountType === 'PERCENTAGE' ? 'PERCENTAGE' : 'FIXED') as 'PERCENTAGE' | 'FIXED',
      discount: Math.round(Number(existingBilling.discount || 0)),
      vatRate: Math.round(Number(existingBilling.vatRate || 0)),
      additionalCharges: Math.round(Number(existingBilling.additionalCharges || 0)),
      paidAmount: Math.round(Number(existingBilling.paidAmount || 0)),
      paymentDone: existingBilling.paymentStatus === 'Paid',
      paymentMethod: existingBilling.paymentMethod || 'Cash',
      paymentStatus: existingBilling.paymentStatus || 'Unpaid',
      referredBy: initialReferredBy,
      referredByDoctorId: existingBilling.referredByDoctorId || null,
      referredBySpecialization: existingBilling.referredByDoctor?.specialization || null,
      testAvailabilityNote: existingBilling.testAvailabilityNote ?? '',
    });
  }, [isEditMode, existingBilling, billingForm]);

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
  const watchDiscount = Number(billingForm.watch('discount')) || 0;
  const watchVatRate = Number(billingForm.watch('vatRate')) || 0;
  const watchAdditionalCharges = Number(billingForm.watch('additionalCharges')) || 0;
  const watchPaidAmount = Number(billingForm.watch('paidAmount')) || 0;
  const watchPaymentDone = Boolean(billingForm.watch('paymentDone'));

  const subtotal = watchItems.reduce((acc, item) => acc + (Number(item.price) || 0), 0);
  let discountAmount = 0;
  if (watchDiscountType === 'PERCENTAGE') {
    discountAmount = Math.round(subtotal * (watchDiscount / 100) * 100) / 100;
  } else {
    discountAmount = watchDiscount;
  }
  const taxableAmount = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);
  const vatAmount = Math.round(taxableAmount * (watchVatRate / 100) * 100) / 100;
  const totalAmount = Math.round((taxableAmount + vatAmount + watchAdditionalCharges) * 100) / 100;

  const rawDue = Math.max(0, Math.round((totalAmount - watchPaidAmount) * 100) / 100);
  const dueAmount = watchPaymentDone ? 0 : rawDue;
  const waivedDiff = watchPaymentDone ? rawDue : 0;

  const handlePayFull = () => {
    billingForm.setValue('paidAmount', Math.round(totalAmount), { shouldValidate: true });
    billingForm.setValue('paymentDone', true, { shouldValidate: true });
  };

  const handleTogglePaymentDone = (checked: boolean) => {
    billingForm.setValue('paymentDone', checked, { shouldValidate: true });
    if (checked) {
      billingForm.setValue('paymentStatus', 'Paid');
      const currentPaid = Number(billingForm.getValues('paidAmount')) || 0;
      if (currentPaid === 0 && totalAmount > 0) {
        billingForm.setValue('paidAmount', Math.floor(totalAmount), { shouldValidate: true });
      }
    }
  };

  useEffect(() => {
    if (watchPaymentDone) {
      billingForm.setValue('paymentStatus', 'Paid');
    } else if (totalAmount > 0) {
      if (dueAmount === 0) {
        billingForm.setValue('paymentStatus', 'Paid');
      } else if (watchPaidAmount > 0 && dueAmount > 0) {
        billingForm.setValue('paymentStatus', 'Partial');
      } else {
        billingForm.setValue('paymentStatus', 'Unpaid');
      }
    } else {
      billingForm.setValue('paymentStatus', 'Paid');
    }
  }, [watchPaymentDone, watchPaidAmount, totalAmount, dueAmount, billingForm]);

  useEffect(() => {
    if (billingForm.formState.isSubmitted || billingForm.formState.touchedFields.paidAmount || billingForm.formState.touchedFields.discount) {
      billingForm.trigger(['paidAmount', 'discount']);
    }
  }, [totalAmount, subtotal, billingForm]);

  // Patient Search
  const searchPatient = async () => {
    if (!searchPatientId.trim()) return;
    setIsSearchingPatient(true);
    setPatientSearchError('');
    try {
      // Assuming GET /patients?search=... returns an array
      const res = await api.get(`/patients`, { params: { search: searchPatientId } });
      const data = res.data?.data || res.data;
      if (data && data.length > 0) {
        setSearchResults(data);
        setSelectedPatient(null);
      } else {
        setPatientSearchError('Patient not found. Register as Outside Patient.');
        setSearchResults([]);
        setSelectedPatient(null);
      }
    } catch (error) {
      setPatientSearchError('Error searching patient.');
      setSearchResults([]);
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
      toast.error(error.response?.data?.message || 'Failed to create billing');
    }
  });

  const updateBillingMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any; print?: boolean }) =>
      api.patch(`/billing/${id}`, payload),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['billings'] });
      queryClient.invalidateQueries({ queryKey: ['billing-details', variables.id] });
      toast.success('Billing record updated successfully');
      if (variables.print) {
        setCreatedInvoice(res.data?.data || res.data);
      } else {
        navigate('/billing');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update billing record');
    },
  });

  const onSubmitBilling = async (data: any, shouldPrint: boolean = false) => {
    const latestReferral = referralStateRef.current;
    const referralPayload = buildReferralSubmissionPayload({
      referredBy: latestReferral.referredBy || data.referredBy,
      referredByDoctorId: latestReferral.referredByDoctorId ?? data.referredByDoctorId,
    });

    const rawNote = typeof data.testAvailabilityNote === 'string' ? data.testAvailabilityNote.trim() : '';
    const normalizedNote = rawNote.length > 0 ? rawNote : null;

    if (isEditMode && editBillingId) {
      updateBillingMutation.mutate({
        id: editBillingId,
        payload: {
          testAvailabilityNote: normalizedNote,
          referredBy: referralPayload.referredBy ?? null,
          referredByDoctorId: referralPayload.referredByDoctorId,
          paymentStatus: data.paymentStatus,
        },
        print: shouldPrint,
      });
      return;
    }

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
        const res = await createPatientMutation.mutateAsync({
          ...patientData,
          ...referralPayload,
        });
        finalPatientId = res.data?.data?.id || res.data?.id;
        setSelectedPatient(res.data?.data || res.data); // Keep for print
      } catch (e: any) {
        toast.error('Failed to create outside patient');
        return;
      }
    }

    // Submit Billing
    createBillingMutation.mutate({
      ...data,
      ...referralPayload,
      testAvailabilityNote: normalizedNote,
      patientId: finalPatientId,
      print: shouldPrint
    });
  };

  const handleTestSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const testId = e.target.value;
    if (!testId) return;

    // Check if already added
    if (billingItems.some(i => i.testId === testId)) {
      toast.warning('Test already added');
      e.target.value = '';
      return;
    }

    const test = tests?.find((t: any) => String(t.id) === String(testId));
    if (test) {
      appendItem({ testId: String(test.id), name: test.name, price: Number(test.billRate) });
    }
    e.target.value = ''; // Reset select
  };

  // Outside Form field registrations with automatic navigation handlers
  const nameReg = outsideForm.register('name');
  const phoneReg = outsideForm.register('phone');
  const ageReg = outsideForm.register('age', { valueAsNumber: true });
  const genderReg = outsideForm.register('gender');

  const handleBillingFieldEnter = (
    e: React.KeyboardEvent<HTMLElement>,
    fieldName?: keyof z.infer<typeof billingSchema>
  ) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget;
    if (fieldName) {
      void billingForm.trigger(fieldName);
    }
    focusNextField(target, billingWorkspaceRef.current);
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isEditMode ? 'Edit Patient Billing' : 'Patient Billing'}
          </h1>
          <p className="text-slate-500 mt-1">
            {isEditMode
              ? `Update invoice details and test availability note${existingBilling?.billNumber ? ` (${existingBilling.billNumber})` : ''}`
              : 'Create and manage diagnostic test invoices'}
          </p>
        </div>
      </div>

      {isEditMode && isLoadingExistingBilling && (
        <div className="p-6 bg-white border border-slate-200 rounded-2xl flex items-center gap-3 text-sm text-slate-600 shadow-xs">
          <Loader2 size={18} className="animate-spin text-primary" />
          <span>Loading existing billing record...</span>
        </div>
      )}

      <div ref={billingWorkspaceRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column - Patient & Tests */}
        <div className="lg:col-span-2 space-y-6">

          {/* Patient Selection Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-visible">
            <div className="border-b border-slate-100 bg-slate-50 p-4 rounded-t-2xl">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <User size={20} className="text-primary" />
                Select Patient
              </h2>
            </div>

            <div className="p-1 bg-slate-100/50 m-4 rounded-xl flex gap-1">
              <button type="button"
                onClick={() => setActiveTab('EXISTING')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'EXISTING' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                Existing Patient
              </button>
              <button type="button"
                onClick={() => setActiveTab('OUTSIDE')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'OUTSIDE' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                Outside / Walk-in
              </button>
            </div>

            <div className="p-6 pt-2">
              {activeTab === 'EXISTING' ? (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search by Patient ID, Name, or Phone..."
                        value={searchPatientId}
                        onChange={(e) => setSearchPatientId(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            searchPatient();
                          }
                        }}
                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-slate-300 rounded-xl focus:ring-2 focus:border-primary focus:outline-none text-sm"
                      />
                    </div>
                    <button type="button" onClick={searchPatient}
                      disabled={isSearchingPatient}
                      className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-xl font-semibold transition-colors disabled:opacity-70 text-sm cursor-pointer"
                    >
                      {isSearchingPatient ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                  {patientSearchError && <p className="text-red-500 text-sm font-medium">{patientSearchError}</p>}

                  {searchResults.length > 0 && !selectedPatient && (
                    <div className="mt-4 space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      {searchResults.map((patient: any) => (
                        <div key={patient.id}
                          className="flex items-center justify-between p-3 border border-slate-200 rounded-xl hover:border-primary transition-colors cursor-pointer bg-white"
                          onClick={() => {
                            setSelectedPatient(patient);
                            setSearchResults([]);
                          }}
                        >
                          <div>
                            <p className="font-bold text-slate-800">{patient.name || `${patient.firstName} ${patient.lastName}`}</p>
                            <p className="text-sm text-slate-500 mt-0.5">ID: <span className="font-medium text-slate-700">{patient.patientId}</span> • Phone: {patient.phone || 'N/A'}</p>
                          </div>
                          <button
                            type="button"
                            className="text-sm bg-primary/10 text-primary px-4 py-2 rounded-lg font-bold hover:bg-primary hover:text-white transition-colors cursor-pointer"
                          >
                            Select
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

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
                <div className="grid grid-cols-2 gap-4" data-testid="outside-patient-form">
                  <div className="col-span-2 sm:col-span-1">
                    <label htmlFor="outside-name" className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                    <input
                      id="outside-name"
                      type="text"
                      {...nameReg}
                      ref={(el) => {
                        nameReg.ref(el);
                        outsideNameInputRef.current = el;
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          e.stopPropagation();
                          const target = e.currentTarget;
                          if (target.value.trim().length > 0) {
                            void outsideForm.trigger('name');
                          }
                          focusNextField(target, billingWorkspaceRef.current);
                        }
                      }}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:border-primary focus:outline-none"
                    />
                    {outsideForm.formState.errors.name && <p className="text-red-500 text-xs mt-1">{outsideForm.formState.errors.name.message as string}</p>}
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label htmlFor="outside-phone" className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
                    <input
                      id="outside-phone"
                      type="tel"
                      {...phoneReg}
                      onChange={async (e) => {
                        const target = e.currentTarget;
                        const nextVal = target.value;
                        const prevVal = prevPhoneValueRef.current;
                        prevPhoneValueRef.current = nextVal;
                        await phoneReg.onChange(e);

                        if (isExpectedPhoneLengthReached(nextVal, prevVal)) {
                          void outsideForm.trigger('phone');
                          focusNextField(target, billingWorkspaceRef.current);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          e.stopPropagation();
                          const target = e.currentTarget;
                          if (target.value.trim().length > 0) {
                            void outsideForm.trigger('phone');
                          }
                          focusNextField(target, billingWorkspaceRef.current);
                        }
                      }}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:border-primary focus:outline-none"
                    />
                    {outsideForm.formState.errors.phone && <p className="text-red-500 text-xs mt-1">{outsideForm.formState.errors.phone.message as string}</p>}
                  </div>
                  <div>
                    <label htmlFor="outside-age" className="block text-sm font-medium text-slate-700 mb-1">Age</label>
                    <input
                      id="outside-age"
                      type="number"
                      min="0"
                      max="150"
                      {...ageReg}
                      onChange={async (e) => {
                        const target = e.currentTarget;
                        const nextVal = target.value;
                        const prevVal = prevAgeValueRef.current;
                        prevAgeValueRef.current = nextVal;
                        await ageReg.onChange(e);

                        if (isExpectedAgeLengthReached(nextVal, prevVal)) {
                          void outsideForm.trigger('age');
                          focusNextField(target, billingWorkspaceRef.current);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          e.stopPropagation();
                          const target = e.currentTarget;
                          if (target.value.trim().length > 0) {
                            void outsideForm.trigger('age');
                          }
                          focusNextField(target, billingWorkspaceRef.current);
                        }
                      }}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:border-primary focus:outline-none"
                    />
                    {outsideForm.formState.errors.age && <p className="text-red-500 text-xs mt-1">{outsideForm.formState.errors.age.message as string}</p>}
                  </div>
                  <div>
                    <label htmlFor="outside-gender" className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                    <select
                      id="outside-gender"
                      {...genderReg}
                      onKeyDown={(e) => {
                        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                          genderArrowKeyRef.current = true;
                          return;
                        }
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          e.stopPropagation();
                          genderArrowKeyRef.current = false;
                          const target = e.currentTarget;
                          focusNextField(target, billingWorkspaceRef.current);
                        }
                      }}
                      onChange={async (e) => {
                        const target = e.currentTarget;
                        await genderReg.onChange(e);
                        if (!genderArrowKeyRef.current) {
                          focusNextField(target, billingWorkspaceRef.current);
                        }
                        genderArrowKeyRef.current = false;
                      }}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:border-primary focus:outline-none"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Referred By – Doctor Autocomplete & Manual Entry */}
            <div className="border-t border-slate-100 bg-slate-50/80 p-6 rounded-b-2xl" ref={referralContainerRef}>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="referred-by-input" className="block text-sm font-bold text-slate-800">
                  Referred By <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                {referralState.referredByDoctorId && referralState.selectedDoctor ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {referralState.selectedDoctor.specialization && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                        <Stethoscope size={12} className="text-blue-600" />
                        {referralState.selectedDoctor.specialization}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 size={12} className="text-emerald-600" />
                      Registered Doctor Linked
                    </span>
                  </div>
                ) : referralState.referredBy.trim() ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-200/80 text-slate-700">
                    Manual Referral
                  </span>
                ) : null}
              </div>

              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                <input
                  id="referred-by-input"
                  ref={referredByInputRef}
                  type="text"
                  name="referredBy"
                  autoComplete="off"
                  role="combobox"
                  aria-expanded={isDoctorDropdownOpen}
                  aria-autocomplete="list"
                  aria-controls="referred-by-doctor-listbox"
                  aria-activedescendant={
                    isDoctorDropdownOpen && highlightedDoctorIndex >= 0
                      ? `doctor-option-${highlightedDoctorIndex}`
                      : undefined
                  }
                  placeholder="Search existing doctor or enter referring doctor's name (e.g. Dr. Rahman)"
                  value={referralState.referredBy}
                  onChange={handleReferredByChange}
                  onFocus={() => {
                    if (referralState.referredBy.trim() && !referralState.referredByDoctorId) {
                      if (doctorSuggestions.length > 0 || hasSearchedCurrentQuery) {
                        setIsDoctorDropdownOpen(true);
                      } else {
                        triggerDoctorSearch(referralState.referredBy);
                      }
                    }
                  }}
                  onBlur={handleReferredByBlur}
                  onKeyDown={handleReferredByKeyDown}
                  className="w-full pl-11 pr-10 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:border-primary focus:outline-none transition-all bg-white shadow-sm"
                />

                {isSearchingDoctors && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-primary" aria-label="Searching doctors">
                    <Loader2 size={18} className="animate-spin" />
                  </div>
                )}

                {/* Doctor Autocomplete Dropdown */}
                {isDoctorDropdownOpen && referralState.referredBy.trim().length > 0 && (
                  <div
                    id="referred-by-doctor-listbox"
                    role="listbox"
                    aria-label="Doctor suggestions"
                    className="absolute left-0 right-0 z-30 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg max-h-64 overflow-y-auto divide-y divide-slate-100"
                  >
                    {isSearchingDoctors ? (
                      <div className="p-4 flex items-center justify-center gap-2 text-sm text-slate-500">
                        <Loader2 size={16} className="animate-spin text-primary" />
                        <span>Searching doctors...</span>
                      </div>
                    ) : doctorSearchError ? (
                      <div className="p-3.5 text-xs text-amber-700 bg-amber-50/70 flex items-start gap-2">
                        <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-600" />
                        <div>
                          <p className="font-semibold">{doctorSearchError}</p>
                          <p className="text-slate-600 mt-0.5">
                            Press Enter or Tab to keep <strong>"{referralState.referredBy.trim()}"</strong> as a manual referral.
                          </p>
                        </div>
                      </div>
                    ) : doctorSuggestions.length > 0 ? (
                      doctorSuggestions.map((doc, idx) => {
                        const displayName = formatDoctorName(doc);
                        const nameSegments = splitTextForHighlight(displayName, referralState.referredBy);
                        const specSegments = splitTextForHighlight(doc.specialization || '', referralState.referredBy);
                        const isHighlighted = idx === highlightedDoctorIndex;

                        return (
                          <div
                            key={doc.id}
                            id={`doctor-option-${idx}`}
                            role="option"
                            aria-selected={isHighlighted}
                            onMouseDown={(e) => {
                              // Prevent input blur and immediately select doctor
                              e.preventDefault();
                              e.stopPropagation();
                              handleSelectDoctorSuggestion(doc);
                            }}
                            onMouseEnter={() => setHighlightedDoctorIndex(idx)}
                            onClick={(e) => {
                              e.preventDefault();
                              if (referralStateRef.current.referredByDoctorId !== doc.id) {
                                handleSelectDoctorSuggestion(doc);
                              }
                            }}
                            className={`px-4 py-3 cursor-pointer transition-colors flex items-center justify-between gap-3 ${isHighlighted ? 'bg-primary/10 text-slate-900' : 'hover:bg-slate-50 text-slate-800'
                              }`}
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                                <Stethoscope size={16} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-900 truncate">
                                  {nameSegments.map((seg, i) =>
                                    seg.highlight ? (
                                      <mark key={i} className="bg-amber-100 text-slate-900 font-bold rounded px-0.5">
                                        {seg.text}
                                      </mark>
                                    ) : (
                                      <span key={i}>{seg.text}</span>
                                    )
                                  )}
                                </p>
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 mt-0.5">
                                  {doc.specialization && (
                                    <span className="font-medium text-slate-600">
                                      {specSegments.map((seg, i) =>
                                        seg.highlight ? (
                                          <mark key={i} className="bg-amber-100 text-slate-800 font-semibold rounded px-0.5">
                                            {seg.text}
                                          </mark>
                                        ) : (
                                          <span key={i}>{seg.text}</span>
                                        )
                                      )}
                                    </span>
                                  )}
                                  {doc.degree && (
                                    <>
                                      <span>•</span>
                                      <span>{doc.degree}</span>
                                    </>
                                  )}
                                  {doc.department && (
                                    <>
                                      <span>•</span>
                                      <span>{doc.department}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <span className="text-[11px] font-semibold text-primary shrink-0">
                              Select
                            </span>
                          </div>
                        );
                      })
                    ) : hasSearchedCurrentQuery ? (
                      <div className="p-4 text-center space-y-1">
                        <p className="text-sm font-semibold text-slate-700">No matching doctor found</p>
                        <p className="text-xs text-slate-500">
                          Press <strong>Enter</strong> or <strong>Tab</strong> to continue with{' '}
                          <span className="font-semibold text-slate-700">"{referralState.referredBy.trim()}"</span> as a manual referral.
                        </p>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">
                Select a registered doctor from suggestions or type any external doctor's name manually. This referral will be printed on the patient's invoice.
              </p>
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
                  aria-label="Search and select test or service"
                  onChange={handleTestSelection}
                  onKeyDown={(e) => handleBillingFieldEnter(e)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:border-primary focus:outline-none appearance-none bg-slate-50 hover:bg-white transition-colors cursor-pointer"
                >
                  <option value="">Search and select test or service...</option>
                  {tests?.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name} (BDT {t.billRate})</option>
                  ))}
                </select>
              </div>

              {billingItems.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-x-auto">
                  <table className="w-full text-left min-w-[500px] whitespace-nowrap">
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

              {/* Test Availability Note */}
              <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="test-availability-note" className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Clock size={16} className="text-primary" />
                    <span>Test Availability Note</span>
                    <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <span className="text-xs text-slate-400 font-mono">
                    {(billingForm.watch('testAvailabilityNote') || '').length}/2000
                  </span>
                </div>
                <textarea
                  id="test-availability-note"
                  rows={3}
                  maxLength={2000}
                  placeholder="Enter when the test will be available or when the report is expected..."
                  {...billingForm.register('testAvailabilityNote')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      e.stopPropagation();
                      const target = e.currentTarget;
                      void billingForm.trigger('testAvailabilityNote');
                      focusNextField(target, billingWorkspaceRef.current);
                    }
                  }}
                  className={`w-full px-4 py-3 text-sm border rounded-xl focus:ring-2 focus:outline-none transition-all bg-slate-50/60 focus:bg-white resize-y ${
                    billingForm.formState.errors.testAvailabilityNote
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-slate-300 focus:border-primary'
                  }`}
                />
                {billingForm.formState.errors.testAvailabilityNote ? (
                  <p className="text-red-500 text-xs mt-1">
                    {billingForm.formState.errors.testAvailabilityNote.message as string}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 mt-1.5">
                    Specify test availability, sample collection schedule, or expected report delivery time (e.g., "Report will be ready after 24 hours").
                  </p>
                )}
              </div>
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
                      onKeyDown={(e) => handleBillingFieldEnter(e, 'discountType')}
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
                      step="1"
                      min="0"
                      {...billingForm.register('discount', { valueAsNumber: true })}
                      onKeyDown={(e) => handleBillingFieldEnter(e, 'discount')}
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:outline-none text-right ${billingForm.formState.errors.discount ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:border-primary'}`}
                    />
                    {billingForm.formState.errors.discount && (
                      <p className="text-xs text-red-500 mt-1">{billingForm.formState.errors.discount.message as string}</p>
                    )}
                  </div>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600 font-medium">
                    <span>Discount Amount</span>
                    <span>- {discountAmount.toFixed(2)} BDT</span>
                  </div>
                )}
              </div>

              {/* Taxable Amount */}
              <div className="flex justify-between items-center text-xs text-slate-700 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                <span className="font-medium">Taxable Amount (After Discount)</span>
                <span className="font-semibold font-mono">{taxableAmount.toFixed(2)} BDT</span>
              </div>

              {/* VAT Rate Configuration */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-600">VAT Rate (%)</label>
                  <span className="text-xs text-slate-500 font-mono font-medium">
                    + {vatAmount.toFixed(2)} BDT
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    {...billingForm.register('vatRate', { valueAsNumber: true })}
                    onKeyDown={(e) => handleBillingFieldEnter(e, 'vatRate')}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:outline-none text-right font-mono ${billingForm.formState.errors.vatRate
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-slate-300 focus:border-primary'
                      }`}
                    placeholder="0"
                  />
                  <div className="flex gap-1 shrink-0">
                    {[0, 5, 15].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => billingForm.setValue('vatRate', rate, { shouldValidate: true })}
                        className={`px-2.5 py-1.5 text-xs rounded-lg border transition-colors ${watchVatRate === rate
                            ? 'bg-primary text-white border-primary font-bold'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                      >
                        {rate}%
                      </button>
                    ))}
                  </div>
                </div>
                {billingForm.formState.errors.vatRate && (
                  <p className="text-xs text-red-500 mt-1 text-right">{billingForm.formState.errors.vatRate.message as string}</p>
                )}
              </div>

              {/* Additional Charges */}
              <div className="pt-2 border-t border-slate-100">
                <label className="flex justify-between items-center text-xs font-semibold text-slate-600 mb-1">
                  <span>Additional Charges (BDT)</span>
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  {...billingForm.register('additionalCharges', { valueAsNumber: true })}
                  onKeyDown={(e) => handleBillingFieldEnter(e, 'additionalCharges')}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:outline-none text-right font-mono ${billingForm.formState.errors.additionalCharges ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:border-primary'}`}
                />
                {billingForm.formState.errors.additionalCharges && (
                  <p className="text-xs text-red-500 mt-1 text-right">{billingForm.formState.errors.additionalCharges.message as string}</p>
                )}
              </div>

              {/* Final Invoice Total */}
              <div className="pt-3 border-t-2 border-slate-200">
                <div className="flex justify-between items-center text-lg font-bold text-slate-900">
                  <span>Final Invoice Total</span>
                  <span className="text-primary font-mono">৳ {totalAmount.toFixed(2)} BDT</span>
                </div>
              </div>

              {/* Amount Paid Field */}
              <div className="pt-3 border-t border-slate-100 space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-700">Paid Amount (BDT)</label>
                  {totalAmount > 0 && (
                    <button
                      type="button"
                      onClick={handlePayFull}
                      className="text-xs font-semibold text-primary hover:text-primary-dark underline cursor-pointer"
                    >
                      Pay Full (৳{totalAmount.toFixed(2)})
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  min="0"
                  step="1"
                  {...billingForm.register('paidAmount', { valueAsNumber: true })}
                  onKeyDown={(e) => handleBillingFieldEnter(e, 'paidAmount')}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:outline-none text-right font-mono font-semibold ${billingForm.formState.errors.paidAmount
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-slate-300 focus:border-primary'
                    }`}
                />
                {billingForm.formState.errors.paidAmount && (
                  <p className="text-xs text-red-500 mt-1 text-right">{billingForm.formState.errors.paidAmount.message as string}</p>
                )}
              </div>

              {/* Payment Done / Full Settlement Checkbox */}
              <div className="pt-2">
                <label className="flex items-center gap-3 p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl cursor-pointer hover:bg-emerald-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={watchPaymentDone}
                    onChange={(e) => handleTogglePaymentDone(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-950">Payment Done</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                        Status: Paid
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-700/80 mt-0.5">
                      Mark as fully settled regardless of fractional change or small cash difference.
                    </p>
                  </div>
                </label>
              </div>

              {/* Outstanding Due Amount */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className={dueAmount > 0 ? 'text-rose-600' : 'text-slate-700'}>Outstanding Due</span>
                  <span className={`font-mono text-base ${dueAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    ৳ {dueAmount.toFixed(2)} BDT
                  </span>
                </div>
                {watchPaymentDone && waivedDiff > 0 && (
                  <div className="flex justify-between items-center text-xs text-slate-600 mt-2 font-medium bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                    <span>Settled / Waived Difference:</span>
                    <span className="font-mono font-bold text-slate-800">৳ {waivedDiff.toFixed(2)} BDT</span>
                  </div>
                )}
              </div>

              {/* Payment Method & Status */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Payment Method</label>
                    <select
                      {...billingForm.register('paymentMethod')}
                      onKeyDown={(e) => handleBillingFieldEnter(e, 'paymentMethod')}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:border-primary focus:outline-none"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                      <option value="Mobile">bKash / Nagad / Mobile</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Payment Status</label>
                    <div className="px-3 py-2 text-sm font-semibold rounded-lg bg-slate-100 border border-slate-200 text-center">
                      <span className={
                        dueAmount === 0
                          ? 'text-emerald-700'
                          : watchPaidAmount > 0
                            ? 'text-blue-700'
                            : 'text-amber-700'
                      }>
                        {billingForm.watch('paymentStatus')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <button type="button"
                  onClick={() => billingForm.handleSubmit((d) => onSubmitBilling(d, false))()}
                  disabled={createBillingMutation.isPending || updateBillingMutation.isPending || createPatientMutation.isPending || billingItems.length === 0}
                  className="w-full py-3 bg-white border border-primary text-primary hover:bg-primary/5 rounded-xl font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isEditMode ? 'Update Changes' : 'Save Only'}
                </button>
                <button type="button"
                  onClick={() => billingForm.handleSubmit((d) => onSubmitBilling(d, true))()}
                  disabled={createBillingMutation.isPending || updateBillingMutation.isPending || createPatientMutation.isPending || billingItems.length === 0}
                  className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-[0_4px_14px_0_rgb(59,130,246,0.39)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.23)] disabled:opacity-50 cursor-pointer"
                >
                  <Printer size={18} />
                  {createBillingMutation.isPending || updateBillingMutation.isPending
                    ? 'Processing...'
                    : isEditMode
                      ? 'Update & Print'
                      : 'Save & Print'}
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
