import React from 'react';
import { Plus, Trash2, CheckCircle2, Image as ImageIcon, Sparkles } from 'lucide-react';
import type { AboutSection } from '../../../services/landing.service';
import { ImageUpload } from '../../../components/ImageUpload';

interface AboutTabProps {
  about: AboutSection;
  onChange: (updatedAbout: Partial<AboutSection>) => void;
}

export const AboutTab: React.FC<AboutTabProps> = ({ about, onChange }) => {
  const bulletPoints = about.bulletPoints || [];

  const handleAddBullet = () => {
    onChange({
      bulletPoints: [...bulletPoints, 'New healthcare highlight'],
    });
  };

  const handleUpdateBullet = (index: number, value: string) => {
    const updated = [...bulletPoints];
    updated[index] = value;
    onChange({ bulletPoints: updated });
  };

  const handleRemoveBullet = (index: number) => {
    const updated = bulletPoints.filter((_, i) => i !== index);
    onChange({ bulletPoints: updated });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">About DMDC Section</h3>
        <p className="text-sm text-slate-500 mt-1">
          Manage the institutional profile, clinical mission statement, and core excellence features.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-3">
              Mission & Story
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Section Badge Label
              </label>
              <input
                type="text"
                value={about.badge || ''}
                onChange={(e) => onChange({ badge: e.target.value })}
                placeholder="e.g. About DMDC"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                About Heading Title
              </label>
              <input
                type="text"
                value={about.title || ''}
                onChange={(e) => onChange({ title: e.target.value })}
                placeholder="e.g. Dedicated to Comprehensive Diagnostic & Clinical Excellence"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Overview Narrative Description
              </label>
              <textarea
                rows={4}
                value={about.description || ''}
                onChange={(e) => onChange({ description: e.target.value })}
                placeholder="Detailed clinical history and patient commitment..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
              />
            </div>
          </div>

          {/* Bullet Points Manager */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Key Clinical Highlights ({bulletPoints.length})
              </h4>
              <button
                type="button"
                onClick={handleAddBullet}
                className="cursor-pointer inline-flex items-center space-x-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition"
              >
                <Plus size={14} />
                <span>Add Bullet Point</span>
              </button>
            </div>

            <div className="space-y-3">
              {bulletPoints.map((point, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="text-emerald-500 flex-shrink-0">
                    <CheckCircle2 size={18} />
                  </div>
                  <input
                    type="text"
                    value={point}
                    onChange={(e) => handleUpdateBullet(index, e.target.value)}
                    placeholder="Clinical highlight..."
                    className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveBullet(index)}
                    className="cursor-pointer p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                    title="Remove highlight"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {bulletPoints.length === 0 && (
                <div className="text-center py-6 text-sm text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No bullet highlights configured. Click "Add Bullet Point" above.
                </div>
              )}
            </div>
          </div>

          {/* Image Asset */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-3">
              About Photo / Illustration
            </h4>
            <ImageUpload
              value={about.image}
              onChange={(url) => onChange({ image: url })}
              label="About Section Image"
            />
          </div>
        </div>

        {/* Live Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-20">
            <div className="bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-800 text-white space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <Sparkles size={14} className="text-blue-400" />
                  <span>About Preview</span>
                </span>
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full font-semibold border border-emerald-500/30">
                  Visitor View
                </span>
              </div>

              <div className="space-y-4 bg-slate-950/60 p-5 rounded-xl border border-slate-800/80">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-600/30 text-blue-300 border border-blue-500/30">
                  {about.badge || 'About DMDC'}
                </span>

                <h3 className="text-lg font-bold leading-snug text-white">
                  {about.title || 'Dedicated to Comprehensive Diagnostic & Clinical Excellence'}
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {about.description ||
                    'Dhaka Medical & Diagnostic Center was founded with a clear mission: to provide world-class medical diagnostic and healthcare consulting services.'}
                </p>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  {bulletPoints.slice(0, 4).map((pt, i) => (
                    <div key={i} className="flex items-start space-x-2 text-xs text-slate-200">
                      <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              {about.image && (
                <div className="space-y-2">
                  <span className="text-xs font-medium text-slate-400 flex items-center space-x-1">
                    <ImageIcon size={14} />
                    <span>Photo Asset</span>
                  </span>
                  <div className="h-44 rounded-xl overflow-hidden bg-slate-800 border border-slate-700/80">
                    <img
                      src={about.image}
                      alt="About preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=600';
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
