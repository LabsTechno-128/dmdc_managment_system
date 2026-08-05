import React from 'react';
import { api } from '../../lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Trash2, Edit } from 'lucide-react';

const fetchPatients = async () => {
  const response = await api.get('/patients');
  return response;
};

const Patients: React.FC = () => {

  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['patients'],
    queryFn: fetchPatients,
  });

  let patients = [];
  if (data) {
    patients = data.data;
  }
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/patients/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Patients</h1>
          <p className="text-slate-500 mt-1">Manage patient records</p>
        </div>
        {/* <button
          onClick={() => navigate('/patients/new')}
          className="flex items-center space-x-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl transition-colors font-medium shadow-sm"
        >
          <UserPlus size={18} />
          <span>Add Patient</span>
        </button> */}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading patients...</div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500">Error loading patients</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm font-medium">
                  <th className="p-4">Name</th>
                  <th className="p-4">Created At</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients?.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-500">
                      No patients found.
                    </td>
                  </tr>
                ) : (
                  patients?.map((patient: any) => (
                    <tr key={patient.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-slate-800">{patient.firstName} {patient.lastName}</div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">{patient.id.substring(0, 8)}</div>
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {new Date(patient.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button className="p-2 text-slate-400 hover:text-primary bg-white border border-slate-200 rounded-lg shadow-sm transition-colors">
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(patient.id)}
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

export default Patients;