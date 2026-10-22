import React from 'react';
import {
  Search,
  Share2,
  ShieldAlert,
} from 'lucide-react';
import type { SeoConfig } from '../../../services/landing.service';
import { ImageUpload } from '../../../components/ImageUpload';

interface SeoTabProps {
  seo: SeoConfig;
  onChange: (updatedSeo: Partial<SeoConfig>) => void;
  isSuperAdmin: boolean;
}

export const SeoTab: React.FC<SeoTabProps> = ({ seo, onChange, isSuperAdmin }) => {
  const titleLength = (seo.metaTitle || '').length;
  const descLength = (seo.metaDescription || '').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">Technical SEO & Social Metadata</h3>
          <p className="text-sm text-slate-500 mt-1">
            Configure search engine indexing, Google SERP titles, Open Graph sharing cards, and crawler directives.
          </p>
        </div>
        {!isSuperAdmin && (
          <div className="inline-flex items-center space-x-2 bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-xl text-xs font-semibold">
            <ShieldAlert size={15} className="text-amber-600" />
            <span>Read-Only Mode (Restricted for Receptionist)</span>
          </div>
        )}
      </div>

      {!isSuperAdmin && (
        <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start space-x-3 text-amber-900 text-xs leading-relaxed">
          <ShieldAlert size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Role-Based Permission Notice:</span> You are currently signed in as a Receptionist. In accordance with system security policies, Search Engine Optimization and indexing configurations require Superadmin or Administrator privileges. These settings are displayed in view-only mode.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Controls */}
        <div className="lg:col-span-7 space-y-6">
          {/* Search Engine Metadata */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>Google SERP Metadata</span>
              <Search size={16} className="text-blue-600" />
            </h4>

            {/* Meta Title */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Document Title (Meta Title)
                </label>
                <span
                  className={`text-xs font-bold ${
                    titleLength >= 50 && titleLength <= 60
                      ? 'text-emerald-600'
                      : titleLength > 60
                      ? 'text-red-500'
                      : 'text-slate-400'
                  }`}
                >
                  {titleLength} / 60 chars {titleLength >= 50 && titleLength <= 60 ? '(Optimal)' : ''}
                </span>
              </div>
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={seo.metaTitle || ''}
                onChange={(e) => onChange({ metaTitle: e.target.value })}
                placeholder="e.g. DMDC - Dhaka Medical & Diagnostic Center | Specialist Doctors"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Meta Description */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Meta Description
                </label>
                <span
                  className={`text-xs font-bold ${
                    descLength >= 140 && descLength <= 160
                      ? 'text-emerald-600'
                      : descLength > 160
                      ? 'text-red-500'
                      : 'text-slate-400'
                  }`}
                >
                  {descLength} / 160 chars {descLength >= 140 && descLength <= 160 ? '(Optimal)' : ''}
                </span>
              </div>
              <textarea
                rows={3}
                disabled={!isSuperAdmin}
                value={seo.metaDescription || ''}
                onChange={(e) => onChange({ metaDescription: e.target.value })}
                placeholder="Concise overview summarizing DMDC services for search engine indexers..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Keywords */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Keywords (Comma-Separated)
              </label>
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={seo.keywords || ''}
                onChange={(e) => onChange({ keywords: e.target.value })}
                placeholder="e.g. Dhaka Medical, diagnostic center, specialist doctors, cardiology, pathology"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Canonical URL & Robots */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Canonical URL
                </label>
                <input
                  type="text"
                  disabled={!isSuperAdmin}
                  value={seo.canonicalUrl || ''}
                  onChange={(e) => onChange({ canonicalUrl: e.target.value })}
                  placeholder="e.g. http://localhost:5173"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Robots Indexing Directive
                </label>
                <select
                  disabled={!isSuperAdmin}
                  value={seo.robots || 'index, follow'}
                  onChange={(e) => onChange({ robots: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="index, follow">index, follow (Standard Public Indexing)</option>
                  <option value="noindex, follow">noindex, follow (Hidden from search, follow links)</option>
                  <option value="noindex, nofollow">noindex, nofollow (Complete Staging Privacy)</option>
                  <option value="index, nofollow">index, nofollow (Index page only)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Social Sharing & Open Graph */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>Open Graph & Social Media Sharing</span>
              <Share2 size={16} className="text-indigo-600" />
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Open Graph Title (Facebook / LinkedIn)
              </label>
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={seo.ogTitle || ''}
                onChange={(e) => onChange({ ogTitle: e.target.value })}
                placeholder="Defaults to Meta Title if blank"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Open Graph Description
              </label>
              <textarea
                rows={2}
                disabled={!isSuperAdmin}
                value={seo.ogDescription || ''}
                onChange={(e) => onChange({ ogDescription: e.target.value })}
                placeholder="Defaults to Meta Description if blank"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Twitter Card Type
              </label>
              <select
                disabled={!isSuperAdmin}
                value={seo.twitterCard || 'summary_large_image'}
                onChange={(e) => onChange({ twitterCard: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="summary_large_image">summary_large_image (Large Hero Banner Card)</option>
                <option value="summary">summary (Standard Compact Card)</option>
              </select>
            </div>

            {isSuperAdmin ? (
              <ImageUpload
                value={seo.ogImage}
                onChange={(url) => onChange({ ogImage: url })}
                label="Social Share Banner Image (1200x630 recommended)"
              />
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Social Share Image URL
                </label>
                <input
                  type="text"
                  disabled
                  value={seo.ogImage || ''}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium opacity-60"
                />
              </div>
            )}
          </div>
        </div>

        {/* Live SERP & Social Previews */}
        <div className="lg:col-span-5 space-y-6">
          {/* Google SERP Preview */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
                <Search size={14} className="text-blue-600" />
                <span>Google Search Snippet Preview</span>
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono">
                SERP Live
              </span>
            </div>

            {/* Google Result Mock */}
            <div className="space-y-1.5 font-sans">
              <div className="flex items-center space-x-2 text-xs text-slate-700">
                <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                  D
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] font-medium text-slate-800">
                    Dhaka Medical & Diagnostic Center
                  </span>
                  <span className="text-[11px] text-slate-500 truncate max-w-[280px]">
                    {seo.canonicalUrl || 'http://localhost:5173'}
                  </span>
                </div>
              </div>

              <h4 className="text-base text-blue-700 hover:underline cursor-pointer font-medium leading-snug line-clamp-1">
                {seo.metaTitle || 'DMDC - Dhaka Medical & Diagnostic Center | Comprehensive Healthcare'}
              </h4>

              <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                {seo.metaDescription ||
                  'Dhaka Medical & Diagnostic Center offers advanced medical diagnostic services, 24/7 emergency care, and consultations with top specialist physicians in Bangladesh.'}
              </p>
            </div>
          </div>

          {/* Social Media Card Preview */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
                <Share2 size={14} className="text-indigo-600" />
                <span>Social Share Card Preview</span>
              </span>
              <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-mono">
                OG Preview
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-slate-50">
              <div className="h-44 bg-slate-200 overflow-hidden relative">
                <img
                  src={
                    seo.ogImage ||
                    'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=600'
                  }
                  alt="Social share preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=600';
                  }}
                />
              </div>
              <div className="p-4 space-y-1 bg-white border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400">dmdc.com.bd</span>
                <h5 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1">
                  {seo.ogTitle || seo.metaTitle || 'DMDC - Dhaka Medical & Diagnostic Center'}
                </h5>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {seo.ogDescription || seo.metaDescription || 'Advanced medical care and consultations.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
