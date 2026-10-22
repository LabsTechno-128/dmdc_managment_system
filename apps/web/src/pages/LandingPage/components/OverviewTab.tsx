import React from 'react';
import {
  Globe,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Stethoscope,
  Activity,
  Search,
  Layers,
  Sparkles,
} from 'lucide-react';
import type { LandingContentData, AdminDoctor } from '../../../services/landing.service';

interface OverviewTabProps {
  content: LandingContentData;
  doctors: AdminDoctor[];
  onChange: (updated: Partial<LandingContentData>) => void;
  onNavigateTab: (tabId: string) => void;
  isSuperAdmin: boolean;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  content,
  doctors,
  onChange,
  onNavigateTab,
}) => {
  const publishedDoctorsCount = doctors.filter((d) => d.isPublished).length;
  const servicesCount = content.services?.items?.length || 0;
  const articlesCount = content.articles?.items?.length || 0;

  const visibility = content.sectionVisibility || {
    hero: true,
    services: true,
    about: true,
    stats: true,
    doctors: true,
    articles: true,
    contact: true,
  };

  const toggleSection = (sectionKey: string) => {
    const updated = {
      ...visibility,
      [sectionKey]: !visibility[sectionKey],
    };
    onChange({
      sectionVisibility: updated,
    });
  };

  const sectionsList = [
    { key: 'hero', name: 'Hero Banner Section', tab: 'hero', desc: 'Main headline, badge, CTA, and primary visual' },
    { key: 'services', name: 'Specialties & Services', tab: 'services', desc: 'Clinical departments and health check-up cards' },
    { key: 'about', name: 'About DMDC Section', tab: 'about', desc: 'Hospital background, mission, and key feature bullets' },
    { key: 'stats', name: 'Clinical Statistics', tab: 'stats', desc: 'Metrics counters (Doctors, Patients, Labs, Success)' },
    { key: 'doctors', name: 'Medical Experts', tab: 'doctors', desc: 'Doctor cards, specialties, ratings, and booking triggers' },
    { key: 'articles', name: 'Health Articles & Advice', tab: 'articles', desc: 'Educational articles and wellness tips' },
    { key: 'contact', name: 'Contact & Emergency', tab: 'contact', desc: 'Hospital hotlines, opening hours, address, and ambulance' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner Card */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-blue-500/30 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-blue-100 border border-blue-400/30">
              <Sparkles size={14} className="text-yellow-300" />
              <span>Public Healthcare Portal CMS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              DMDC Public Landing Page Hub
            </h2>
            <p className="text-blue-100 text-sm leading-relaxed">
              Manage the content, clinicians, specialties, and SEO displayed to patients visiting Dhaka Medical & Diagnostic Center.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="http://localhost:5173"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-white text-blue-900 hover:bg-blue-50 px-4 py-2.5 rounded-xl font-semibold text-sm shadow-md transition-all duration-200 hover:scale-[1.02]"
            >
              <Globe size={16} className="text-blue-600" />
              <span>View Live Landing Page</span>
              <ExternalLink size={14} className="text-slate-400" />
            </a>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Live Doctors</span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Stethoscope size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-900">{publishedDoctorsCount}</span>
            <span className="text-xs text-slate-400">of {doctors.length} hospital doctors</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Visible on public booking list</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Clinical Services</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Activity size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-900">{servicesCount}</span>
            <span className="text-xs text-slate-400">specialties</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Cardiology, Imaging, Neurology, etc.</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Health Articles</span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <Layers size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-900">{articlesCount}</span>
            <span className="text-xs text-slate-400">published</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Patient wellness & clinical insights</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Search Engine SEO</span>
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
              <Search size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-sm font-bold text-emerald-600 flex items-center space-x-1">
              <CheckCircle2 size={16} />
              <span>Active</span>
            </span>
            <span className="text-xs text-slate-400">XML & JSON-LD</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Dynamic Google Snippets enabled</p>
        </div>
      </div>

      {/* Section Visibility Manager */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Landing Page Section Visibility</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              Toggle which sections are visible or temporarily hidden on the public website.
            </p>
          </div>
          <div className="text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
            Changes take effect upon clicking "Save Changes"
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {sectionsList.map((sec) => {
            const isVisible = visibility[sec.key] !== false;
            return (
              <div
                key={sec.key}
                className="p-5 flex items-center justify-between hover:bg-slate-50/60 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-3">
                    <span className="font-semibold text-slate-800 text-sm sm:text-base">
                      {sec.name}
                    </span>
                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        isVisible
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {isVisible ? (
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
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{sec.desc}</p>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => onNavigateTab(sec.tab)}
                    className="cursor-pointer text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Configure
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSection(sec.key)}
                    className={`cursor-pointer relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                      isVisible ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isVisible ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
