import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  ClockIcon,
  EnvelopeIcon,
  MapPinIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline'
import logo from '../assets/images/logo.png'
import { CatalogAPI } from '../lib/api'
import { ContentAPI } from '../lib/contentApi'

const navSections = [
  {
    title: 'Khám phá',
    links: [
      { label: 'Trang chủ', to: '/' },
      { label: 'Thực đơn', to: '/menu' },
      { label: 'Khuyến mãi', to: '/promotions' },
      { label: 'Về McDono', to: '/about' },
      { label: 'Liên hệ', to: '/contact' },
    ],
  },
  {
    title: 'Hỗ trợ',
    links: [
      { label: 'Hotline 1900 1234', href: 'tel:19001234' },
      { label: 'Email support@mcdono.com', href: 'mailto:support@mcdono.com' },
    ],
  },
]

const featuredStores = [
  {
    district: 'Hoàn Kiếm, Hà Nội',
    address: '25 Bà Triệu, P.Hàng Bài',
    hours: '07:00 - 23:00 mỗi ngày',
    hotline: '1900 1234',
  },
  {
    district: 'Ba Đình, Hà Nội',
    address: '210 Kim Mã, P.Kim Mã',
    hours: '07:00 - 22:30 (T2 - CN)',
    hotline: '1900 1234',
  },
  {
    district: 'Cầu Giấy, Hà Nội',
    address: '142 Cầu Giấy, P.Quan Hoa',
    hours: '07:30 - 22:30 mỗi ngày',
    hotline: '1900 1234',
  },
]

const promiseStats = [
  { value: '50+', label: 'Cửa hàng toàn quốc' },
  { value: '30 phút', label: 'Giao nhanh nội thành' },
  { value: '24/7', label: 'Chăm sóc khách hàng' },
]

const contactChannels = [
  {
    icon: PhoneIcon,
    title: 'Hotline 24/7',
    value: '1900 1234',
    description: 'Tư vấn đặt bàn, giao hàng & hỗ trợ sự kiện.',
  },
  {
    icon: EnvelopeIcon,
    title: 'Email hỗ trợ',
    value: 'support@mcdono.com',
    description: 'Phản hồi mọi yêu cầu trong vòng 24 giờ làm việc.',
  },
  {
    icon: ClockIcon,
    title: 'Giờ hoạt động',
    value: '07:00 - 23:00',
    description: 'Giao hàng miễn phí nội thành Hà Nội mỗi ngày.',
  },
]

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const [logoUrl, setLogoUrl] = useState(logo)

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const items = await ContentAPI.getContentItems('global')
        const logoItem = items.find(i => i.type === 'logo')
        if (logoItem && logoItem.image_url) {
          setLogoUrl(logoItem.image_url)
        }
      } catch (error) {
        console.error('Error fetching logo:', error)
      }
    }
    fetchLogo()
  }, [])

  const handleNewsletter = (event) => {
    event.preventDefault()
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="mt-16 bg-[#1a0505] text-white relative overflow-hidden vn-lotus-pattern border-t-4 vn-border-gold">
      {/* Decorative Lanterns */}
      <div className="absolute top-0 left-10 text-6xl opacity-10 vn-animate-lantern-sway pointer-events-none">🏮</div>
      <div className="absolute top-0 right-10 text-6xl opacity-10 vn-animate-lantern-sway pointer-events-none" style={{ animationDelay: '1.5s' }}>🏮</div>

      <div className="mx-auto max-w-7xl space-y-12 px-6 py-14 relative z-10">
        <div className="grid gap-10 lg:grid-cols-[2fr_1fr_1fr]">
          <div>
            <Link to="/" className="flex items-center gap-4 group" onClick={scrollToTop}>
              <div className="bg-white p-1.5 rounded-xl shadow-lg group-hover:scale-105 transition-transform h-14 w-14 flex items-center justify-center">
                <img
                  src={logoUrl}
                  alt="McDono"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div>
                <p className="text-3xl font-black tracking-wide vn-heading-display text-white">McDono</p>
                <p className="text-sm text-white/70 font-medium">
                  Đồ ăn nhanh tươi ngon, giao hàng siêu tốc
                </p>
              </div>
            </Link>
            <p className="mt-6 leading-relaxed text-white/80 max-w-md">
              Từ burger, gà rán đến mì Ý, mọi món ăn đều được McDono chuẩn bị với
              nguyên liệu sạch và quy trình kiểm soát nghiêm ngặt để phục vụ khách hàng
              tại Hà Nội trong vòng 30 phút.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              {promiseStats.map(({ value, label }) => (
                <div
                  key={label}
                  className="min-w-[130px] rounded-2xl border border-white/10 px-4 py-3 backdrop-blur-sm bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <p className="text-2xl font-black vn-text-gold-primary">{value}</p>
                  <p className="text-xs uppercase tracking-[0.1em] text-white/60 font-semibold">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-1">
            {navSections.map((section) => (
              <div key={section.title}>
                <p className="text-xs font-bold uppercase tracking-[0.3em] vn-text-gold-primary mb-6">
                  {section.title}
                </p>
                <ul className="space-y-3 text-sm">
                  {section.links.map((link) => {
                    const key = link.to ?? link.href ?? link.label
                    const sharedClasses =
                      'flex items-center gap-3 text-white/80 transition-all hover:text-white hover:translate-x-1 group'
                    return (
                      <li key={key}>
                        {link.to ? (
                          <Link to={link.to} className={sharedClasses} onClick={scrollToTop}>
                            <span className="h-1.5 w-1.5 rounded-full bg-red-600 group-hover:bg-yellow-400 transition-colors" />
                            {link.label}
                          </Link>
                        ) : (
                          <a href={link.href} className={sharedClasses} onClick={scrollToTop}>
                            <span className="h-1.5 w-1.5 rounded-full bg-red-600 group-hover:bg-yellow-400 transition-colors" />
                            {link.label}
                          </a>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] vn-text-gold-primary mb-6">
              Ghé thăm
            </p>
            <ul className="space-y-4 text-sm text-white/80">
              {featuredStores.map((store) => (
                <li
                  key={store.district}
                  className="rounded-2xl border border-white/10 p-4 backdrop-blur-sm bg-white/5 hover:bg-white/10 transition-colors group"
                >
                  <p className="text-base font-bold text-white group-hover:text-yellow-400 transition-colors">
                    {store.district}
                  </p>
                  <p className="mt-2 flex items-start gap-2 text-sm text-white/70">
                    <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    {store.address}
                  </p>
                  <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap gap-4">
                    <p className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-yellow-500 font-semibold">
                      <ClockIcon className="h-3.5 w-3.5" />
                      {store.hours}
                    </p>
                    <p className="flex items-center gap-1.5 text-xs font-bold text-white">
                      <PhoneIcon className="h-3.5 w-3.5 text-red-500" />
                      {store.hotline}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {contactChannels.map((channel) => {
            const IconComponent = channel.icon
            return (
              <div
                key={channel.title}
                className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg hover:-translate-y-1 transition-transform duration-300"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-red-800 text-white shadow-inner border border-white/10">
                  <IconComponent className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/50 font-bold mb-1">
                    {channel.title}
                  </p>
                  <p className="text-lg font-bold text-white mb-1">{channel.value}</p>
                  <p className="text-xs text-white/60 leading-relaxed">{channel.description}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="rounded-3xl border-2 vn-border-gold bg-gradient-to-r from-[#990a0a] to-[#660000] px-8 py-10 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 vn-lotus-pattern opacity-30"></div>
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="lg:max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-yellow-400 border border-white/10 mb-4">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                Nhận ưu đãi mới
              </div>
              <h3 className="text-3xl font-black text-white vn-heading-display mb-3">
                Đăng ký nhận tin & khuyến mãi
              </h3>
              <p className="text-white/80 text-lg">
                Nhận ngay voucher giảm 20% cho đơn hàng đầu tiên khi đăng ký.
              </p>
            </div>
            <form
              onSubmit={handleNewsletter}
              className="w-full lg:max-w-md"
            >
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Email của bạn..."
                  required
                  className="flex-1 rounded-xl border-2 border-white/20 bg-black/20 px-5 py-3 text-white placeholder:text-white/40 focus:border-yellow-400 focus:bg-black/40 focus:outline-none transition-all"
                />
                <button
                  type="submit"
                  className="rounded-xl vn-btn-gold px-8 py-3 font-bold shadow-lg whitespace-nowrap"
                >
                  Đăng ký ngay
                </button>
              </div>
              <p className="mt-3 text-xs text-white/50 flex items-center gap-1">
                <span className="text-green-400">✓</span> Không spam. Hủy đăng ký bất cứ lúc nào.
              </p>
            </form>
          </div>
        </div>

        <div className="flex flex-col gap-6 border-t border-white/10 pt-8 text-sm text-white/60 md:flex-row md:items-center md:justify-between">
          <p>© {currentYear} McDono Vietnam. All rights reserved.</p>
          <div className="flex flex-wrap gap-6 font-medium">
            <Link to="/contact" className="transition-colors hover:text-white hover:underline" onClick={scrollToTop}>
              Hỗ trợ khách hàng
            </Link>
            <Link to="/about" className="transition-colors hover:text-white hover:underline" onClick={scrollToTop}>
              Về thương hiệu
            </Link>
            <Link to="/privacy" className="transition-colors hover:text-white hover:underline" onClick={scrollToTop}>
              Chính sách bảo mật
            </Link>
            <Link to="/terms" className="transition-colors hover:text-white hover:underline" onClick={scrollToTop}>
              Điều khoản sử dụng
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
