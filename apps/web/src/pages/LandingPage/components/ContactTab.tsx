import React from 'react';
import { Phone, PhoneCall, Mail, MapPin, Clock, AlertCircle } from 'lucide-react';
import type { ContactSection } from '../../../services/landing.service';

interface ContactTabProps {
  contact: ContactSection;
  onChange: (updatedContact: Partial<ContactSection>) => void;
}

export const ContactTab: React.FC<ContactTabProps> = ({ contact, onChange }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Contact & Emergency Information</h3>
        <p className="text-sm text-slate-500 mt-1">
          Configure telephone hotlines, email, clinic address, operating hours, and emergency notices.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Telephone & Hotlines */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-3 flex items-center space-x-2">
            <Phone size={16} className="text-blue-600" />
            <span>Telecommunication Hotlines</span>
          </h4>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">
              Primary Consultation Telephone
            </label>
            <div className="relative">
              <input
                type="text"
                value={contact.phone || ''}
                onChange={(e) => onChange({ phone: e.target.value })}
                placeholder="e.g. +880 1234-567890"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
              />
              <Phone size={16} className="absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">
              24/7 Emergency Ambulance Hotline
            </label>
            <div className="relative">
              <input
                type="text"
                value={contact.emergencyPhone || ''}
                onChange={(e) => onChange({ emergencyPhone: e.target.value })}
                placeholder="e.g. +880 1999-999999"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-red-200 rounded-xl text-sm font-bold text-red-600"
              />
              <PhoneCall size={16} className="absolute left-3.5 top-3 text-red-500 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">
              Support & Inquiries Email
            </label>
            <div className="relative">
              <input
                type="email"
                value={contact.email || ''}
                onChange={(e) => onChange({ email: e.target.value })}
                placeholder="e.g. info@dmdc.com.bd"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
              />
              <Mail size={16} className="absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Location & Hours */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-3 flex items-center space-x-2">
            <Clock size={16} className="text-blue-600" />
            <span>Clinic Location & Schedule</span>
          </h4>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">
              Clinic Physical Address
            </label>
            <div className="relative">
              <textarea
                rows={2}
                value={contact.address || ''}
                onChange={(e) => onChange({ address: e.target.value })}
                placeholder="e.g. House #12, Road #4, Dhanmondi, Dhaka-1205, Bangladesh"
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
              />
              <MapPin size={16} className="absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">
              Outpatient Operating Hours
            </label>
            <div className="relative">
              <input
                type="text"
                value={contact.openingHours || ''}
                onChange={(e) => onChange({ openingHours: e.target.value })}
                placeholder="e.g. Sat - Thu: 08:00 AM - 10:00 PM | Fri: 09:00 AM - 08:00 PM"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
              />
              <Clock size={16} className="absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">
              Emergency & Ambulance Service Notice
            </label>
            <div className="relative">
              <textarea
                rows={2}
                value={contact.emergencyNote || ''}
                onChange={(e) => onChange({ emergencyNote: e.target.value })}
                placeholder="e.g. 24/7 Emergency trauma, diagnostic pathology, and ambulance services operate without interruption."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
              />
              <AlertCircle size={16} className="absolute left-3.5 top-3 text-amber-500 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
