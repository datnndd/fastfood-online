import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/authContext'
import { ContentAPI } from '../lib/api'
import ContentDetailModal from '../components/ContentDetailModal'

import Banner1 from '../assets/images/home/Banner1.png'
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

        // Process Workflow Steps (if any, otherwise use default)
        // For now, we'll mock these if not in DB, or you can add them to DB later.
        // Assuming they might come from cards with section 'workflow'
        const workflowItems = cards.filter(item => item.metadata?.section === 'workflow')
        if (workflowItems.length > 0) {
          setWorkflowSteps(workflowItems.map(item => ({
            title: item.title,
            description: item.description
          })))
        } else {
          // Fallback default workflow steps
          setWorkflowSteps([
            { title: 'Chọn món yêu thích', description: 'Khám phá thực đơn đa dạng với hàng trăm món ăn hấp dẫn.' },
            { title: 'Đặt hàng & Thanh toán', description: 'Thao tác đơn giản, thanh toán an toàn qua nhiều hình thức.' },
            { title: 'Giao hàng siêu tốc', description: 'Nhận món nóng hổi chỉ trong 30 phút.' }
          ])
        }

      } catch (error) {
        console.error('Error fetching home content:', error)
      } finally {
        // loading state removed
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
    <div className="min-h-screen vn-bg-rice-paper text-gray-900 font-sans">
      {selectedContent && (
        <ContentDetailModal
          content={selectedContent}
          onClose={() => setSelectedContent(null)}
        />
      )}

      <section className="relative isolate overflow-hidden bg-gradient-to-br from-[#C8102E] to-[#DAA520] vn-gradient-red-gold text-white vn-lotus-pattern">
        {/* Vietnamese Lantern Decorations */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" aria-hidden>
          <div className="absolute -right-24 top-0 h-80 w-80 rounded-full bg-white/20 blur-3xl vn-animate-lantern-sway" />
          <div className="absolute left-10 bottom-0 h-64 w-64 rounded-full vn-bg-gold-pale blur-3xl" />
          <div className="absolute top-10 left-1/4 text-6xl vn-animate-lantern-sway" style={{ animationDelay: '0.5s' }}>🏮</div>
          <div className="absolute bottom-20 right-1/4 text-5xl vn-animate-lantern-sway" style={{ animationDelay: '1s' }}>🏮</div>
        </div>
        {/* Bamboo texture overlay */}
        <div className="absolute inset-0 vn-bamboo-lines opacity-10 pointer-events-none" aria-hidden />

        <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center gap-16 px-6 py-24 lg:flex-row">
          <div className="flex-1 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold uppercase tracking-[0.2em] border border-white/20 backdrop-blur-sm">
              <span className="text-lg">🪷</span>
              <span className="h-2 w-2 animate-pulse rounded-full vn-bg-gold-pale" />
              <span className="vn-text-gold-primary">Tươi mới mỗi ngày</span>
            </div>

            <div>
              <h1 className="text-5xl font-black leading-relaxed text-white sm:text-6xl md:text-7xl py-4 overflow-visible" style={{ fontFamily: 'var(--font-display)', textShadow: '0 4px 8px rgba(0, 0, 0, 0.3)' }}>
                {textBlocks.hero_title}
              </h1>
              <p className="mt-6 text-xl text-white/90 sm:text-2xl font-light leading-relaxed max-w-2xl mx-auto lg:mx-0">
                {textBlocks.hero_subtitle || 'Menu fusion của McDono lấy cảm hứng từ đường phố châu Á, kết hợp dịch vụ giao siêu tốc và hệ thống phần thưởng realtime.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <Link
                to="/menu"
                className="vn-btn-gold inline-flex items-center gap-2 text-lg px-8 py-4 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all"
              >
                <span>🍜</span> Khám phá thực đơn
              </Link>
              {!user && (
                <Link
                  to="/register"
                  className="vn-btn-outline inline-flex items-center gap-2 text-lg px-8 py-4 bg-white/10 border-white text-white hover:bg-white hover:text-red-700 backdrop-blur-sm"
                >
                  Tạo tài khoản
                </Link>
              )}
            </div>

            <div className="flex flex-wrap justify-center lg:justify-start gap-12 text-white/90 pt-8 border-t border-white/10">
              {/* Stat 1 */}
              <div>
                {(textBlocks.stat_1 || '120K+\nĐơn hoàn tất').split('\n').map((line, idx) => (
                  <p key={idx} className={idx === 0 ? 'text-4xl font-black vn-text-gold-primary' : 'text-sm font-bold uppercase tracking-widest opacity-80'}>
                    {line}
                  </p>
                ))}
              </div>
              {/* Stat 2 */}
              <div>
                {(textBlocks.stat_2 || '50+\nMón signature').split('\n').map((line, idx) => (
                  <p key={idx} className={idx === 0 ? 'text-4xl font-black vn-text-gold-primary' : 'text-sm font-bold uppercase tracking-widest opacity-80'}>
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full max-w-xl flex-1 perspective-1000">
            {!heroBanner ? (
              <div className="vn-conical-card border border-white/30 bg-white/10 p-8 backdrop-blur text-center py-24 vn-lantern-glow transform rotate-y-12 transition-transform hover:rotate-0 duration-500">
                <p className="text-white/70 text-lg font-medium">🪷 Đang cập nhật nội dung...</p>
              </div>
            ) : (
              <div className="vn-conical-card border-2 border-white/30 bg-white/10 p-6 backdrop-blur vn-lantern-glow transform transition-transform hover:scale-[1.02] duration-500 shadow-2xl">
                <div className="aspect-[4/3] overflow-hidden rounded-3xl border-2 border-white/40 bg-white/5 relative group">
                  <img
                    src={heroBanner.image_url}
                    alt={heroBanner.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute top-4 right-4 text-4xl drop-shadow-md animate-bounce">🪷</div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-white/30 bg-white/10 p-5 backdrop-blur hover:bg-white/20 transition-colors">
                    <p className="text-xs text-white/80 font-bold uppercase tracking-wider">{heroBanner.eyebrow}</p>
                    <p className="mt-1 text-2xl font-black vn-text-gold-primary">{heroBanner.title}</p>
                  </div>
                  <div className="rounded-2xl border border-white/30 bg-white/10 p-5 backdrop-blur hover:bg-white/20 transition-colors">
                    <p className="text-xs text-white/80 font-bold uppercase tracking-wider">Ưu đãi độc quyền</p>
                    <p className="mt-1 text-lg font-bold text-white leading-tight">{heroBanner.description}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto space-y-20 px-4 py-20 text-gray-900 md:px-6 lg:px-8 xl:px-0 relative">
        {highlightStats.length === 0 ? (
          <div className="mx-auto max-w-6xl text-center py-16">
            <p className="text-gray-500 text-lg italic">🪷 Chưa có thống kê nổi bật</p>
          </div>
        ) : (
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 md:grid-cols-4">
            {highlightStats.map((stat, index) => (
              <div key={index} className="vn-card-lotus vn-animate-lotus-bloom hover:-translate-y-2 transition-transform duration-300 p-8 text-center bg-white shadow-lg border border-red-50" style={{ animationDelay: `${index * 0.1}s` }}>
                <p className="text-5xl font-black vn-text-red-primary mb-3">{stat.value}</p>
                <p className="text-xs font-bold uppercase tracking-[0.2em] vn-text-gold-primary mb-2">{stat.label}</p>
                <p className="text-sm text-gray-600 font-medium">{stat.description}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mx-auto max-w-7xl space-y-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-red-100 pb-6">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.3em] vn-text-red-primary flex items-center gap-2 mb-2">
                <span className="text-xl">🏮</span> McDono Experience
              </p>
              <h2 className="text-4xl md:text-5xl font-black vn-heading-display text-gray-900">Trải nghiệm ẩm thực hiện đại</h2>
              <p className="mt-4 text-xl text-gray-600 max-w-2xl">
                Sự kết hợp hoàn hảo giữa hương vị truyền thống và phong cách phục vụ hiện đại.
              </p>
            </div>
            <Link to="/menu" className="vn-btn-outline whitespace-nowrap inline-flex items-center gap-2 px-6 py-3 text-base font-bold border-2 hover:bg-red-50">
              Khám phá menu 🍜
            </Link>
          </div>

          {featuredSlides.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-3xl border border-dashed border-gray-300">
              <p className="text-gray-500 text-lg">🪷 Chưa có nội dung nổi bật</p>
            </div>
          ) : (
            <div className="overflow-hidden vn-conical-card border-2 vn-border-lotus bg-white shadow-2xl relative group">
              <div
                className="flex transition-transform duration-[1200ms] ease-in-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {featuredSlides.map((slide, index) => (
                  <div
                    key={index}
                    className="flex min-w-full flex-col gap-8 p-8 md:flex-row md:p-16 cursor-pointer"
                    onClick={() => setSelectedContent(slide)}
                  >
                    <div className="flex flex-1 flex-col justify-center gap-6 order-2 md:order-1">
                      <span className="inline-flex w-fit items-center rounded-full bg-red-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-red-600 border border-red-100">
                        {slide.tag}
                      </span>
                      <h3 className="text-4xl md:text-5xl font-black vn-heading-display text-gray-900 leading-tight">{slide.title}</h3>
                      <p className="text-lg text-gray-600 leading-relaxed">{slide.description}</p>
                      <div className="text-base font-bold text-red-600 flex items-center gap-2 group-hover:gap-4 transition-all">
                        Khám phá món này <span className="text-xl">→</span>
                      </div>
                    </div>
                    <div className="flex flex-1 items-center justify-center order-1 md:order-2">
                      <div className="relative h-80 w-full overflow-hidden rounded-[2rem] border-4 border-white shadow-xl rotate-2 group-hover:rotate-0 transition-transform duration-500">
                        <img src={slide.image_url || slide.image} alt={slide.title} className="h-full w-full object-cover transform scale-105 group-hover:scale-100 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Navigation Dots */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-10">
                {featuredSlides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`h-3 rounded-full transition-all duration-300 ${index === currentSlide ? 'w-12 bg-red-600' : 'w-3 bg-gray-300 hover:bg-red-300'}`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2">
          <div className="rounded-2xl border-l-4 border-[#556B2F] bg-[#1a0505] p-10 text-white relative overflow-hidden shadow-2xl">
            {/* Lotus decoration */}
            <div className="absolute -right-16 -bottom-16 text-[12rem] opacity-5 rotate-12 pointer-events-none">🪷</div>
            <div className="relative z-10">
              <p className="text-xs font-bold uppercase tracking-[0.4em] vn-text-gold-primary mb-4">Why choose us</p>
              <h2 className="text-4xl font-black text-white vn-heading-display mb-6">Chất lượng craft,<br />Tiện nghi công nghệ</h2>
              <p className="text-white/80 text-lg leading-relaxed mb-10">
                Chúng tôi kết hợp nguyên liệu địa phương premium với chuỗi cung ứng lạnh. Mọi món ăn được theo dõi bằng QR giúp bạn biết chính xác nguồn gốc.
              </p>

              {featureCards.length === 0 ? (
                <div className="text-center py-8 border border-white/10 rounded-xl bg-white/5">
                  <p className="text-white/60 text-lg">🪷 Đang cập nhật tính năng</p>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2">
                  {featureCards.map((feature, index) => (
                    <div
                      key={index}
                      className="vn-conical-top bg-white/5 p-6 cursor-pointer hover:bg-white/10 transition-all duration-300 backdrop-blur border border-white/10 vn-animate-lotus-bloom group"
                      onClick={() => setSelectedContent(feature)}
                      style={{ animationDelay: `${index * 0.15}s` }}
                    >
                      <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300 inline-block">{feature.icon}</div>
                      <p className="text-xl font-bold vn-text-gold-primary mb-2">{feature.title}</p>
                      <p className="text-sm text-white/70 leading-relaxed">{feature.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="vn-card border-2 vn-border-red p-10 bg-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-bl-full -z-0 opacity-50"></div>
            <div className="relative z-10">
              <p className="text-xs font-bold uppercase tracking-[0.4em] vn-text-red-primary mb-4">3 bước đơn giản</p>
              <h2 className="text-4xl font-black vn-heading-display text-gray-900 mb-8">Đặt món chỉ trong vài giây</h2>

              <div className="space-y-8">
                {workflowSteps.map((step, index) => (
                  <div key={index} className="relative pl-16 vn-animate-bamboo-grow group" style={{ animationDelay: `${index * 0.2}s` }}>
                    <span className="absolute left-0 top-0 flex h-12 w-12 items-center justify-center vn-conical-top vn-gradient-red-gold text-white text-xl font-black shadow-lg group-hover:scale-110 transition-transform duration-300">
                      {index + 1}
                    </span>
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-red-600 transition-colors">{step.title}</h3>
                    <p className="mt-2 text-base text-gray-600">{step.description}</p>
                  </div>
                ))}
              </div>

              <div className="mt-12 vn-conical-card border-2 vn-border-lotus p-6 text-center bg-gradient-to-br from-pink-50 to-white shadow-inner">
                <div className="aspect-video overflow-hidden rounded-2xl border-2 vn-border-gold bg-gray-100 relative group cursor-pointer">
                  <img src={Banner3} alt="Video Thumbnail" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                    <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <span className="text-red-600 text-2xl ml-1">▶</span>
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 text-3xl animate-bounce">🏮</div>
                </div>
                <p className="mt-4 text-sm font-bold vn-text-gold-primary uppercase tracking-wide">Khám phá quy trình chế biến</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="vn-gradient-lotus py-24 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-10 right-10 text-8xl opacity-10 vn-animate-lantern-sway pointer-events-none">🏮</div>
        <div className="absolute bottom-10 left-10 text-8xl opacity-10 vn-animate-lantern-sway pointer-events-none" style={{ animationDelay: '1s' }}>🪷</div>

        <div className="mx-auto max-w-4xl px-6 text-center relative z-10">
          <div className="inline-block mb-6">
            <span className="py-1 px-3 border border-red-200 rounded-full text-xs font-bold uppercase tracking-wider text-red-600 bg-white/50 backdrop-blur-sm">
              Limited Time Offer
            </span>
          </div>
          <h2 className="text-5xl md:text-6xl font-black vn-heading-display text-gray-900 mb-6 leading-tight">
            Thành viên mới nhận ưu đãi <br /> <span className="vn-text-red-primary">Freeship 03 đơn đầu</span>
          </h2>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto mb-10 leading-relaxed">
            Dù bạn ăn tại chỗ, mang đi hay ship, hệ thống loyalty cộng điểm tự động và đề xuất món theo thời tiết, lịch tập luyện hay lịch làm việc của bạn.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/menu" className="vn-btn-primary w-full sm:w-auto px-10 py-4 text-lg shadow-xl hover:shadow-red-200/50">
              🍜 Bắt đầu đặt món
            </Link>
            {!user && (
              <Link
                to="/register"
                className="vn-btn-gold w-full sm:w-auto px-10 py-4 text-lg shadow-xl hover:shadow-yellow-200/50"
              >
                Đăng ký miễn phí
              </Link>
            )}
          </div>
          <p className="mt-6 text-sm text-gray-500 font-medium">
            *Áp dụng cho đơn hàng từ 150k. Điều khoản & điều kiện áp dụng.
          </p>
        </div>
      </section>
    </div>
  )
}
