import React, { useState } from 'react';
import { api } from '../../lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Trash2, Edit, Eye, Stethoscope, RefreshCw, Search } from 'lucide-react';
import { DeleteModal } from '../../components/DeleteModal';

const fetchDoctors = async () => {
  const { data } = await api.get('/doctors');
  return data;
};

export const DoctorsList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const { data: doctors, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['doctors'],
    queryFn: fetchDoctors,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/doctors/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      setDeleteTarget(null);
    },
    onError: () => {
      setDeleteTarget(null);
    },
  });

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id);
    }
  };

  // Filter doctors by search
  const filteredDoctors = doctors?.filter((doctor: any) => {
    if (!search) return true;
    const fullName = `Dr. ${doctor.firstName} ${doctor.lastName}`.toLowerCase();
    const spec = doctor.specialization?.toLowerCase() || '';
    const searchTerm = search.toLowerCase();
    return fullName.includes(searchTerm) || spec.includes(searchTerm);
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Doctors</h1>
          <p className="text-slate-500 mt-1">Manage doctor profiles and schedules</p>
        </div>
        <button
          onClick={() => navigate('/doctors/new')}
          className="flex items-center space-x-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl transition-colors font-medium shadow-sm"
        >
          <UserPlus size={18} />
          <span>Add Doctor</span>
        </button>
      </div>

      {/* Search & Refresh Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or specialization..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:outline-none focus:border-primary focus:ring-primary/20 text-sm"
            />
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center space-x-1 px-3 py-2 text-slate-600 hover:text-primary bg-white border border-slate-200 rounded-xl shadow-sm transition-colors text-sm font-medium"
          >
            <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading doctors...</div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500">Error loading doctors</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm font-medium">
                  <th className="p-4">Doctor</th>
                  <th className="p-4">Specialization</th>
                  <th className="p-4">Availability</th>
                  <th className="p-4">Created At</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDoctors?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      <div className="flex flex-col items-center space-y-2">
                        <Stethoscope className="h-8 w-8 text-slate-300" />
                        <span>{search ? 'No doctors match your search.' : 'No doctors found.'}</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredDoctors?.map((doctor: any) => (
                    <tr key={doctor.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full">
                            <Stethoscope className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">Dr. {doctor.firstName} {doctor.lastName}</div>
                            <div className="text-xs text-slate-400 font-mono mt-0.5">{doctor.id.substring(0, 8)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {doctor.specialization}
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {doctor.availability || 'N/A'}
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {new Date(doctor.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => navigate(`/doctors/${doctor.id}`)}
                            className="p-2 text-slate-400 hover:text-primary bg-white border border-slate-200 rounded-lg shadow-sm transition-colors"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => navigate(`/doctors/${doctor.id}/edit`)}
                            className="p-2 text-slate-400 hover:text-primary bg-white border border-slate-200 rounded-lg shadow-sm transition-colors"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ id: doctor.id, name: `Dr. ${doctor.firstName} ${doctor.lastName}` })}
                            disabled={deleteMutation.isPending}
                            className="p-2 text-slate-400 hover:text-red-500 bg-white border border-slate-200 rounded-lg shadow-sm transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      <DeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Doctor"
        message="Are you sure you want to delete this doctor? This action will permanently remove the doctor profile and cannot be undone."
        itemName={deleteTarget?.name}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
};