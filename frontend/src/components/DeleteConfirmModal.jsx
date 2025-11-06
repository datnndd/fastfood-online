export default function DeleteConfirmModal({ title, message, onConfirm, onCancel }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl transform animate-bounce-in">
                {/* Warning Icon Header */}
                <div className="bg-gradient-to-br from-red-500 to-red-600 px-8 py-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>

                    <div className="relative text-center">
                        <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full mb-4 shadow-2xl animate-pulse-scale">
                            <span className="text-6xl">⚠️</span>
                        </div>
                        <h3 className="text-2xl font-black text-white">
                            {title || 'XÁC NHẬN XÓA'}
                        </h3>
                    </div>
                </div>

                {/* Content */}
                <div className="px-8 py-8">
                    <div className="bg-red-50 border-l-4 border-red-500 px-6 py-5 rounded-xl mb-8">
                        <p className="text-gray-800 text-lg leading-relaxed font-medium">
                            {message || 'Bạn có chắc chắn muốn xóa?'}
                        </p>
                    </div>

                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl px-5 py-4 mb-8">
                        <div className="flex items-start gap-3">
                            <span className="text-2xl flex-shrink-0">💡</span>
                            <div>
                                <p className="font-bold text-yellow-900 mb-1">Lưu ý quan trọng:</p>
                                <p className="text-sm text-yellow-800">
                                    Hành động này không thể hoàn tác. Dữ liệu sẽ bị xóa vĩnh viễn khỏi hệ thống.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 px-6 py-4 bg-gray-100 hover:bg-gray-200 border-2 border-gray-300 text-gray-700 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 hover:scale-105 transform"
                        >
                            <span>🔙</span>
                            Hủy bỏ
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            className="flex-1 px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 hover:scale-105 transform"
                        >
                            <span>🗑️</span>
                            Xác nhận xóa
                        </button>
                    </div>
                </div>

                {/* Decorative Bottom Wave */}
                <div className="h-3 bg-gradient-to-r from-red-600 via-orange-500 to-red-600"></div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes bounceIn {
                    0% { transform: scale(0.3); opacity: 0; }
                    50% { transform: scale(1.05); }
                    70% { transform: scale(0.9); }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes pulseScale {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
                .animate-bounce-in {
                    animation: bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                }
                .animate-pulse-scale {
                    animation: pulseScale 2s ease-in-out infinite;
                }
            `}</style>
        </div>
    )
}
