import React, { useState } from 'react';
import {
  Search,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Edit2,
  Stethoscope,
  Star,
  X,
  ExternalLink,
  Briefcase,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { landingService } from '../../../services/landing.service';
import type { AdminDoctor } from '../../../services/landing.service';
import { ImageUpload } from '../../../components/ImageUpload';

interface DoctorsTabProps {
  doctors: AdminDoctor[];
  onRefreshDoctors: () => void;
  isSuperAdmin: boolean;
}

export const DoctorsTab: React.FC<DoctorsTabProps> = ({
  doctors,
  onRefreshDoctors,
}) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'unpublished'>('all');
  const [editingDoctor, setEditingDoctor] = useState<AdminDoctor | null>(null);
  const [previewDoctor, setPreviewDoctor] = useState<AdminDoctor | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Filter doctors
  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(search.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(search.toLowerCase()) ||
      doc.department?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === 'published') return doc.isPublished;
    if (filterStatus === 'unpublished') return !doc.isPublished;
    return true;
  });

  const handleToggleVisibility = async (id: string, currentStatus: boolean) => {
    try {
      const res = await landingService.toggleDoctorVisibility(id, !currentStatus);
      toast.success(res.message || 'Doctor visibility updated');
      onRefreshDoctors();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update visibility');
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= doctors.length) return;

    const newOrder = [...doctors];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);

    try {
      const ids = newOrder.map((d) => d.id);
      await landingService.updateDoctorOrder(ids);
      toast.success('Doctor display order updated');
      onRefreshDoctors();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update doctor order');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor) return;

    try {
      setIsSavingProfile(true);
      await landingService.updateDoctorProfile(editingDoctor.id, {
        avatar: editingDoctor.avatar,
        bio: editingDoctor.bio,
        experience: editingDoctor.experience,
        rating: editingDoctor.rating,
        department: editingDoctor.department,
        consultationFee: editingDoctor.consultationFee,
        degree: editingDoctor.degree,
      });
      toast.success('Doctor public card profile updated successfully');
      setEditingDoctor(null);
      onRefreshDoctors();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update doctor profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">
            Landing Page Doctor Management
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Control which hospital clinicians appear on the landing page, customize display order, and configure public biographies.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-medium text-slate-500 bg-blue-50 px-3 py-2 rounded-xl border border-blue-100/80">
          <Stethoscope size={16} className="text-blue-600" />
          <span>
            {doctors.filter((d) => d.isPublished).length} of {doctors.length} doctors published
          </span>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by doctor name, specialty, or department..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
          />
          <Search size={16} className="absolute left-3.5 top-2.5 text-slate-400 pointer-events-none" />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-500 uppercase">Filter:</span>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {(['all', 'published', 'unpublished'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilterStatus(status)}
                className={`cursor-pointer px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  filterStatus === status
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Doctors Table / Card List */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4 w-12 text-center">Order</th>
                <th className="py-3.5 px-4">Clinician Profile</th>
                <th className="py-3.5 px-4">Specialty & Dept</th>
                <th className="py-3.5 px-4">Experience & Rating</th>
                <th className="py-3.5 px-4">Fee</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredDoctors.map((doc, idx) => (
                <tr
                  key={doc.id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    !doc.isPublished ? 'opacity-60 bg-slate-50/30' : ''
                  }`}
                >
                  {/* Order Controls */}
                  <td className="py-4 px-4 text-center">
                    <div className="flex flex-col items-center justify-center space-y-1">
                      <button
                        type="button"
                        onClick={() => handleMoveOrder(idx, 'up')}
                        disabled={idx === 0}
                        className="cursor-pointer p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:pointer-events-none rounded hover:bg-slate-100 transition"
                        title="Move Up in Landing Display"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <span className="text-xs font-bold text-slate-400">{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleMoveOrder(idx, 'down')}
                        disabled={idx === doctors.length - 1}
                        className="cursor-pointer p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:pointer-events-none rounded hover:bg-slate-100 transition"
                        title="Move Down in Landing Display"
                      >
                        <ArrowDown size={14} />
                      </button>
                    </div>
                  </td>

                  {/* Doctor Info */}
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-blue-50 border border-slate-200 flex-shrink-0">
                        <img
                          src={doc.avatar}
                          alt={doc.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200';
                          }}
                        />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block leading-tight">{doc.name}</span>
                        <span className="text-xs text-slate-500 block mt-0.5">{doc.degree}</span>
                      </div>
                    </div>
                  </td>

                  {/* Specialty */}
                  <td className="py-4 px-4">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/50">
                      {doc.specialty}
                    </span>
                    {doc.department && (
                      <span className="text-xs text-slate-400 block mt-1">{doc.department}</span>
                    )}
                  </td>

                  {/* Experience & Rating */}
                  <td className="py-4 px-4">
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-slate-700 block flex items-center space-x-1">
                        <Briefcase size={12} className="text-slate-400" />
                        <span>{doc.experience || '10+ Years'}</span>
                      </span>
                      <span className="text-xs font-semibold text-amber-600 flex items-center space-x-1">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        <span>{doc.rating || '4.9'} / 5.0</span>
                      </span>
                    </div>
                  </td>

                  {/* Consultation Fee */}
                  <td className="py-4 px-4 font-semibold text-slate-800">
                    ৳{doc.consultationFee || 100}
                  </td>

                  {/* Visibility Status */}
                  <td className="py-4 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleVisibility(doc.id, doc.isPublished)}
                      className={`cursor-pointer inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold transition ${
                        doc.isPublished
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
                      }`}
                      title={doc.isPublished ? 'Click to hide from landing page' : 'Click to publish on landing page'}
                    >
                      {doc.isPublished ? (
                        <>
                          <Eye size={12} />
                          <span>Visible</span>
                        </>
                      ) : (
                        <>
                          <EyeOff size={12} />
                          <span>Hidden</span>
                        </>
                      )}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setPreviewDoctor(doc)}
                        className="cursor-pointer p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
                        title="Preview Public Card"
                      >
                        <ExternalLink size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingDoctor({ ...doc })}
                        className="cursor-pointer inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition"
                        title="Edit Landing Profile"
                      >
                        <Edit2 size={13} />
                        <span>Edit Card</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredDoctors.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No doctors found matching "{search}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Doctor Modal */}
      {editingDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto border border-slate-100">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h4 className="text-lg font-bold text-slate-900">
                  Edit Public Card: {editingDoctor.name}
                </h4>
                <p className="text-xs text-slate-500">
                  Landing page profile settings. Core clinical credentials remain protected.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingDoctor(null)}
                className="cursor-pointer p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-5">
              <ImageUpload
                value={editingDoctor.avatar}
                onChange={(url) => setEditingDoctor({ ...editingDoctor, avatar: url })}
                label="Doctor Profile Avatar"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                    Specialty Title
                  </label>
                  <input
                    type="text"
                    value={editingDoctor.specialty}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, specialty: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                    Department
                  </label>
                  <input
                    type="text"
                    value={editingDoctor.department || ''}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, department: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                    Experience
                  </label>
                  <input
                    type="text"
                    value={editingDoctor.experience || ''}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, experience: e.target.value })}
                    placeholder="e.g. 14+ Years"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                    Rating (out of 5)
                  </label>
                  <input
                    type="text"
                    value={editingDoctor.rating || ''}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, rating: e.target.value })}
                    placeholder="e.g. 4.9"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                    Consultation Fee (৳)
                  </label>
                  <input
                    type="number"
                    value={editingDoctor.consultationFee || 0}
                    onChange={(e) =>
                      setEditingDoctor({ ...editingDoctor, consultationFee: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                  Academic Degrees / Qualifications
                </label>
                <input
                  type="text"
                  value={editingDoctor.degree || ''}
                  onChange={(e) => setEditingDoctor({ ...editingDoctor, degree: e.target.value })}
                  placeholder="e.g. MBBS, FCPS (Cardiology), FACC"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                  Public Clinical Bio
                </label>
                <textarea
                  rows={3}
                  value={editingDoctor.bio || ''}
                  onChange={(e) => setEditingDoctor({ ...editingDoctor, bio: e.target.value })}
                  placeholder="Summary of expertise and approach to patient care..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingDoctor(null)}
                  className="cursor-pointer px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="cursor-pointer px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {isSavingProfile ? 'Saving...' : 'Save Doctor Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Doctor Card Live Preview Modal */}
      {previewDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 relative">
            <button
              type="button"
              onClick={() => setPreviewDoctor(null)}
              className="cursor-pointer absolute top-3 right-3 z-10 p-2 text-slate-400 hover:text-slate-700 bg-white/80 backdrop-blur rounded-full shadow"
            >
              <X size={18} />
            </button>

            {/* Simulated DMDC Doctor Card */}
            <div className="p-6 space-y-4">
              <div className="h-64 rounded-2xl overflow-hidden bg-slate-100 relative shadow-inner">
                <img
                  src={previewDoctor.avatar}
                  alt={previewDoctor.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400';
                  }}
                />
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-amber-600 flex items-center space-x-1 shadow-sm">
                  <Star size={12} className="fill-amber-400 text-amber-400" />
                  <span>{previewDoctor.rating || '4.9'}</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  {previewDoctor.specialty}
                </span>
                <h4 className="text-lg font-bold text-slate-900 mt-0.5">{previewDoctor.name}</h4>
                <p className="text-xs text-slate-500 font-medium">{previewDoctor.degree}</p>
              </div>

              <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                {previewDoctor.bio}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Consultation</span>
                  <span className="text-base font-bold text-slate-900">৳{previewDoctor.consultationFee}</span>
                </div>
                <button
                  type="button"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow pointer-events-none"
                >
                  Book Consultation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
