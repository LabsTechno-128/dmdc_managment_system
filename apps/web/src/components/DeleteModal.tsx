import React, { useEffect } from 'react';
import { AlertTriangle, X, Trash2, Loader2 } from 'lucide-react';

interface DeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string;
    itemName?: string;
    isDeleting?: boolean;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Deletion',
    message = 'Are you sure you want to delete this item? This action cannot be undone.',
    itemName,
    isDeleting = false,
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
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="cursor-pointer absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    disabled={isDeleting}
                >
                    <X size={20} />
                </button>

                {/* Content */}
                <div className="p-5 sm:p-8">
                    {/* Icon */}
                    <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-red-100 rounded-full mb-4 sm:mb-5 mx-auto">
                        <AlertTriangle className="h-6 w-6 sm:h-7 sm:w-7 text-red-600" />
                    </div>

                    {/* Title */}
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 text-center mb-2">
                        {title}
                    </h3>

                    {/* Message */}
                    <p className="text-xs sm:text-sm text-slate-500 text-center leading-relaxed mb-2">
                        {message}
                    </p>

                    {/* Item name */}
                    {itemName && (
                        <div className="mt-3 mb-5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                            <span className="text-xs sm:text-sm font-semibold text-slate-700 break-words">{itemName}</span>
                        </div>
                    )}

                    {!itemName && <div className="mb-4 sm:mb-5" />}

                    {/* Actions */}
                    <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3">
                        <button
                            onClick={onClose}
                            disabled={isDeleting}
                            className="cursor-pointer w-full sm:flex-1 px-5 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isDeleting}
                            className="cursor-pointer w-full sm:flex-1 flex items-center justify-center space-x-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm text-sm"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>Deleting...</span>
                                </>
                            ) : (
                                <>
                                    <Trash2 size={18} />
                                    <span>Delete</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};