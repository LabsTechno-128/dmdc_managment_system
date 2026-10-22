import React from 'react';
import { Users, Stethoscope, FlaskConical, Award } from 'lucide-react';
import type { StatsSection, StatItem } from '../../../services/landing.service';

interface StatsTabProps {
  stats: StatsSection;
  onChange: (updatedStats: Partial<StatsSection>) => void;
}

export const StatsTab: React.FC<StatsTabProps> = ({ stats, onChange }) => {
  const items = stats.items || [
    { number: '50+', label: 'Specialist Doctors' },
    { number: '20K+', label: 'Happy Patients' },
    { number: '15+', label: 'Diagnostic Labs' },
    { number: '99.8%', label: 'Success Rate' },
  ];

  const handleUpdateItem = (index: number, field: keyof StatItem, value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ items: updated });
  };

  const icons = [Stethoscope, Users, FlaskConical, Award];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Clinical Statistics</h3>
        <p className="text-sm text-slate-500 mt-1">
          Configure the four key achievement and trust metrics displayed on the landing page counter ribbon.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((stat, idx) => {
          const Icon = icons[idx % icons.length];
          return (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 hover:border-blue-300 transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Metric #{idx + 1}
                </span>
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Icon size={20} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                  Number / Counter Value
                </label>
                <input
                  type="text"
                  value={stat.number || ''}
                  onChange={(e) => handleUpdateItem(idx, 'number', e.target.value)}
                  placeholder="e.g. 50+"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                  Descriptive Label
                </label>
                <input
                  type="text"
                  value={stat.label || ''}
                  onChange={(e) => handleUpdateItem(idx, 'label', e.target.value)}
                  placeholder="e.g. Specialist Doctors"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
