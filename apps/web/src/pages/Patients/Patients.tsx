import React, { useState } from 'react';
import { api } from '../../lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Edit3, UserPlus, FileText, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DeleteModal } from '../../components/DeleteModal';
import { TableSkeleton } from '../../components/skeleton/TableSkeleton';

const fetchPatients = async (page: number, limit: number = 10) => {
  const response = await api.get(`/patients?page=${page}&limit=${limit}`);
  return response;
};

const Patients: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const limit = 10;
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: response, isLoading, isError } = useQuery({
    queryKey: ['patients', page, limit],
    queryFn: () => fetchPatients(page, limit),
  });

  const patients = response?.data || [];
  const meta = (response as any)?.meta || {};
  const total = meta.total || patients.length;
  const totalPages = meta.totalPages || 1;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/patients/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6fb] text-slate-800 -m-6 p-6">
      <div className="mx-auto max-w-[1500px]">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <UserPlus size={21} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">Patient Directory</h1>
              <p className="text-xs text-slate-500">Manage all registered patient profiles and history</p>
            </div>
          </div>
          {/* <button onClick={() => navigate('/patients/new')}
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-blue-600/40 active:scale-95"
          >
            <UserPlus size={16} />
            <span>New Patient</span>
          </button> */}
        </div>

        {/* Stats/Summary Row (Optional, adding a small one for gorgeousness) */}
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border-l-4 border-blue-500 bg-white p-5 shadow-soft transition-all hover:-translate-y-1 hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">Total Patients</p>
                <p className="mt-2 text-2xl font-black text-blue-600">{total}</p>
              </div>
              <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
                <UserPlus size={18} />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-bold text-slate-900">Patient List</h2>
            <span className="text-xs font-semibold text-slate-500">{total} total</span>
          </div>
          {isLoading ? (
            <TableSkeleton />
          ) : isError ? (
            <div className="p-8 text-center text-red-500">Error loading patients</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-blue-50 text-[11px] uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-5 py-3 font-bold">Patient ID & Name</th>
                    <th className="px-5 py-3 font-bold">Contact Info</th>
                    <th className="px-5 py-3 font-bold">Demographics</th>
                    <th className="px-5 py-3 font-bold">Registration Date</th>
                    <th className="px-5 py-3 text-right font-bold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {patients?.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-14 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                          <FileText size={20} />
                        </div>
                        <p className="mt-3 text-sm font-semibold text-slate-700">No patients found</p>
                        <p className="mt-1 text-xs text-slate-400">Click 'New Patient' to add records.</p>
                      </td>
                    </tr>
                  ) : (
                    patients?.map((patient: any) => (
                      <tr key={patient.id} className="group cursor-pointer transition-colors hover:bg-blue-50/50">
                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-800 text-sm">{patient.name || 'Unnamed Patient'}</div>
                          <div className="text-[11px] font-semibold tracking-wider text-slate-400 mt-1 uppercase">{patient.patientId || `ID: ${patient.id.substring(0, 8)}`}</div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-sm font-semibold text-slate-700">{patient.phone || 'N/A'}</div>
                          {patient.email && <div className="text-[11px] text-slate-400 mt-0.5">{patient.email}</div>}
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-sm font-semibold text-slate-700 capitalize">
                            {patient.gender ? patient.gender.toLowerCase() : '-'} {patient.age ? `, ${patient.age} yrs` : ''}
                          </div>
                          <div className="text-[11px] font-bold text-red-500 mt-0.5">{patient.bloodGroup ? `Blood: ${patient.bloodGroup}` : ''}</div>
                        </td>
                        <td className="px-5 py-4 text-xs font-semibold text-slate-600">
                          {new Date(patient.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => navigate(`/patients/${patient.id}`)}
                              className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-700 transition-all hover:bg-blue-600 hover:text-white hover:shadow-sm hover:shadow-blue-600/20 active:scale-95"
                            >
                              <User size={14} />
                              View
                            </button>
                            <button onClick={() => navigate(`/patients/${patient.id}/edit`)}
                              className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-violet-100 px-3 py-1.5 text-xs font-bold text-violet-700 transition-all hover:bg-violet-600 hover:text-white hover:shadow-sm hover:shadow-violet-600/20 active:scale-95"
                            >
                              <Edit3 size={14} />
                              Edit
                            </button>
                            <button onClick={() => setDeleteTarget(patient)}
                              className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 transition-all hover:bg-red-500 hover:text-white hover:shadow-sm hover:shadow-red-500/20 active:scale-95"
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Pagination Controls */}
              <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500">
                  Showing <span className="font-bold text-slate-700">{from}</span>–{' '}
                  <span className="font-bold text-slate-700">{to}</span> of{' '}
                  <span className="font-bold text-slate-700">{total}</span>
                </p>
                <div className="flex items-center gap-1">
                  <button disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="cursor-pointer rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition-all hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const p = i + 1;
                    return (
                      <button key={p}
                        onClick={() => setPage(p)}
                        className={`cursor-pointer min-w-[36px] rounded-xl px-3 py-2 text-sm font-bold shadow-sm transition-all active:scale-95 ${p === page
                            ? 'bg-blue-600 text-white shadow-blue-600/20'
                            : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="cursor-pointer rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition-all hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <DeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Patient"
        message="Are you sure you want to delete this patient record? This action cannot be undone."
        itemName={deleteTarget?.name}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default Patients;