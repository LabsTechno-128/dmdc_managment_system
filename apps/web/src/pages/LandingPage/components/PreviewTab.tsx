import React, { useState } from 'react';
import {
  Globe,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Server,
  Activity,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { landingService } from '../../../services/landing.service';
import { ConfirmModal } from '../../../components/ConfirmModal';

interface PreviewTabProps {
  onRefreshAll: () => void;
  isSuperAdmin: boolean;
}

export const PreviewTab: React.FC<PreviewTabProps> = ({ onRefreshAll, isSuperAdmin }) => {
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isCheckingApi, setIsCheckingApi] = useState(false);
  const [apiStatuses, setApiStatuses] = useState<{
    content: boolean | null;
    doctors: boolean | null;
    seo: boolean | null;
  }>({
    content: null,
    doctors: null,
    seo: null,
  });

  const handleRunHealthCheck = async () => {
    try {
      setIsCheckingApi(true);
      const [c, d, s] = await Promise.allSettled([
        landingService.getPublicContent(),
        landingService.getAdminDoctors(),
        landingService.getPublicSeo(),
      ]);

      setApiStatuses({
        content: c.status === 'fulfilled',
        doctors: d.status === 'fulfilled',
        seo: s.status === 'fulfilled',
      });
      toast.success('Public API endpoints verified successfully');
    } catch (err: any) {
      toast.error('Health check encountered issues');
    } finally {
      setIsCheckingApi(false);
    }
  };

  const handleConfirmReset = async () => {
    try {
      setIsResetting(true);
      await landingService.resetAdminContent();
      toast.success('Landing page content has been reset to initial DMDC defaults');
      setIsResetModalOpen(false);
      onRefreshAll();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reset content');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">
          Publish, Verification & Live Preview
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Verify live API responses, check crawler endpoints, launch the public site, or restore approved system defaults.
        </p>
      </div>

      {/* Launch Portal Card */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-semibold border border-blue-500/30">
            <Globe size={14} />
            <span>Public Facing Portal</span>
          </div>
          <h4 className="text-xl sm:text-2xl font-bold tracking-tight">
            DMDC Public Healthcare Website
          </h4>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            The frontend automatically consumes the live dynamic content and published doctors configured through this panel.
          </p>
        </div>

        <a
          href="http://localhost:5173"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl font-bold text-sm shadow-lg transition duration-200 hover:scale-[1.02] flex-shrink-0"
        >
          <span>Launch Landing Page</span>
          <ExternalLink size={16} />
        </a>
      </div>

      {/* Live API Health Monitor */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h4 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Activity size={18} className="text-blue-600" />
              <span>Public API Health Monitor</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Test end-to-end responsiveness of the public landing page endpoints
            </p>
          </div>
          <button
            type="button"
            onClick={handleRunHealthCheck}
            disabled={isCheckingApi}
            className="cursor-pointer inline-flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition disabled:opacity-50"
          >
            <RefreshCw size={14} className={isCheckingApi ? 'animate-spin' : ''} />
            <span>{isCheckingApi ? 'Verifying Endpoints...' : 'Run Endpoint Verification'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Content API</span>
              {apiStatuses.content === true ? (
                <span className="text-xs font-bold text-emerald-600 flex items-center space-x-1">
                  <CheckCircle2 size={14} />
                  <span>200 OK</span>
                </span>
              ) : (
                <span className="text-xs text-slate-400 font-mono">GET /landing/content</span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">Delivers hero, services, about, stats, and articles</p>
          </div>

          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Doctors API</span>
              {apiStatuses.doctors === true ? (
                <span className="text-xs font-bold text-emerald-600 flex items-center space-x-1">
                  <CheckCircle2 size={14} />
                  <span>200 OK</span>
                </span>
              ) : (
                <span className="text-xs text-slate-400 font-mono">GET /landing/doctors</span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">Delivers verified and published clinicians</p>
          </div>

          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">SEO & Schema API</span>
              {apiStatuses.seo === true ? (
                <span className="text-xs font-bold text-emerald-600 flex items-center space-x-1">
                  <CheckCircle2 size={14} />
                  <span>200 OK</span>
                </span>
              ) : (
                <span className="text-xs text-slate-400 font-mono">GET /landing/seo</span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">Delivers meta tags and MedicalClinic structured schema</p>
          </div>
        </div>
      </div>

      {/* Crawler Links */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-3 flex items-center space-x-2">
          <Server size={16} className="text-purple-600" />
          <span>Search Engine Crawler Directives</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href="http://localhost:8000/api/landing/sitemap.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-purple-300 hover:bg-purple-50/30 transition group"
          >
            <div>
              <span className="text-sm font-bold text-slate-900 group-hover:text-purple-700 block">
                Dynamic XML Sitemap
              </span>
              <span className="text-xs text-slate-500">/api/landing/sitemap.xml</span>
            </div>
            <ExternalLink size={16} className="text-slate-400 group-hover:text-purple-600" />
          </a>

          <a
            href="http://localhost:8000/api/landing/robots.txt"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-purple-300 hover:bg-purple-50/30 transition group"
          >
            <div>
              <span className="text-sm font-bold text-slate-900 group-hover:text-purple-700 block">
                Robots.txt Directive
              </span>
              <span className="text-xs text-slate-500">/api/landing/robots.txt</span>
            </div>
            <ExternalLink size={16} className="text-slate-400 group-hover:text-purple-600" />
          </a>
        </div>
      </div>

      {/* Superadmin Danger Zone: Reset to Defaults */}
      {isSuperAdmin && (
        <div className="bg-red-50/40 border border-red-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-base font-bold text-red-900 flex items-center space-x-2">
                <ShieldAlert size={18} className="text-red-600" />
                <span>Restore Approved System Defaults</span>
              </h4>
              <p className="text-xs text-red-700 leading-relaxed max-w-xl">
                Reset all landing page sections (Hero, About, Services, Stats, Articles, Contact, and SEO) back to the original approved DMDC copy. Existing appointments and doctor records are preserved.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsResetModalOpen(true)}
              className="cursor-pointer inline-flex items-center space-x-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition flex-shrink-0"
            >
              <RotateCcw size={15} />
              <span>Reset Content to Defaults</span>
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleConfirmReset}
        title="Reset Landing Page Content"
        message="Are you sure you want to reset all landing page sections to initial DMDC defaults? Any unsaved edits will be replaced with standard copy."
        confirmText="Yes, Reset Content"
        isConfirming={isResetting}
      />
    </div>
  );
};
