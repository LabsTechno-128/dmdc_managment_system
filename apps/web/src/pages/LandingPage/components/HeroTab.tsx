import React from 'react';
import { Sparkles, Calendar, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import type { HeroSection } from '../../../services/landing.service';
import { ImageUpload } from '../../../components/ImageUpload';

interface HeroTabProps {
  hero: HeroSection;
  onChange: (updatedHero: Partial<HeroSection>) => void;
}

export const HeroTab: React.FC<HeroTabProps> = ({ hero, onChange }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Hero Section Settings</h3>
        <p className="text-sm text-slate-500 mt-1">
          Configure the main headline, call-to-action button, and showcase banner visitors see first.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Fields */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-3">
              Hero Copywriting
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Badge Headline Tag
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={hero.badge || ''}
                  onChange={(e) => onChange({ badge: e.target.value })}
                  placeholder="e.g. Your Health, Our Priority"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                />
                <Sparkles size={16} className="absolute left-3.5 top-3 text-blue-500 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Main Headline Leading Text
              </label>
              <input
                type="text"
                value={hero.title || ''}
                onChange={(e) => onChange({ title: e.target.value })}
                placeholder="e.g. Providing Exceptional Healthcare for"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Headline Highlighted Accent Phrase (Blue Colored)
              </label>
              <input
                type="text"
                value={hero.titleHighlight || ''}
                onChange={(e) => onChange({ titleHighlight: e.target.value })}
                placeholder="e.g. Every Patient"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-blue-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Supporting Subtitle Description
              </label>
              <textarea
                rows={3}
                value={hero.subtitle || ''}
                onChange={(e) => onChange({ subtitle: e.target.value })}
                placeholder="e.g. At Dhaka Medical & Diagnostic Center, we combine advanced medical technology with compassionate care..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
              />
            </div>
          </div>

          {/* CTA & Destinations */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-3">
              Action Buttons & Destinations
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  CTA Button Label
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={hero.ctaText || ''}
                    onChange={(e) => onChange({ ctaText: e.target.value })}
                    placeholder="e.g. Book an Appointment"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                  />
                  <Calendar size={16} className="absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Destination URL or Section Target
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={hero.ctaLink || ''}
                    onChange={(e) => onChange({ ctaLink: e.target.value })}
                    placeholder="e.g. #appointment"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                  />
                  <LinkIcon size={16} className="absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Hero Visual Image */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-3">
              Hero Graphic / Visual Asset
            </h4>

            <ImageUpload
              value={hero.image}
              onChange={(url) => onChange({ image: url })}
              label="Hero Banner Image"
            />
          </div>
        </div>

        {/* Live Card Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-20">
            <div className="bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-800 text-white space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <Sparkles size={14} className="text-blue-400" />
                  <span>Real-Time Visitor Preview</span>
                </span>
                <span className="text-xs bg-blue-500/20 text-blue-400 px-2.5 py-0.5 rounded-full font-semibold border border-blue-500/30">
                  Live Preview
                </span>
              </div>

              {/* Mock Hero Component */}
              <div className="space-y-4 bg-slate-950/60 p-5 rounded-xl border border-slate-800/80">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-600/30 text-blue-300 border border-blue-500/30">
                  {hero.badge || 'Your Health, Our Priority'}
                </span>

                <h3 className="text-xl font-bold leading-tight text-white">
                  {hero.title || 'Providing Exceptional Healthcare for'}{' '}
                  <span className="text-blue-400">{hero.titleHighlight || 'Every Patient'}</span>
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {hero.subtitle ||
                    'At Dhaka Medical & Diagnostic Center, we combine advanced medical technology with compassionate care to ensure the best health outcomes for you and your family.'}
                </p>

                <div className="pt-2">
                  <button
                    type="button"
                    className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md pointer-events-none"
                  >
                    <Calendar size={14} />
                    <span>{hero.ctaText || 'Book an Appointment'}</span>
                  </button>
                </div>
              </div>

              {/* Graphic Preview */}
              {hero.image && (
                <div className="space-y-2">
                  <span className="text-xs font-medium text-slate-400 flex items-center space-x-1">
                    <ImageIcon size={14} />
                    <span>Hero Graphic Preview</span>
                  </span>
                  <div className="h-44 rounded-xl overflow-hidden bg-slate-800 border border-slate-700/80">
                    <img
                      src={hero.image}
                      alt="Hero preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=600';
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
