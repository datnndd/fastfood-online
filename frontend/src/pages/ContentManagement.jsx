
import { useState, useEffect, useCallback } from 'react'
import { ContentAPI } from '../lib/contentApi'

const PAGE_CHOICES = [
    { value: 'home', label: 'Trang Chủ', supports: 'content', icon: '🏠', color: 'text-orange-600', bg: 'bg-orange-50' },
    { value: 'about', label: 'Giới Thiệu', supports: 'content', icon: '📖', color: 'text-amber-600', bg: 'bg-amber-50' },
    { value: 'promotions', label: 'Khuyến Mãi', supports: 'content', icon: '🎉', color: 'text-red-600', bg: 'bg-red-50' },
    { value: 'contact', label: 'Liên Hệ', supports: 'stores', icon: '📍', color: 'text-green-600', bg: 'bg-green-50' },
    { value: 'global', label: 'Cấu Hình Chung', supports: 'content', icon: '⚙️', color: 'text-stone-600', bg: 'bg-stone-100' }
]

const CONTENT_TYPE_CHOICES = [
    { value: 'card', label: 'Thẻ Tính Năng' },
    { value: 'slide', label: 'Banner / Slide' },
    { value: 'text_block', label: 'Đoạn Văn Bản' },
    { value: 'story', label: 'Câu Chuyện' },
]

// Helper function to clean content item payload, removing read-only fields
const cleanContentPayload = (item) => {
    const payload = { ...item }
    // Remove read-only fields that shouldn't be sent to the API
    delete payload.page_name
    delete payload.page_slug
    delete payload.created_at
    delete payload.updated_at
    return payload
}

export default function ContentManagement() {
    const [selectedPage, setSelectedPage] = useState('home')
    const [pages, setPages] = useState([])
    const [contentItems, setContentItems] = useState([])
    const [stores, setStores] = useState([])
    const [loading, setLoading] = useState(false)
    const [editingItem, setEditingItem] = useState(null)
    const [showForm, setShowForm] = useState(false)
    const [uploadingImage, setUploadingImage] = useState(false)

    const currentPageConfig = PAGE_CHOICES.find(p => p.value === selectedPage)
    const isStoreMode = currentPageConfig?.supports === 'stores'

    // Load pages on mount
    useEffect(() => {
        const loadPages = async () => {
            try {
                const response = await ContentAPI.getPages()
                const pagesData = Array.isArray(response) ? response : response.results || []
                setPages(pagesData)
            } catch (error) {
                console.error('Error loading pages:', error)
            }
        }
        loadPages()
    }, [])

    const loadData = useCallback(async () => {
        setLoading(true)
        try {
            if (isStoreMode) {
                const data = await ContentAPI.getStores()
                setStores(Array.isArray(data) ? data : data.results || [])
            } else {
                const data = await ContentAPI.getContentItems(selectedPage)
                setContentItems(Array.isArray(data) ? data : data.results || [])
            }
        } catch (error) {
            console.error('Error loading data:', error)
            alert('Không thể tải dữ liệu')
        } finally {
            setLoading(false)
        }
    }, [isStoreMode, selectedPage])

    useEffect(() => {
        loadData()
    }, [loadData])

    const handleCreate = () => {
        if (isStoreMode) {
            setEditingItem({
                name: '',
                address: '',
                hours: '',
                hotline: '',
                map_query: '',
                order: 0,
                is_active: true
            })
        } else {
            const pageObj = pages.find(p => p.slug === selectedPage)
            let defaultType = 'card';
            if (selectedPage === 'about') defaultType = 'story';
            else if (selectedPage === 'promotions') defaultType = 'slide';
            else if (selectedPage === 'global') defaultType = 'logo';

            setEditingItem({
                page: pageObj?.id || null,
                type: defaultType,
                title: defaultType === 'logo' ? 'Site Logo' : '',
                description: '',
                eyebrow: '',
                tag: '',
                image_url: '',
                order: 0,
                is_active: true,
                metadata: {}
            })
        }
        setShowForm(true)
    }

    const handleEdit = (item) => {
        setEditingItem({ ...item })
        setShowForm(true)
    }

    const handleDelete = async (id) => {
        if (!confirm('Bạn có chắc chắn muốn xóa mục này?')) return

        try {
            if (isStoreMode) {
                await ContentAPI.deleteStore(id)
            } else {
                await ContentAPI.deleteContentItem(id)
            }
            loadData()
        } catch (error) {
            console.error('Error deleting:', error)
            alert('Xóa thất bại')
        }
    }

    const handleSave = async () => {
        const buildContentPayload = () => {
            const payload = { ...editingItem }
            delete payload.page_name
            delete payload.page_slug
            delete payload.created_at
            delete payload.updated_at

            if (!payload.page) {
                const pageObj = pages.find(p => p.slug === selectedPage)
                if (pageObj?.id) payload.page = pageObj.id
            }

            payload.metadata = payload.metadata || {}
            if (payload.order === undefined || payload.order === null || Number.isNaN(payload.order)) {
                payload.order = 0
            }
            if (payload.is_active === undefined || payload.is_active === null) {
                payload.is_active = true
            }

            if (payload.type === 'logo') {
                payload.title = (payload.title || '').trim() || 'Site Logo'
                payload.description = payload.description || ''
                payload.eyebrow = payload.eyebrow || ''
                payload.tag = payload.tag || ''
            }

            return payload
        }

        try {
            if (isStoreMode) {
                if (editingItem.id) {
                    await ContentAPI.updateStore(editingItem.id, editingItem)
                } else {
                    await ContentAPI.createStore(editingItem)
                }
            } else {
                const payload = buildContentPayload()
                if (editingItem.id) {
                    await ContentAPI.updateContentItem(editingItem.id, payload)
                } else {
                    await ContentAPI.createContentItem(payload)
                }
            }
            setShowForm(false)
            setEditingItem(null)
            loadData()
        } catch (error) {
            console.error('Error saving:', error)
            alert('Lưu thất bại')
        }
    }

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploadingImage(true)
        try {
            const result = await ContentAPI.uploadImage(file)
            setEditingItem({ ...editingItem, image_url: result.url })
        } catch (error) {
            console.error('Error uploading image:', error)
            const errorMessage = error.response?.data?.error || error.message || 'Tải ảnh thất bại'
            alert(errorMessage)
        } finally {
            setUploadingImage(false)
        }
    }

    const items = isStoreMode ? stores : contentItems

    return (
        <div className="min-h-screen bg-stone-50 font-sans flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-stone-200 hidden md:flex flex-col fixed h-full z-10">
                <div className="p-6 border-b border-stone-100">
                    <h1 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                        <span className="text-2xl">📝</span> Quản Lý Nội Dung
                    </h1>
                </div>
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {PAGE_CHOICES.map((page) => (
                        <button
                            key={page.value}
                            onClick={() => setSelectedPage(page.value)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-left ${selectedPage === page.value
                                ? `${page.bg} ${page.color} shadow-sm ring-1 ring-inset ring-black/5`
                                : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                                }`}
                        >
                            <span className="text-xl">{page.icon}</span>
                            {page.label}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 min-h-screen">
                <div className="max-w-7xl mx-auto p-6 lg:p-8">
                    {/* Mobile Header */}
                    <div className="md:hidden mb-6">
                        <h1 className="text-2xl font-bold text-stone-800 mb-4">Quản Lý Nội Dung</h1>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {PAGE_CHOICES.map((page) => (
                                <button
                                    key={page.value}
                                    onClick={() => setSelectedPage(page.value)}
                                    className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${selectedPage === page.value
                                        ? 'bg-orange-600 text-white shadow-md'
                                        : 'bg-white text-stone-600 border border-stone-200'
                                        }`}
                                >
                                    {page.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Page Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-stone-800">{currentPageConfig?.label}</h2>
                            <p className="text-stone-500 mt-1">Quản lý nội dung hiển thị cho trang này</p>
                        </div>
                        <button
                            onClick={handleCreate}
                            className="inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all hover:shadow-md active:scale-95"
                        >
                            <span>➕</span> Thêm Mới
                        </button>
                    </div>

                    {/* Content List */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-64 bg-stone-200 rounded-2xl animate-pulse"></div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {isStoreMode ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {items.map((item) => (
                                        <div key={item.id} className="bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all p-5 group">
                                            <div className="flex justify-between items-start mb-3">
                                                <h3 className="font-bold text-lg text-stone-800 group-hover:text-orange-700 transition-colors">{item.name}</h3>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'}`}>
                                                    {item.is_active ? 'Hiện' : 'Ẩn'}
                                                </span>
                                            </div>
                                            <p className="text-stone-600 text-sm mb-2 line-clamp-2">📍 {item.address}</p>
                                            <p className="text-stone-500 text-xs mb-4">📞 {item.hotline}</p>
                                            <div className="flex gap-2 pt-4 border-t border-stone-100">
                                                <button onClick={() => handleEdit(item)} className="flex-1 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-50 rounded-lg transition-colors">Sửa</button>
                                                <button onClick={() => handleDelete(item.id)} className="flex-1 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">Xóa</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <>
                                    {/* Group by Type or Section if needed, for now flat list or simple grouping */}
                                    {items.length === 0 && (
                                        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-stone-300">
                                            <p className="text-stone-500">Chưa có nội dung nào. Hãy thêm mới!</p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {items.map((item) => {
                                            const isLogo = item.type === 'logo'
                                            const isSelected = item.metadata?.selected === true

                                            return (
                                                <div
                                                    key={item.id}
                                                    className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col ${isSelected ? 'border-green-500 ring-1 ring-green-500' : 'border-stone-200'
                                                        }`}
                                                >
                                                    {/* Image Preview */}
                                                    {(item.image_url || isLogo) && (
                                                        <div className="h-48 bg-stone-100 relative group-hover:opacity-95 transition-opacity">
                                                            {item.image_url ? (
                                                                <img
                                                                    src={item.image_url}
                                                                    alt={item.title}
                                                                    className={`w-full h-full ${isLogo ? 'object-contain p-8' : 'object-cover'}`}
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-stone-400 text-sm">Không có ảnh</div>
                                                            )}
                                                            {item.eyebrow && (
                                                                <span className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded-md text-xs font-bold text-stone-700 shadow-sm">
                                                                    {item.eyebrow}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className="p-5 flex-1 flex flex-col">
                                                        <div className="flex justify-between items-start gap-2 mb-2">
                                                            <h3 className="font-bold text-stone-800 line-clamp-1" title={item.title}>
                                                                {item.title || '(Không tiêu đề)'}
                                                            </h3>
                                                            {item.metadata?.section && (
                                                                <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-500 text-[10px] uppercase font-bold tracking-wider whitespace-nowrap">
                                                                    {item.metadata.section.replace('_', ' ')}
                                                                </span>
                                                            )}
                                                        </div>

                                                        <p className="text-stone-600 text-sm line-clamp-3 mb-4 flex-1">
                                                            {item.description || item.metadata?.text || '(Không có mô tả)'}
                                                        </p>

                                                        {isLogo && (
                                                            <div className="mb-4">
                                                                {isSelected ? (
                                                                    <div className="w-full py-2 bg-green-50 text-green-700 text-center text-sm font-medium rounded-lg border border-green-100">
                                                                        ✓ Đang hiển thị
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        onClick={async () => {
                                                                            try {
                                                                                const allLogos = items.filter(i => i.type === 'logo')
                                                                                for (const logo of allLogos) {
                                                                                    if (logo.metadata?.selected) {
                                                                                        const cleanedPayload = cleanContentPayload({ ...logo, metadata: { ...logo.metadata, selected: false } })
                                                                                        await ContentAPI.updateContentItem(logo.id, cleanedPayload)
                                                                                    }
                                                                                }
                                                                                const cleanedPayload = cleanContentPayload({ ...item, metadata: { ...item.metadata, selected: true } })
                                                                                await ContentAPI.updateContentItem(item.id, cleanedPayload)
                                                                                window.dispatchEvent(new Event('logoUpdated'))
                                                                                loadData()
                                                                            } catch (err) {
                                                                                console.error('Error updating logo:', err)
                                                                                alert('Lỗi cập nhật logo')
                                                                            }
                                                                        }}
                                                                        className="w-full py-2 bg-stone-800 text-white text-sm font-medium rounded-lg hover:bg-stone-900 transition-colors"
                                                                    >
                                                                        Chọn làm Logo chính
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}

                                                        <div className="flex gap-2 pt-4 border-t border-stone-100 mt-auto">
                                                            <button onClick={() => handleEdit(item)} className="flex-1 py-2 text-sm font-medium text-stone-600 bg-stone-50 hover:bg-stone-100 rounded-lg transition-colors">Chỉnh sửa</button>
                                                            <button onClick={() => handleDelete(item.id)} className="flex-1 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">Xóa</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Modal Form */}
            {showForm && editingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                            <h2 className="text-xl font-bold text-stone-800">
                                {editingItem.id ? 'Chỉnh Sửa' : 'Thêm Mới'} {isStoreMode ? 'Cửa Hàng' : 'Nội Dung'}
                            </h2>
                            <button onClick={() => setShowForm(false)} className="text-stone-400 hover:text-stone-600 text-2xl leading-none">&times;</button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-5">
                            {isStoreMode ? (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-stone-700 mb-1">Tên Cửa Hàng</label>
                                            <input type="text" value={editingItem.name} onChange={e => setEditingItem({ ...editingItem, name: e.target.value })} className="w-full rounded-xl border-stone-200 focus:border-orange-500 focus:ring-orange-500" placeholder="VD: FastFood Hoàn Kiếm" />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-stone-700 mb-1">Địa Chỉ</label>
                                            <input type="text" value={editingItem.address} onChange={e => setEditingItem({ ...editingItem, address: e.target.value })} className="w-full rounded-xl border-stone-200 focus:border-orange-500 focus:ring-orange-500" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-stone-700 mb-1">Giờ Mở Cửa</label>
                                            <input type="text" value={editingItem.hours} onChange={e => setEditingItem({ ...editingItem, hours: e.target.value })} className="w-full rounded-xl border-stone-200 focus:border-orange-500 focus:ring-orange-500" placeholder="8:00 - 22:00" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-stone-700 mb-1">Hotline</label>
                                            <input type="text" value={editingItem.hotline} onChange={e => setEditingItem({ ...editingItem, hotline: e.target.value })} className="w-full rounded-xl border-stone-200 focus:border-orange-500 focus:ring-orange-500" />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {selectedPage !== 'global' && (
                                        <div>
                                            <label className="block text-sm font-medium text-stone-700 mb-1">Loại Nội Dung</label>
                                            <select
                                                value={editingItem.type}
                                                onChange={e => setEditingItem({ ...editingItem, type: e.target.value })}
                                                disabled={editingItem.id && editingItem.type === 'text_block'}
                                                className="w-full rounded-xl border-stone-200 focus:border-orange-500 focus:ring-orange-500"
                                            >
                                                {CONTENT_TYPE_CHOICES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                            </select>
                                        </div>
                                    )}

                                    {editingItem.type === 'logo' ? (
                                        <div className="text-center p-6 border-2 border-dashed border-stone-200 rounded-xl bg-stone-50">
                                            {editingItem.image_url ? (
                                                <img src={editingItem.image_url} alt="Preview" className="h-32 mx-auto object-contain mb-4" />
                                            ) : (
                                                <div className="h-32 w-32 mx-auto bg-stone-200 rounded-full flex items-center justify-center text-stone-400 mb-4">Logo</div>
                                            )}
                                            <label className="cursor-pointer inline-block bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 font-medium py-2 px-4 rounded-lg transition-colors">
                                                <span>{uploadingImage ? 'Đang tải...' : 'Chọn ảnh logo'}</span>
                                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                                            </label>
                                            <p className="text-xs text-stone-500 mt-2">Ảnh sẽ được tự động cắt tròn</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-stone-700 mb-1">Tiêu Đề / Identifier</label>
                                                <input type="text" value={editingItem.title} onChange={e => setEditingItem({ ...editingItem, title: e.target.value })} className="w-full rounded-xl border-stone-200 focus:border-orange-500 focus:ring-orange-500" />
                                            </div>

                                            {editingItem.type === 'text_block' ? (
                                                <div>
                                                    <label className="block text-sm font-medium text-stone-700 mb-1">Nội Dung Văn Bản</label>
                                                    <textarea
                                                        value={editingItem.metadata?.text || ''}
                                                        onChange={e => setEditingItem({ ...editingItem, metadata: { ...editingItem.metadata, text: e.target.value } })}
                                                        rows={6}
                                                        className="w-full rounded-xl border-stone-200 focus:border-orange-500 focus:ring-orange-500"
                                                    />
                                                </div>
                                            ) : (
                                                <>
                                                    <div>
                                                        <label className="block text-sm font-medium text-stone-700 mb-1">Mô Tả</label>
                                                        <textarea value={editingItem.description} onChange={e => setEditingItem({ ...editingItem, description: e.target.value })} rows={3} className="w-full rounded-xl border-stone-200 focus:border-orange-500 focus:ring-orange-500" />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-stone-700 mb-1">Tag (Eyebrow)</label>
                                                            <input type="text" value={editingItem.eyebrow || ''} onChange={e => setEditingItem({ ...editingItem, eyebrow: e.target.value })} className="w-full rounded-xl border-stone-200 focus:border-orange-500 focus:ring-orange-500" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-stone-700 mb-1">Thứ Tự</label>
                                                            <input type="number" value={editingItem.order} onChange={e => setEditingItem({ ...editingItem, order: parseInt(e.target.value) })} className="w-full rounded-xl border-stone-200 focus:border-orange-500 focus:ring-orange-500" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-stone-700 mb-1">Hình Ảnh</label>
                                                        <div className="flex items-center gap-4">
                                                            {editingItem.image_url && <img src={editingItem.image_url} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-stone-200" />}
                                                            <label className="cursor-pointer bg-stone-100 hover:bg-stone-200 text-stone-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                                                {uploadingImage ? 'Đang tải...' : 'Tải ảnh lên'}
                                                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                                                            </label>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="p-6 border-t border-stone-100 bg-stone-50 flex gap-3">
                            <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 text-stone-600 font-medium hover:bg-stone-200 rounded-xl transition-colors">Hủy Bỏ</button>
                            <button onClick={handleSave} className="flex-1 py-2.5 bg-orange-600 text-white font-bold hover:bg-orange-700 rounded-xl shadow-sm transition-all">Lưu Thay Đổi</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
