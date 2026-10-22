import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Globe,
  LayoutTemplate,
  Users,
  Activity,
  BarChart3,
  BookOpen,
  Phone,
  Search,
  Save,
  ExternalLink,
  ShieldAlert,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { landingService } from '../../services/landing.service';
import type { LandingContentData } from '../../services/landing.service';
import { useAuthStore } from '../../store/authStore';
import { FormSkeleton } from '../../components/skeleton/FormSkeleton';

// Tab Components
import { OverviewTab } from './components/OverviewTab';
import { HeroTab } from './components/HeroTab';
import { AboutTab } from './components/AboutTab';
import { DoctorsTab } from './components/DoctorsTab';
import { ServicesTab } from './components/ServicesTab';
import { StatsTab } from './components/StatsTab';
import { ArticlesTab } from './components/ArticlesTab';
import { ContactTab } from './components/ContactTab';
import { SeoTab } from './components/SeoTab';
import { PreviewTab } from './components/PreviewTab';

export const LandingPageManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  const [activeTab, setActiveTab] = useState('overview');
  const [formData, setFormData] = useState<LandingContentData | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Fetch current landing content
  const {
    data: contentData,
    isLoading: isLoadingContent,
    isError: isErrorContent,
    error: errorContent,
    refetch: refetchContent,
  } = useQuery({
    queryKey: ['landing-admin-content'],
    queryFn: landingService.getAdminContent,
  });

  // Fetch doctors
  const {
    data: doctorsData = [],
    isLoading: isLoadingDoctors,
    refetch: refetchDoctors,
  } = useQuery({
    queryKey: ['landing-admin-doctors'],
    queryFn: landingService.getAdminDoctors,
  });

  // Initialize form state
  useEffect(() => {
    if (contentData) {
      setFormData(contentData);
      setHasUnsavedChanges(false);
    }
  }, [contentData]);

  // Warn on browser unload if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Partial update handler for content tabs
  const handleContentChange = (partial: Partial<LandingContentData>) => {
    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        ...partial,
      };
    });
    setHasUnsavedChanges(true);
  };

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: Partial<LandingContentData>) => {
      // If Receptionist, omit SEO to respect backend RBAC policy
      const sanitized = { ...payload };
      if (!isSuperAdmin) {
        delete sanitized.seo;
      }
      return landingService.updateAdminContent(sanitized);
    },
    onSuccess: (updated) => {
      setFormData(updated);
      setHasUnsavedChanges(false);
      queryClient.invalidateQueries({ queryKey: ['landing-admin-content'] });
      toast.success('Landing page content saved and published successfully!');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to save landing page content');
    },
  });

  const handleSave = () => {
    if (!formData) return;
    saveMutation.mutate(formData);
  };

  if (isLoadingContent || isLoadingDoctors) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 animate-in fade-in duration-300">
        <FormSkeleton />
      </div>
    );
  }

  if (isErrorContent || !formData) {
    return (
      <div className="p-8 text-center max-w-xl mx-auto bg-white border border-red-200 rounded-2xl shadow-sm space-y-4 my-12">
        <ShieldAlert size={40} className="text-red-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">Failed to Load Landing Page Content</h3>
        <p className="text-sm text-slate-500">
          {(errorContent as any)?.message || 'The backend service could not be reached or an error occurred.'}
        </p>
        <button
          type="button"
          onClick={() => refetchContent()}
          className="cursor-pointer inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 shadow"
        >
          <span>Retry Loading</span>
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutTemplate },
    { id: 'hero', label: 'Hero Section', icon: Sparkles },
    { id: 'about', label: 'About DMDC', icon: BookOpen },
    { id: 'doctors', label: 'Doctors', icon: Users, badge: doctorsData.filter((d) => d.isPublished).length },
    { id: 'services', label: 'Services', icon: Activity },
    { id: 'stats', label: 'Statistics', icon: BarChart3 },
    { id: 'articles', label: 'Articles', icon: BookOpen },
    { id: 'contact', label: 'Contact', icon: Phone },
    { id: 'seo', label: 'SEO & Metadata', icon: Search, restricted: !isSuperAdmin },
    { id: 'preview', label: 'Preview & Status', icon: Globe },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-2 sm:p-4 animate-in fade-in duration-300">
      {/* Top Header & Global Actions */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Landing Page Management
            </h1>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                isSuperAdmin
                  ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
              }`}
            >
              {isSuperAdmin ? 'Superadmin / Admin' : 'Receptionist'}
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Dynamic content management, clinician availability, and search engine optimization for DMDC.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {hasUnsavedChanges && (
            <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl animate-pulse">
              ● Unsaved Changes
            </span>
          )}

          <a
            href="http://localhost:5173"
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer inline-flex items-center space-x-1.5 px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <span>Live Site</span>
            <ExternalLink size={13} className="text-slate-400" />
          </a>

          <button
            type="button"
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="cursor-pointer inline-flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={15} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Tabs Ribbon */}
      <div className="bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm overflow-x-auto">
        <div className="flex items-center space-x-1 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`cursor-pointer inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
                {tab.restricted && (
                  <span className="text-[10px] opacity-75 font-normal">(View Only)</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Panels */}
      <div className="pt-2">
        {activeTab === 'overview' && (
          <OverviewTab
            content={formData}
            doctors={doctorsData}
            onChange={handleContentChange}
            onNavigateTab={(tab) => setActiveTab(tab)}
            isSuperAdmin={isSuperAdmin}
          />
        )}

        {activeTab === 'hero' && (
          <HeroTab
            hero={formData.hero}
            onChange={(updatedHero) =>
              handleContentChange({ hero: { ...formData.hero, ...updatedHero } })
            }
          />
        )}

        {activeTab === 'about' && (
          <AboutTab
            about={formData.about}
            onChange={(updatedAbout) =>
              handleContentChange({ about: { ...formData.about, ...updatedAbout } })
            }
          />
        )}

        {activeTab === 'doctors' && (
          <DoctorsTab
            doctors={doctorsData}
            onRefreshDoctors={() => {
              refetchDoctors();
              refetchContent();
            }}
            isSuperAdmin={isSuperAdmin}
          />
        )}

        {activeTab === 'services' && (
          <ServicesTab
            services={formData.services}
            onChange={(updatedServices) =>
              handleContentChange({ services: { ...formData.services, ...updatedServices } })
            }
          />
        )}

        {activeTab === 'stats' && (
          <StatsTab
            stats={formData.stats}
            onChange={(updatedStats) =>
              handleContentChange({ stats: { ...formData.stats, ...updatedStats } })
            }
          />
        )}

        {activeTab === 'articles' && (
          <ArticlesTab
            articles={formData.articles}
            onChange={(updatedArticles) =>
              handleContentChange({ articles: { ...formData.articles, ...updatedArticles } })
            }
          />
        )}

        {activeTab === 'contact' && (
          <ContactTab
            contact={formData.contact}
            onChange={(updatedContact) =>
              handleContentChange({ contact: { ...formData.contact, ...updatedContact } })
            }
          />
        )}

        {activeTab === 'seo' && (
          <SeoTab
            seo={formData.seo}
            onChange={(updatedSeo) =>
              handleContentChange({ seo: { ...formData.seo, ...updatedSeo } })
            }
            isSuperAdmin={isSuperAdmin}
          />
        )}

        {activeTab === 'preview' && (
          <PreviewTab
            onRefreshAll={() => {
              refetchContent();
              refetchDoctors();
            }}
            isSuperAdmin={isSuperAdmin}
          />
        )}
      </div>
    </div>
  );
};
