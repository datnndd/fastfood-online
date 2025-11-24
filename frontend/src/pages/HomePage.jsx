import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/authContext'
import { ContentAPI } from '../lib/api'
import ContentDetailModal from '../components/ContentDetailModal'

import Banner1 from '../assets/images/home/Banner1.png'
import Banner2 from '../assets/images/home/2.png'
import Banner3 from '../assets/images/home/3.png'

export default function HomePage() {
  const { user } = useAuth()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [selectedContent, setSelectedContent] = useState(null)

  // State for dynamic content
  const [heroBanner, setHeroBanner] = useState(null)
  const [featuredSlides, setFeaturedSlides] = useState([])
  const [featureCards, setFeatureCards] = useState([])
  const [highlightStats, setHighlightStats] = useState([])
  const [workflowSteps, setWorkflowSteps] = useState([])
  const [textBlocks, setTextBlocks] = useState({}) // Map of identifier -> text content
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHomeContent = async () => {
      try {
        const response = await ContentAPI.getContentItems('home')
        // Handle paginated response - extract results array
        const items = Array.isArray(response) ? response : response.results || []

        // Filter content by type
        const slides = items.filter(item => item.type === 'slide')
        const cards = items.filter(item => item.type === 'card')
        const blocks = items.filter(item => item.type === 'text_block')

        // Map text blocks by identifier for easy access
        const blocksMap = {}
        blocks.forEach(block => {
          blocksMap[block.title] = block.metadata?.text || ''
        })
        setTextBlocks(blocksMap)

        // Process Hero Banner
        const heroItem = slides.find(item => item.metadata?.section === 'hero_banner')
        if (heroItem) {
          setHeroBanner({
            title: heroItem.title,
            description: heroItem.description,
            eyebrow: heroItem.eyebrow,
            image_url: heroItem.image_url || Banner1
          })
        }

        // Process Highlight Stats
        const statsItems = cards.filter(item => item.metadata?.section === 'highlight_stats')
        if (statsItems.length > 0) {
          setHighlightStats(statsItems.map(item => ({
            value: item.title,
            label: item.eyebrow,
            description: item.description
          })))
        }

        // Process Featured Slides (Carousel) - Exclude hero banner
        const carouselSlides = slides.filter(item => item.metadata?.section !== 'hero_banner')
        if (carouselSlides.length > 0) {
          setFeaturedSlides(carouselSlides.map(item => ({
            tag: item.eyebrow || item.tag,
            title: item.title,
            description: item.description,
            image_url: item.image_url || Banner1,
            ...item
          })))
        }

        // Process Feature Cards (Grid) - Exclude highlight stats
        const gridCards = cards.filter(item => item.metadata?.section !== 'highlight_stats')
        if (gridCards.length > 0) {
          setFeatureCards(gridCards.map(item => ({
            icon: item.metadata?.icon || '🍔',
            title: item.title,
            description: item.description,
            ...item
          })))
        }

        setLoading(false)
      } catch (error) {
        console.error('Error fetching home content:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchHomeContent()
  }, [])

  useEffect(() => {
    if (featuredSlides.length <= 1) return undefined

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredSlides.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [featuredSlides.length])

  return (
    <div className="min-h-screen vn-bg-rice-paper text-gray-900">
      {selectedContent && (
        <ContentDetailModal
          content={selectedContent}
          onClose={() => setSelectedContent(null)}
        />
      )}

      <section className="relative isolate overflow-hidden vn-gradient-red-gold text-white vn-lotus-pattern">
        {/* Vietnamese Lantern Decorations */}
        <div className="absolute inset-0 opacity-20" aria-hidden>
          <div className="absolute -right-24 top-0 h-80 w-80 rounded-full bg-white/20 blur-3xl vn-animate-lantern-sway" />
          <div className="absolute left-10 bottom-0 h-64 w-64 rounded-full vn-bg-gold-pale blur-3xl" />
          <div className="absolute top-10 left-1/4 text-6xl vn-animate-lantern-sway" style={{ animationDelay: '0.5s' }}>🏮</div>
          <div className="absolute bottom-20 right-1/4 text-5xl vn-animate-lantern-sway" style={{ animationDelay: '1s' }}>🏮</div>
        </div>
        {/* Bamboo texture overlay */}
        <div className="absolute inset-0 vn-bamboo-lines opacity-5" aria-hidden />

        <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-16 px-4 py-24 lg:flex-row">
          <div className="flex-1 space-y-8">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] border border-white/20">
              <span className="text-lg">🪷</span>
              <span className="h-2 w-2 animate-pulse rounded-full vn-bg-gold-pale" />
              Tươi mới mỗi ngày
            </p>

            <div>
              <h1 className="text-4xl font-bold leading-tight text-gray-900 sm:text-5xl md:text-6xl">
                {textBlocks.hero_title || 'McDono • Trải nghiệm fast-food phiên bản hiện đại'}
              </h1>
              <p className="mt-6 text-lg text-gray-600 sm:text-xl">
                {textBlocks.hero_subtitle || 'Menu fusion của McDono lấy cảm hứng từ đường phố châu Á, kết hợp dịch vụ giao siêu tốc và hệ thống phần thưởng realtime.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/menu"
                className="vn-btn-gold inline-block"
              >
                🍜 Khám phá thực đơn
              </Link>
              {!user && (
                <Link
                  to="/register"
                  className="vn-btn-outline inline-block bg-white/5 border-white text-white hover:bg-white hover:text-red-600"
                >
                  Tạo tài khoản
                </Link>
              )}
            </div>

            <div className="flex flex-wrap gap-8 text-white/80">
              {/* Stat 1 */}
              <div>
                {(textBlocks.stat_1 || '120K+\nĐơn hoàn tất').split('\n').map((line, idx) => (
                  <p key={idx} className={idx === 0 ? 'text-3xl font-bold' : 'text-sm uppercase tracking-widest'}>
                    {line}
                  </p>
                ))}
              </div>
              {/* Stat 2 */}
              <div>
                {(textBlocks.stat_2 || '50+\nMón signature\nLuôn sẵn sàng cho mọi khẩu vị').split('\n').map((line, idx) => (
                  <p key={idx} className={
                    idx === 0 ? 'text-3xl font-bold' :
                      idx === 1 ? 'text-sm uppercase tracking-widest' :
                        'text-xs text-white/60'
                  }>
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full max-w-xl flex-1">
            {!heroBanner ? (
              <div className="vn-conical-card border border-white/30 bg-white/10 p-6 backdrop-blur text-center py-16">
                <p className="text-white/70 text-lg">🪷 Chưa có nội dung</p>
              </div>
            ) : (
              <div className="vn-conical-card border-2 border-white/30 bg-white/10 p-6 backdrop-blur vn-lantern-glow">
                <div className="aspect-[4/3] overflow-hidden rounded-3xl border-2 border-white/40 bg-white/5 relative">
                  <img
                    src={heroBanner.image_url}
                    alt={heroBanner.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute top-2 right-2 text-3xl">🪷</div>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="vn-conical-top border border-white/30 bg-white/10 p-4 backdrop-blur">
                    <p className="text-xs text-white/60 uppercase tracking-wider">{heroBanner.eyebrow}</p>
                    <p className="mt-2 text-xl font-bold vn-gold-shimmer">{heroBanner.title}</p>
                  </div>
                  <div className="vn-conical-top border border-white/30 bg-white/10 p-4 backdrop-blur">
                    <p className="text-xs text-white/60 uppercase tracking-wider">Ưu đãi độc quyền</p>
                    <p className="mt-2 text-xl font-bold">{heroBanner.description}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto space-y-16 px-4 py-16 text-gray-900 md:px-6 lg:px-8 lg:py-20 xl:px-0">
        {highlightStats.length === 0 ? (
          <div className="mx-auto max-w-6xl text-center py-16">
            <p className="text-gray-500 text-lg">🪷 Chưa có thống kê</p>
          </div>
        ) : (
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 md:grid-cols-4">
            {highlightStats.map((stat, index) => (
              <div key={index} className="vn-card-lotus vn-animate-lotus-bloom hover:scale-105 transition-transform" style={{ animationDelay: `${index * 0.1}s` }}>
                <p className="text-4xl font-black vn-text-red-primary">{stat.value}</p>
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.3em] vn-text-gold-primary">{stat.label}</p>
                <p className="mt-2 text-sm text-gray-600">{stat.description}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mx-auto max-w-6xl space-y-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.4em] vn-text-red-primary flex items-center gap-2">
                <span>🏮</span> McDono
              </p>
              <h2 className="text-4xl font-black vn-heading-display mt-2">Trải nghiệm fast-food phiên bản hiện đại</h2>
              <p className="mt-3 text-lg text-gray-600">
                Menu fusion lấy cảm hứng từ đường phố châu Á, kết hợp dịch vụ giao siêu tốc và hệ thống phần thưởng realtime.
              </p>
            </div>
            <Link to="/menu" className="vn-btn-outline whitespace-nowrap inline-block">
              Khám phá menu 🍜
            </Link>
          </div>

          {featuredSlides.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">🪷 Chưa có nội dung nổi bật</p>
            </div>
          ) : (
            <div className="overflow-hidden vn-conical-card border-2 vn-border-lotus bg-gradient-to-br from-white to-pink-50 shadow-xl backdrop-blur">
              <div
                className="flex transition-transform duration-[1200ms] ease-in-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {featuredSlides.map((slide, index) => (
                  <div
                    key={index}
                    className="flex min-w-full flex-col gap-6 p-8 md:flex-row md:p-12 cursor-pointer"
                    onClick={() => setSelectedContent(slide)}
                  >
                    <div className="flex flex-1 flex-col gap-4">
                      <span className="inline-flex w-fit items-center rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-500 shadow">
                        {slide.tag}
                      </span>
                      <h3 className="text-3xl font-semibold text-gray-900">{slide.title}</h3>
                      <p className="text-base text-gray-600">{slide.description}</p>
                      <div className="text-sm font-semibold text-rose-600">Khám phá món này →</div>
                    </div>
                    <div className="flex flex-1 items-center justify-center">
                      <div className="relative h-72 w-full overflow-hidden rounded-3xl border border-gray-100 shadow-md">
                        <img src={slide.image_url || slide.image} alt={slide.title} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {featuredSlides.length > 0 && (
            <div className="flex items-center justify-center gap-2">
              {featuredSlides.map((_, index) => (
                <span
                  key={index}
                  className={`h-2 w-10 rounded-full transition-colors duration-500 ${index === currentSlide ? 'bg-rose-600' : 'bg-gray-200'
                    }`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
          <div className="vn-card-bamboo bg-gradient-to-br from-gray-900 to-gray-800 p-8 text-white relative overflow-hidden">
            {/* Lotus decoration */}
            <div className="absolute -right-10 -bottom-10 text-9xl opacity-10">🪷</div>
            <p className="text-xs font-bold uppercase tracking-[0.4em] vn-text-gold-primary">Why choose us</p>
            <h2 className="mt-4 text-3xl font-black text-white">Chất lượng craft, tiện nghi công nghệ</h2>
            <p className="mt-4 text-white/80">
              Chúng tôi kết hợp nguyên liệu địa phương premium với chuỗi cung ứng lạnh. Mọi món ăn được theo dõi bằng QR giúp bạn biết chính xác
              nguồn gốc.
            </p>
            {featureCards.length === 0 ? (
              <div className="mt-8 text-center py-8">
                <p className="text-white/70 text-lg">🪷 Chưa có tính năng</p>
              </div>
            ) : (
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {featureCards.map((feature, index) => (
                  <div
                    key={index}
                    className="vn-conical-top bg-white/10 p-4 cursor-pointer hover:bg-white/20 transition backdrop-blur border border-white/10 vn-animate-lotus-bloom"
                    onClick={() => setSelectedContent(feature)}
                    style={{ animationDelay: `${index * 0.15}s` }}
                  >
                    <div className="text-3xl">{feature.icon}</div>
                    <p className="mt-4 text-lg font-bold vn-text-gold-primary">{feature.title}</p>
                    <p className="mt-2 text-sm text-white/80">{feature.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="vn-card border-2 vn-border-red p-8 bg-gradient-to-br from-white to-red-50">
            <p className="text-xs font-bold uppercase tracking-[0.4em] vn-text-red-primary">3 bước đơn giản</p>
            <h2 className="mt-4 text-3xl font-black vn-heading-display">Đặt món chỉ trong vài giây</h2>
            {workflowSteps.length === 0 ? (
              <div className="mt-8 text-center py-8">
                <p className="text-gray-500 text-lg">🪷 Chưa có hướng dẫn</p>
              </div>
            ) : (
              <div className="mt-8 space-y-6">
                {workflowSteps.map((step, index) => (
                  <div key={index} className="relative pl-12 vn-animate-bamboo-grow" style={{ animationDelay: `${index * 0.2}s` }}>
                    <span className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center vn-conical-top vn-gradient-red-gold text-white text-lg font-black shadow-lg">
                      {index + 1}
                    </span>
                    <p className="text-xl font-bold vn-text-red-primary">{step.title}</p>
                    <p className="mt-2 text-sm text-gray-600">{step.description}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-10 vn-conical-card border-2 vn-border-lotus p-6 text-center bg-gradient-to-br from-pink-50 to-white">
              <div className="aspect-video overflow-hidden rounded-xl border-2 vn-border-gold bg-gray-50 relative">
                <img src={Banner3} alt="Banner3" className="h-full w-full object-cover" />
                <div className="absolute top-2 right-2 text-2xl">🏮</div>
              </div>
              <p className="mt-4 text-sm vn-text-gold-primary font-semibold">🎥 Video/ảnh giới thiệu sẽ được thêm tại đây</p>
            </div>
          </div>
        </div>
      </section>

      <section className="vn-gradient-lotus py-20 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-10 right-10 text-6xl opacity-20 vn-animate-lantern-sway">🏮</div>
        <div className="absolute bottom-10 left-10 text-6xl opacity-20 vn-animate-lantern-sway" style={{ animationDelay: '1s' }}>🪷</div>

        <div className="mx-auto max-w-5xl px-4 text-center relative z-10">
          <p className="text-xs font-bold uppercase tracking-[0.4em] vn-text-red-primary">Ưu đãi ngay hôm nay</p>
          <h2 className="mt-4 text-4xl md:text-5xl font-black vn-heading-display">
            Thành viên mới nhận ưu đãi giao hàng miễn phí 03 đơn đầu tiên
          </h2>
          <p className="mt-4 text-lg text-gray-700 max-w-3xl mx-auto">
            Dù bạn ăn tại chỗ, mang đi hay ship, hệ thống loyalty cộng điểm tự động và đề xuất món theo thời tiết, lịch tập luyện hay lịch làm việc của bạn.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/menu" className="vn-btn-primary inline-block">
              🍜 Bắt đầu đặt món
            </Link>
            {!user && (
              <Link
                to="/register"
                className="vn-btn-gold inline-block"
              >
                Đăng ký miễn phí
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
