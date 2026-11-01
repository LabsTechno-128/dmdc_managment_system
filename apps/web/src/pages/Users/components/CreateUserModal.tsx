import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../../../services/user.service';
import { toast } from 'react-toastify';

const createUserSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'First name is required')
    .max(100, 'First name cannot exceed 100 characters'),
  lastName: z
    .string()
    .trim()
    .min(1, 'Last name is required')
    .max(100, 'Last name cannot exceed 100 characters'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .max(200, 'Email cannot exceed 200 characters'),
  phone: z
    .string()
    .trim()
    .min(1, 'Phone number is required')
    .min(6, 'Phone number must be at least 6 characters')
    .max(20, 'Phone number cannot exceed 20 characters')
    .regex(/^[+\d\s\-()]+$/, 'Enter a valid phone number'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
  role: z.string().min(1, 'Role is required'),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
    reset,
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    mode: 'onTouched',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      role: 'user',
    },
  });

  const handleClose = () => {
    reset();
    clearErrors();
    setServerError(null);
    setShowPassword(false);
    onClose();
  };

  const mutation = useMutation({
    mutationFn: userService.createUser,
    onMutate: () => {
      setServerError(null);
    },
    onSuccess: () => {
      toast.success('User created successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      handleClose();
    },
    onError: (error: any) => {
      const rawMessages: string[] = [];

      if (Array.isArray(error?.message)) {
        rawMessages.push(...error.message.filter((m: unknown) => typeof m === 'string'));
      } else if (typeof error?.message === 'string' && error.message.trim()) {
        rawMessages.push(error.message.trim());
      } else if (typeof error?.error?.message === 'string' && error.error.message.trim()) {
        rawMessages.push(error.error.message.trim());
      }

      if (error?.errors && typeof error.errors === 'object') {
        Object.entries(error.errors).forEach(([field, val]) => {
          const msg = Array.isArray(val) ? val.join(', ') : String(val || '');
          if (msg) {
            rawMessages.push(msg);
            if (field in createUserSchema.shape) {
              setError(field as keyof CreateUserFormValues, { type: 'server', message: msg });
            }
          }
        });
      }

      rawMessages.forEach((msg) => {
        const lower = msg.toLowerCase();
        if (lower.includes('email')) {
          setError('email', { type: 'server', message: msg });
        } else if (lower.includes('phone')) {
          setError('phone', { type: 'server', message: msg });
        } else if (lower.includes('first name') || lower.includes('firstname')) {
          setError('firstName', { type: 'server', message: msg });
        } else if (lower.includes('last name') || lower.includes('lastname')) {
          setError('lastName', { type: 'server', message: msg });
        } else if (lower.includes('password')) {
          setError('password', { type: 'server', message: msg });
        } else if (lower.includes('role')) {
          setError('role', { type: 'server', message: msg });
        }
      });

      const displayError =
        rawMessages.length > 0 ? rawMessages.join('. ') : 'Failed to create user. Please check your input and try again.';

      setServerError(displayError);
      toast.error(displayError);
    },
  });

  if (!isOpen) return null;

  const getInputClassName = (hasError: boolean, extraClass = '') =>
    `w-full px-4 py-2 bg-slate-50 border rounded-xl outline-none transition-all text-sm ${
      hasError
        ? 'border-red-400 focus:ring-2 focus:ring-red-500 focus:border-transparent bg-red-50/30'
        : 'border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
    } ${extraClass}`.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-800">Create New User</h2>
          <button
            type="button"
            onClick={handleClose}
            className="cursor-pointer text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {serverError && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          <form
            id="create-user-form"
            noValidate
            onSubmit={handleSubmit((data) => {
              setServerError(null);
              mutation.mutate({
                ...data,
                firstName: data.firstName.trim(),
                lastName: data.lastName.trim(),
                email: data.email.trim(),
                phone: data.phone.trim(),
              });
            })}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('firstName')}
                  className={getInputClassName(!!errors.firstName)}
                  placeholder="John"
                />
                {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('lastName')}
                  className={getInputClassName(!!errors.lastName)}
                  placeholder="Doe"
                />
                {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                {...register('email')}
                className={getInputClassName(!!errors.email)}
                placeholder="john@example.com"
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                {...register('phone')}
                className={getInputClassName(!!errors.phone)}
                placeholder="+1 234 567 890"
              />
              {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className={getInputClassName(!!errors.password, 'pr-11')}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                {...register('role')}
                className={getInputClassName(!!errors.role)}
              >
                <option value="super_admin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
                <option value="receptionist">Receptionist</option>
                <option value="doctor">Doctor</option>
                <option value="lab_technician">Lab Technician</option>
                <option value="accountant">Accountant</option>
                <option value="pharmacist">Pharmacist</option>
                <option value="usg_report">USG Report</option>
                <option value="xray_report">X-Ray Report</option>
                <option value="sample_collection">Sample Collection</option>
              </select>
              {errors.role && <p className="mt-1 text-xs text-red-500">{errors.role.message}</p>}
            </div>
          </form>
        </div>

        <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="w-full sm:w-auto cursor-pointer px-5 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-100 transition-colors text-sm text-center"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-user-form"
            disabled={mutation.isPending}
            className="w-full sm:w-auto cursor-pointer flex items-center justify-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed text-sm text-center"
          >
            {mutation.isPending && <Loader2 size={16} className="animate-spin" />}
            <span>Create User</span>
          </button>
        </div>
      </div>
    </div>
  );
};
