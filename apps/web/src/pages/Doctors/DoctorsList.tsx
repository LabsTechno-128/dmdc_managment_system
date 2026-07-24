import React from 'react';
import { api } from '../../lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Trash2, Edit } from 'lucide-react';

const fetchDoctors = async () => {
  const { data } = await api.get('/doctors');
  return data;
};

export const DoctorsList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: doctors, isLoading, isError } = useQuery({
    queryKey: ['doctors'],
    queryFn: fetchDoctors,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/doctors/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this doctor?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
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
                  <th className="p-4">Name</th>
                  <th className="p-4">Specialization</th>
                  <th className="p-4">Availability</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {doctors?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">
                      No doctors found.
                    </td>
                  </tr>
                ) : (
                  doctors?.map((doctor: any) => (
                    <tr key={doctor.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-slate-800">Dr. {doctor.firstName} {doctor.lastName}</div>
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {doctor.specialization}
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {doctor.availability || 'N/A'}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button className="p-2 text-slate-400 hover:text-primary bg-white border border-slate-200 rounded-lg shadow-sm transition-colors">
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(doctor.id)}
                          disabled={deleteMutation.isPending}
                          className="p-2 text-slate-400 hover:text-red-500 bg-white border border-slate-200 rounded-lg shadow-sm transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
