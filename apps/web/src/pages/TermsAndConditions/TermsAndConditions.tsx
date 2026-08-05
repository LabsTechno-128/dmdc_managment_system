import React from 'react';
import { FileText, Shield, AlertCircle, Mail } from 'lucide-react';

export const TermsAndConditions: React.FC = () => {
    const lastUpdated = 'August 5, 2026';

    const sections = [
        {
            id: 'acceptance',
            title: '1. Acceptance of Terms',
            content:
                'By accessing and using this Hospital Management System ("the System"), you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these terms, please do not use the System.',
        },
        {
            id: 'license',
            title: '2. License to Use',
            content:
                'Subject to your compliance with these Terms, the System grants you a limited, non-exclusive, non-transferable license to access and use the System for internal hospital and diagnostic center operations.',
        },
        {
            id: 'privacy',
            title: '3. Patient Privacy & Data Protection',
            content:
                'All patient data entered into the System is treated as confidential and is protected in accordance with applicable healthcare privacy laws. The System employs industry-standard security measures to safeguard sensitive health information. Unauthorized access, sharing, or distribution of patient records is strictly prohibited.',
        },
        {
            id: 'usage',
            title: '4. Acceptable Use',
            content:
                'You agree to use the System only for lawful purposes. You are prohibited from: (a) attempting to gain unauthorized access to any part of the System; (b) introducing malicious code or disrupting system operations; (c) using the System to store or transmit any unlawful, harmful, or defamatory content; (d) sharing your account credentials with unauthorized individuals.',
        },
        {
            id: 'accounts',
            title: '5. User Accounts & Responsibilities',
            content:
                'Authorized users are provided with unique credentials. You are responsible for maintaining the confidentiality of your login information and for all activities conducted under your account. You must notify the system administrator immediately of any unauthorized use or security breach.',
        },
        {
            id: 'disclaimer',
            title: '6. Disclaimer of Warranties',
            content:
                'The System is provided "as is" and "as available" without warranties of any kind, either express or implied. While we strive to maintain system accuracy and availability, we do not guarantee that the System will be error-free, uninterrupted, or completely secure.',
        },
        {
            id: 'liability',
            title: '7. Limitation of Liability',
            content:
                'To the maximum extent permitted by law, the System and its providers shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of data, revenue, or profits, arising out of or related to your use of the System.',
        },
        {
            id: 'changes',
            title: '8. Changes to Terms',
            content:
                'We reserve the right to modify or update these Terms at any time. Continued use of the System after changes are posted constitutes your acceptance of the revised Terms. We recommend reviewing this page periodically.',
        },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Terms & Conditions
                </h1>
                <p className="text-slate-500 mt-1">
                    Please read these terms carefully before using the System
                </p>
            </div>

            {/* Last Updated Banner */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <div>
                    <p className="text-sm font-medium text-slate-700">
                        Last Updated: {lastUpdated}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                        These terms may be updated periodically. Please review them regularly.
                    </p>
                </div>
            </div>

            {/* Introduction */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 sm:p-8 space-y-4">
                    <div className="flex items-center space-x-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold text-slate-800">Introduction</h2>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                        Welcome to the Diagnostic Pro Hospital Management System. These Terms
                        and Conditions ("Terms") govern your access to and use of the System
                        provided by Diagnostic Pro. By using the System, you acknowledge that
                        you have read, understood, and agree to be bound by these Terms.
                    </p>
                </div>
            </div>

            {/* Terms Sections */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 sm:p-8 space-y-8">
                    {sections.map((section) => (
                        <div key={section.id} className="space-y-2">
                            <h3 className="text-base font-semibold text-slate-800">
                                {section.title}
                            </h3>
                            <p className="text-slate-600 leading-relaxed text-sm">
                                {section.content}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Contact Section */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 sm:p-8 space-y-4">
                    <div className="flex items-center space-x-2">
                        <Shield className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold text-slate-800">
                            Contact & Support
                        </h2>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-sm">
                        If you have any questions, concerns, or requests regarding these Terms
                        or the System, please contact the system administrator:
                    </p>
                    <div className="flex items-center space-x-2 text-sm text-slate-700 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                        <Mail className="h-4 w-4 text-primary" />
                        <span className="font-medium">support@diagnosticpro.com</span>
                    </div>
                </div>
            </div>
        </div>
    );
};