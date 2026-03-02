import { useEffect, useState } from 'react';

const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Xác nhận',
    message = 'Bạn có chắc chắn muốn thực hiện hành động này?',
    confirmText = 'Xác nhận',
    cancelText = 'Hủy',
    confirmButtonClass = 'bg-indigo-600 hover:bg-indigo-700 text-white',
    type = 'default'
}) => {
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setIsLoading(false); // Reset loading state when opened
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    // Determine button classes based on type
    const getConfirmButtonClass = () => {
        if (confirmButtonClass !== 'bg-indigo-600 hover:bg-indigo-700 text-white') {
            return confirmButtonClass;
        }

        switch (type) {
            case 'danger':
                return 'bg-red-600 hover:bg-red-700 text-white';
            case 'warning':
                return 'bg-orange-600 hover:bg-orange-700 text-white';
            default:
                return 'bg-indigo-600 hover:bg-indigo-700 text-white';
        }
    };

    const handleConfirm = async () => {
        try {
            setIsLoading(true);
            await onConfirm();
            onClose();
        } catch (error) {
            console.error('Confirm action failed:', error);
            // We don't auto-close on error so user can see it or try again
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fadeIn"
            onClick={isLoading ? undefined : onClose}
        >
            <div
                className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-scaleIn"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-4 flex items-center gap-3">
                    {type === 'danger' && <span className="text-2xl">⚠️</span>}
                    {type === 'warning' && <span className="text-2xl">⚡</span>}
                    <h3 className="text-xl font-bold text-slate-900">{title}</h3>
                </div>

                <p className="mb-6 text-sm text-slate-600 leading-relaxed">{message}</p>

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors shadow-sm disabled:opacity-70 ${getConfirmButtonClass()}`}
                    >
                        {isLoading && (
                            <svg className="h-4 w-4 animate-spin text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        {isLoading ? 'Đang xử lý...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
