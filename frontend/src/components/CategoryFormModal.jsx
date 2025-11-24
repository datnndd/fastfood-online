import { useState, useEffect } from 'react'
import { CatalogAPI } from '../lib/api'

export default function CategoryFormModal({ category, onClose, onSave }) {
    const [formData, setFormData] = useState({
        name: ''
    })
    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (category) {
            setFormData({
                name: category.name || ''
            })
            setImagePreview(category.image_url)
        }
    }, [category])



    const handleChange = (e) => {
        const { name, value } = e.target

        if (name === 'name' && !category) {
            setFormData((prev) => ({
                ...prev,
                name: value
            }))
            return
        }

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }))
    }

    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setImageFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            if (!formData.name.trim()) {
                throw new Error('Tên danh mục không được để trống')
            }

            const dataToSubmit = {
                name: formData.name.trim()
            }

            let response
            if (category) {
                response = await CatalogAPI.updateCategory(category.id, dataToSubmit)
            } else {
                response = await CatalogAPI.createCategory(dataToSubmit)
            }

            if (imageFile && response.data.id) {
                await CatalogAPI.uploadCategoryImage(response.data.id, imageFile)
            }

            onSave()
        } catch (err) {
            console.error('Submit error:', err.response?.data || err)

            if (err.response?.data) {
                const errors = err.response.data
                const errorMessages = []

                if (errors.name) {
                    errorMessages.push(`Tên: ${Array.isArray(errors.name) ? errors.name.join(', ') : errors.name}`)
                }

                if (errors.detail) {
                    errorMessages.push(errors.detail)
                }

                setError(errorMessages.length > 0 ? errorMessages.join('. ') : 'Có lỗi xảy ra')
            } else {
                setError(err.message || 'Có lỗi xảy ra')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl transform animate-slideUp">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                    <div className="relative flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-black text-white mb-1">
                                {category ? '✏️ CHỈNH SỬA DANH MỤC' : '➕ THÊM DANH MỤC MỚI'}
                            </h2>
                            <p className="text-indigo-100 text-sm">
                                {category ? 'Cập nhật thông tin danh mục' : 'Tạo danh mục mới'}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-3 transition-all duration-200 transform hover:rotate-90"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="mx-8 mt-6 bg-red-50 border-l-4 border-red-600 px-6 py-4 rounded-xl flex items-start gap-3">
                        <span className="text-2xl">⚠️</span>
                        <div>
                            <p className="font-bold text-red-800 mb-1">Có lỗi xảy ra!</p>
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Image Upload */}
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-5 border-2 border-dashed border-indigo-200">
                        <label className="block text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="text-2xl">📸</span>
                            Hình ảnh danh mục
                        </label>
                        <div className="flex flex-col md:flex-row gap-6 items-center">
                            <div className="flex-shrink-0">
                                {imagePreview ? (
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="w-40 h-40 object-cover rounded-2xl shadow-lg ring-4 ring-white"
                                    />
                                ) : (
                                    <div className="w-40 h-40 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center">
                                        <span className="text-5xl">📂</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                    id="image-upload"
                                />
                                <label
                                    htmlFor="image-upload"
                                    className="cursor-pointer inline-flex items-center gap-2 bg-white border-2 border-indigo-300 text-indigo-600 px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-50 transition-all duration-200 hover:scale-105 transform"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    {imagePreview ? 'Đổi ảnh' : 'Chọn ảnh'}
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Name Field */}
                    <div>
                        <label className="block text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <span className="text-2xl">📂</span>
                            Tên danh mục *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="VD: Burger, Pizza, Combo..."
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all"
                        />
                    </div>



                    {/* Footer Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-100 transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            <span>❌</span>
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-bold hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:scale-105 transform"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Đang lưu...
                                </>
                            ) : (
                                <>
                                    <span>💾</span>
                                    {category ? 'Cập nhật' : 'Thêm mới'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { transform: translateY(50px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
                .animate-slideUp {
                    animation: slideUp 0.4s ease-out;
                }
            `}</style>
        </div>
    )
}
