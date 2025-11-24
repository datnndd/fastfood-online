import { useEffect } from 'react'
import PropTypes from 'prop-types'

export default function ContentDetailModal({ content, onClose }) {
    // Close modal on Escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose()
            }
        }
        window.addEventListener('keydown', handleEscape)
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden'

        return () => {
            window.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = 'auto'
        }
    }, [onClose])

    if (!content) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            {/* Blurred background overlay */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Modal content */}
            <div
                className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-lg transition hover:bg-white hover:text-gray-900"
                    aria-label="Close"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>

                {/* Image */}
                {content.image_url && (
                    <div className="relative h-64 overflow-hidden rounded-t-3xl">
                        <img
                            src={content.image_url}
                            alt={content.title}
                            className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>
                )}

                {/* Content */}
                <div className="p-8">
                    {/* Eyebrow/Tag */}
                    {(content.eyebrow || content.tag) && (
                        <span className="inline-block rounded-full bg-rose-100 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-rose-600">
                            {content.eyebrow || content.tag}
                        </span>
                    )}

                    {/* Title */}
                    <h2 className="mt-4 text-3xl font-bold text-gray-900">
                        {content.title}
                    </h2>

                    {/* Description */}
                    <div className="mt-6 text-base leading-relaxed text-gray-700 whitespace-pre-line">
                        {content.description}
                    </div>

                    {/* Additional metadata if available */}
                    {content.metadata && Object.keys(content.metadata).length > 0 && (
                        <div className="mt-6 rounded-2xl bg-gray-50 p-4">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                                Additional Information
                            </h3>
                            <div className="mt-2 space-y-1">
                                {Object.entries(content.metadata).map(([key, value]) => (
                                    <div key={key} className="flex gap-2">
                                        <span className="font-semibold text-gray-700">{key}:</span>
                                        <span className="text-gray-600">{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Close button at bottom */}
                    <div className="mt-8 flex justify-end">
                        <button
                            onClick={onClose}
                            className="rounded-full bg-rose-600 px-8 py-3 font-semibold text-white transition hover:bg-rose-700"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

ContentDetailModal.propTypes = {
    content: PropTypes.shape({
        title: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
        image_url: PropTypes.string,
        eyebrow: PropTypes.string,
        tag: PropTypes.string,
        metadata: PropTypes.object
    }),
    onClose: PropTypes.func.isRequired
}
