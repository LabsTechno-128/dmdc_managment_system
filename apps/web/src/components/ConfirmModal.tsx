import React, { useEffect } from 'react';
import { HelpCircle, X, Check, Loader2 } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string;
    itemName?: string;
    isConfirming?: boolean;
    confirmText?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    itemName,
    isConfirming = false,
    confirmText = 'Confirm',
}) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />

            {/* Modal */}
            <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="cursor-pointer absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    disabled={isConfirming}
                >
                    <X size={20} />
                </button>

                {/* Content */}
                <div className="p-6 sm:p-8">
                    {/* Icon */}
                    <div className="flex items-center justify-center w-14 h-14 bg-blue-100 rounded-full mb-5 mx-auto">
                        <HelpCircle className="h-7 w-7 text-blue-600" />
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-slate-900 text-center mb-2">
                        {title}
                    </h3>

                    {/* Message */}
                    <p className="text-sm text-slate-500 text-center leading-relaxed mb-2">
                        {message}
                    </p>

                    {/* Item name */}
                    {itemName && (
                        <div className="mt-3 mb-5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                            <span className="text-sm font-semibold text-slate-700">{itemName}</span>
                        </div>
                    )}

                    {!itemName && <div className="mb-5" />}

                    {/* Actions */}
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={onClose}
                            disabled={isConfirming}
                            className="cursor-pointer flex-1 px-5 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isConfirming}
                            className="cursor-pointer flex-1 flex items-center justify-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                        >
                            {isConfirming ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <>
                                    <Check size={18} />
                                    <span>{confirmText}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
