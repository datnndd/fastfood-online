import { useState, useEffect, useCallback } from 'react'
import { ContentAPI } from '../lib/api'

const PAGE_CHOICES = [
    { value: 'home', label: 'Home Page', supports: 'content' },
    { value: 'about', label: 'About Page', supports: 'content' },
    { value: 'promotions', label: 'Promotions Page', supports: 'content' },
    { value: 'contact', label: 'Contact Page', supports: 'stores' }
]

const CONTENT_TYPE_CHOICES = [
    { value: 'card', label: 'Feature Card' },
    { value: 'slide', label: 'Banner / Slide' },
    { value: 'text_block', label: 'Text Block' },
    { value: 'story', label: 'Story Moment' },
]

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

    useEffect(() => {
        loadData()
    }, [loadData])

    const loadData = useCallback(async () => {
        setLoading(true)
        try {
            if (isStoreMode) {
                const data = await ContentAPI.getStores()
                // Handle paginated response
                setStores(Array.isArray(data) ? data : data.results || [])
            } else {
                const data = await ContentAPI.getContentItems(selectedPage)
                // Handle paginated response
                setContentItems(Array.isArray(data) ? data : data.results || [])
            }
        } catch (error) {
            console.error('Error loading data:', error)
            alert('Failed to load data')
        } finally {
            setLoading(false)
        }
    }, [isStoreMode, selectedPage])

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
            // Find the page ID for the selected page slug
            const pageObj = pages.find(p => p.slug === selectedPage)

            // Set default type based on page
            let defaultType = 'card'; // Default for home page
            if (selectedPage === 'about') {
                defaultType = 'story';
            } else if (selectedPage === 'promotions') {
                defaultType = 'slide';
            }

            setEditingItem({
                page: pageObj?.id || null, // Use page ID, not slug
                type: defaultType,
                title: '',
                description: '',
                eyebrow: '',
                image_url: '',
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
        if (!confirm('Are you sure you want to delete this item?')) return

        try {
            if (isStoreMode) {
                await ContentAPI.deleteStore(id)
            } else {
                await ContentAPI.deleteContentItem(id)
            }
            loadData()
        } catch (error) {
            console.error('Error deleting:', error)
            alert('Failed to delete item')
        }
    }

    const handleSave = async () => {
        try {
            if (isStoreMode) {
                if (editingItem.id) {
                    await ContentAPI.updateStore(editingItem.id, editingItem)
                } else {
                    await ContentAPI.createStore(editingItem)
                }
            } else {
                if (editingItem.id) {
                    await ContentAPI.updateContentItem(editingItem.id, editingItem)
                } else {
                    await ContentAPI.createContentItem(editingItem)
                }
            }
            setShowForm(false)
            setEditingItem(null)
            loadData()
        } catch (error) {
            console.error('Error saving:', error)
            alert('Failed to save item')
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
            alert('Failed to upload image')
        } finally {
            setUploadingImage(false)
        }
    }

    const items = isStoreMode ? stores : contentItems

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Content Management</h1>
                    <p className="mt-2 text-gray-600">Manage dynamic content for your pages</p>
                </div>

                {/* Page Selector */}
                <div className="mb-6 flex gap-2">
                    {PAGE_CHOICES.map((page) => (
                        <button
                            key={page.value}
                            onClick={() => setSelectedPage(page.value)}
                            className={`rounded-lg px-4 py-2 font-semibold transition ${selectedPage === page.value
                                ? 'bg-rose-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            {page.label}
                        </button>
                    ))}
                </div>

                {/* Add Button */}
                <div className="mb-6">
                    <button
                        onClick={handleCreate}
                        className="rounded-lg bg-rose-600 px-6 py-3 font-semibold text-white transition hover:bg-rose-700"
                    >
                        + Add {isStoreMode ? 'Store' : 'Content Item'}
                    </button>
                </div>

                {/* Items List */}
                {loading ? (
                    <div className="text-center text-gray-600">Loading...</div>
                ) : isStoreMode ? (
                    // Store List (No grouping needed)
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {items.map((item) => (
                            <div key={item.id} className="rounded-lg bg-white p-6 shadow">
                                <h3 className="text-lg font-semibold">{item.name}</h3>
                                <p className="mt-2 text-sm text-gray-600 line-clamp-3">{item.address}</p>
                                <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                                    <span>Order: {item.order}</span>
                                    <span className={item.is_active ? 'text-green-600' : 'text-red-600'}>
                                        {item.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <button onClick={() => handleEdit(item)} className="flex-1 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Edit</button>
                                    <button onClick={() => handleDelete(item.id)} className="flex-1 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700">Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    // Content Items Grouped by Type
                    <div className="space-y-12">
                        {selectedPage === 'home' && (
                            <>
                                {/* Text Blocks Section */}
                                <section>
                                    <h2 className="mb-4 text-xl font-bold text-gray-800 border-b pb-2">Text Blocks (Editable Text)</h2>
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {items.filter(i => i.type === 'text_block').map((item) => (
                                            <div key={item.id} className="rounded-lg bg-white p-6 shadow border-l-4 border-gray-500">
                                                <h3 className="text-lg font-semibold font-mono text-gray-700">{item.title}</h3>
                                                <p className="mt-2 text-sm text-gray-600 line-clamp-3 italic">
                                                    {item.metadata?.text || '(No text content)'}
                                                </p>
                                                <div className="mt-4">
                                                    <button onClick={() => handleEdit(item)} className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Edit Text</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* Banners Section */}
                                <section>
                                    <h2 className="mb-4 text-xl font-bold text-gray-800 border-b pb-2">Banners & Slides</h2>
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {items.filter(i => i.type === 'slide' || i.type === 'banner')
                                            .sort((a, b) => {
                                                // Hero banner first
                                                if (a.metadata?.section === 'hero_banner') return -1;
                                                if (b.metadata?.section === 'hero_banner') return 1;
                                                return a.order - b.order;
                                            })
                                            .map((item) => (
                                                <div key={item.id} className="rounded-lg bg-white p-6 shadow border-l-4 border-rose-500">
                                                    {item.image_url && (
                                                        <img src={item.image_url} alt={item.title} className="mb-4 h-32 w-full rounded object-cover bg-gray-100" />
                                                    )}
                                                    <div className="flex items-start justify-between">
                                                        <h3 className="text-lg font-semibold">{item.title}</h3>
                                                        {item.metadata?.section && (
                                                            <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase text-gray-600 border border-gray-200">
                                                                {item.metadata.section.replace('_', ' ')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {item.eyebrow && <span className="mt-1 inline-block rounded bg-rose-100 px-2 py-1 text-xs text-rose-600">{item.eyebrow}</span>}
                                                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">{item.description}</p>
                                                    <div className="mt-4 flex gap-2">
                                                        <button onClick={() => handleEdit(item)} className="flex-1 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Edit</button>
                                                        {item.metadata?.section !== 'hero_banner' && (
                                                            <button onClick={() => handleDelete(item.id)} className="flex-1 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700">Delete</button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </section>

                                {/* Feature Cards Section */}
                                <section>
                                    <h2 className="mb-4 text-xl font-bold text-gray-800 border-b pb-2">Feature Cards</h2>
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                        {items.filter(i => i.type === 'card' || i.type === 'feature')
                                            .sort((a, b) => {
                                                // Highlight stats first
                                                const aIsStat = a.metadata?.section === 'highlight_stats';
                                                const bIsStat = b.metadata?.section === 'highlight_stats';
                                                if (aIsStat && !bIsStat) return -1;
                                                if (!aIsStat && bIsStat) return 1;
                                                return a.order - b.order;
                                            })
                                            .map((item) => (
                                                <div key={item.id} className="rounded-lg bg-white p-6 shadow border-l-4 border-indigo-500">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="text-2xl">{item.metadata?.icon || '📄'}</div>
                                                        {item.metadata?.section && (
                                                            <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase text-gray-600 border border-gray-200">
                                                                {item.metadata.section.replace('_', ' ')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h3 className="text-lg font-bold">{item.title}</h3>
                                                    {item.eyebrow && <p className="text-xs font-bold uppercase text-indigo-600">{item.eyebrow}</p>}
                                                    <p className="mt-2 text-sm text-gray-600">{item.description}</p>
                                                    <div className="mt-4 flex gap-2">
                                                        <button onClick={() => handleEdit(item)} className="flex-1 rounded bg-blue-600 px-2 py-1 text-sm text-white hover:bg-blue-700">Edit</button>
                                                        {item.metadata?.section !== 'highlight_stats' && (
                                                            <button onClick={() => handleDelete(item.id)} className="flex-1 rounded bg-red-600 px-2 py-1 text-sm text-white hover:bg-red-700">Delete</button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </section>
                            </>
                        )}

                        {selectedPage === 'about' && (
                            /* Story Moments Section */
                            <section>
                                <h2 className="mb-4 text-xl font-bold text-gray-800 border-b pb-2">Story Moments (About Page)</h2>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {items.filter(i => i.type === 'story')
                                        .sort((a, b) => a.order - b.order)
                                        .map((item) => (
                                            <div key={item.id} className="rounded-lg bg-white p-6 shadow border-l-4 border-amber-500">
                                                {item.image_url && (
                                                    <img src={item.image_url} alt={item.title} className="mb-4 h-32 w-full rounded object-cover bg-gray-100" />
                                                )}
                                                <h3 className="text-lg font-semibold">{item.title}</h3>
                                                {item.eyebrow && <span className="mt-1 inline-block rounded bg-amber-100 px-2 py-1 text-xs text-amber-800">{item.eyebrow}</span>}
                                                <p className="mt-2 text-sm text-gray-600 line-clamp-2">{item.description}</p>
                                                {item.metadata?.stat && (
                                                    <p className="mt-2 text-xs font-bold text-gray-500">Stat: {item.metadata.stat}</p>
                                                )}
                                                <div className="mt-4 flex gap-2">
                                                    <button onClick={() => handleEdit(item)} className="flex-1 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Edit</button>
                                                    <button onClick={() => handleDelete(item.id)} className="flex-1 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700">Delete</button>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </section>
                        )}

                        {selectedPage === 'promotions' && (
                            /* Promotion Billboards Section */
                            <section>
                                <h2 className="mb-4 text-xl font-bold text-gray-800 border-b pb-2">In-Store Billboards (Promotions Page)</h2>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {items.filter(i => i.type === 'slide' || i.type === 'banner')
                                        .sort((a, b) => a.order - b.order)
                                        .map((item) => (
                                            <div key={item.id} className="rounded-lg bg-white p-6 shadow border-l-4 border-purple-500">
                                                {item.image_url && (
                                                    <img src={item.image_url} alt={item.title} className="mb-4 h-32 w-full rounded object-cover bg-gray-100" />
                                                )}
                                                <h3 className="text-lg font-semibold">{item.title}</h3>
                                                {item.eyebrow && <span className="mt-1 inline-block rounded bg-purple-100 px-2 py-1 text-xs text-purple-800">{item.eyebrow}</span>}
                                                <p className="mt-2 text-sm text-gray-600 line-clamp-2">{item.description}</p>
                                                {item.metadata?.note && (
                                                    <p className="mt-2 text-xs font-bold text-yellow-600">Note: {item.metadata.note}</p>
                                                )}
                                                <div className="mt-4 flex gap-2">
                                                    <button onClick={() => handleEdit(item)} className="flex-1 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Edit</button>
                                                    <button onClick={() => handleDelete(item.id)} className="flex-1 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700">Delete</button>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}

                {/* Edit/Create Form Modal */}
                {showForm && editingItem && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6">
                            <h2 className="text-2xl font-bold">
                                {editingItem.id ? 'Edit' : 'Create'} {isStoreMode ? 'Store' : 'Content Item'}
                            </h2>

                            <div className="mt-6 space-y-4">
                                {isStoreMode ? (
                                    // Store Form
                                    <>
                                        <div>
                                            <label className="block text-sm font-semibold">Name</label>
                                            <input
                                                type="text"
                                                value={editingItem.name}
                                                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                                className="mt-1 w-full rounded border px-4 py-2"
                                                placeholder="e.g., Hoàn Kiếm, Hà Nội"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold">Address</label>
                                            <input
                                                type="text"
                                                value={editingItem.address}
                                                onChange={(e) => setEditingItem({ ...editingItem, address: e.target.value })}
                                                className="mt-1 w-full rounded border px-4 py-2"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold">Hours</label>
                                            <input
                                                type="text"
                                                value={editingItem.hours}
                                                onChange={(e) => setEditingItem({ ...editingItem, hours: e.target.value })}
                                                className="mt-1 w-full rounded border px-4 py-2"
                                                placeholder="e.g., 8:00 - 22:00"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold">Hotline</label>
                                            <input
                                                type="text"
                                                value={editingItem.hotline}
                                                onChange={(e) => setEditingItem({ ...editingItem, hotline: e.target.value })}
                                                className="mt-1 w-full rounded border px-4 py-2"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold">Map Query</label>
                                            <input
                                                type="text"
                                                value={editingItem.map_query}
                                                onChange={(e) => setEditingItem({ ...editingItem, map_query: e.target.value })}
                                                className="mt-1 w-full rounded border px-4 py-2"
                                                placeholder="Address for Google Maps"
                                            />
                                        </div>
                                    </>
                                ) : (
                                    // Content Item Form
                                    <>
                                        <div>
                                            <label className="block text-sm font-semibold">Type</label>
                                            <select
                                                value={editingItem.type}
                                                onChange={(e) => setEditingItem({ ...editingItem, type: e.target.value })}
                                                className="mt-1 w-full rounded border px-4 py-2"
                                                disabled={!editingItem.id || (editingItem.id && editingItem.type === 'text_block')} // Disable if creating new (forced to story) or editing text block
                                            >
                                                {CONTENT_TYPE_CHOICES.filter(t =>
                                                    // Only show text_block if we are editing an existing text_block
                                                    t.value !== 'text_block' || (editingItem.id && editingItem.type === 'text_block')
                                                ).map(type => (
                                                    <option key={type.value} value={type.value}>{type.label}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {editingItem.type === 'text_block' ? (
                                            // Simplified form for text blocks
                                            <>
                                                <div>
                                                    <label className="block text-sm font-semibold">Identifier</label>
                                                    <input
                                                        type="text"
                                                        value={editingItem.title}
                                                        onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                                                        className="mt-1 w-full rounded border px-4 py-2 bg-gray-100"
                                                        placeholder="e.g., hero_title"
                                                        disabled={editingItem.id} // Can't change identifier of existing text blocks
                                                    />
                                                    <p className="mt-1 text-xs text-gray-500">Unique identifier for this text block</p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold">Text Content</label>
                                                    <textarea
                                                        value={editingItem.metadata?.text || ''}
                                                        onChange={(e) => setEditingItem({
                                                            ...editingItem,
                                                            metadata: { ...editingItem.metadata, text: e.target.value }
                                                        })}
                                                        className="mt-1 w-full rounded border px-4 py-2"
                                                        rows={4}
                                                        placeholder="Enter the text content..."
                                                    />
                                                </div>
                                            </>
                                        ) : (
                                            // Full form for cards and slides
                                            <>
                                                <div>
                                                    <label className="block text-sm font-semibold">Title</label>
                                                    <input
                                                        type="text"
                                                        value={editingItem.title}
                                                        onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                                                        className="mt-1 w-full rounded border px-4 py-2"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold">Description</label>
                                                    <textarea
                                                        value={editingItem.description}
                                                        onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                                                        className="mt-1 w-full rounded border px-4 py-2"
                                                        rows={4}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold">Eyebrow/Tag</label>
                                                    <input
                                                        type="text"
                                                        value={editingItem.eyebrow || ''}
                                                        onChange={(e) => setEditingItem({ ...editingItem, eyebrow: e.target.value })}
                                                        className="mt-1 w-full rounded border px-4 py-2"
                                                        placeholder="Small tag above title"
                                                    />
                                                </div>

                                                {editingItem.type === 'story' && (
                                                    <div>
                                                        <label className="block text-sm font-semibold">Stat / Highlight</label>
                                                        <input
                                                            type="text"
                                                            value={editingItem.metadata?.stat || ''}
                                                            onChange={(e) => setEditingItem({
                                                                ...editingItem,
                                                                metadata: { ...editingItem.metadata, stat: e.target.value }
                                                            })}
                                                            className="mt-1 w-full rounded border px-4 py-2"
                                                            placeholder="e.g., 120 phần bán hết sau 02 giờ"
                                                        />
                                                    </div>
                                                )}

                                                {(editingItem.type === 'slide' || editingItem.type === 'banner') && (
                                                    <div>
                                                        <label className="block text-sm font-semibold">Note / Additional Info</label>
                                                        <input
                                                            type="text"
                                                            value={editingItem.metadata?.note || ''}
                                                            onChange={(e) => setEditingItem({
                                                                ...editingItem,
                                                                metadata: { ...editingItem.metadata, note: e.target.value }
                                                            })}
                                                            className="mt-1 w-full rounded border px-4 py-2"
                                                            placeholder="e.g., Chỉ áp dụng khi thanh toán trực tiếp"
                                                        />
                                                    </div>
                                                )}

                                                <div>
                                                    <label className="block text-sm font-semibold">Image</label>
                                                    {editingItem.image_url && (
                                                        <img src={editingItem.image_url} alt="Preview" className="mt-2 h-40 rounded object-cover" />
                                                    )}
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleImageUpload}
                                                        disabled={uploadingImage}
                                                        className="mt-2 w-full"
                                                    />
                                                    {uploadingImage && <p className="text-sm text-gray-600">Uploading...</p>}
                                                </div>
                                            </>
                                        )}
                                    </>
                                )}

                                <div>
                                    <label className="block text-sm font-semibold">Order</label>
                                    <input
                                        type="number"
                                        value={editingItem.order}
                                        onChange={(e) => setEditingItem({ ...editingItem, order: parseInt(e.target.value) })}
                                        className="mt-1 w-full rounded border px-4 py-2"
                                    />
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={editingItem.is_active}
                                        onChange={(e) => setEditingItem({ ...editingItem, is_active: e.target.checked })}
                                        className="mr-2"
                                    />
                                    <label className="text-sm font-semibold">Active</label>
                                </div>
                            </div>

                            <div className="mt-6 flex gap-4">
                                <button
                                    onClick={handleSave}
                                    className="flex-1 rounded bg-rose-600 px-6 py-3 font-semibold text-white transition hover:bg-rose-700"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => {
                                        setShowForm(false)
                                        setEditingItem(null)
                                    }}
                                    className="flex-1 rounded bg-gray-300 px-6 py-3 font-semibold transition hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div >
    )
}
