import { Link } from 'react-router-dom'
import {
  ClockIcon,
  EnvelopeIcon,
  MapPinIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline'
import logo from '../assets/images/logo.png'

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

  const handleNewsletter = (event) => {
    event.preventDefault()
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="mt-16 bg-[#0f172a] text-white">
      <div className="mx-auto max-w-6xl space-y-12 px-6 py-14">
        <div className="grid gap-10 lg:grid-cols-[2fr_1fr_1fr]">
          <div>
            <Link to="/" className="flex items-center gap-3" onClick={scrollToTop}>
              <img
                src={logo}
                alt="McDono"
                className="h-14 w-14 rounded-xl border border-white/20 object-cover"
              />
              <div>
                <p className="text-2xl font-black tracking-wide">McDono</p>
                <p className="text-sm text-white/70">
                  Đồ ăn nhanh tươi ngon, giao hàng siêu tốc
                </p>
              </div>
            </Link>
            <p className="mt-6 leading-relaxed text-white/80">
              Từ burger, gà rán đến mì Ý, mọi món ăn đều được McDono chuẩn bị với
              nguyên liệu sạch và quy trình kiểm soát nghiêm ngặt để phục vụ khách hàng
              tại Hà Nội trong vòng 30 phút.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              {promiseStats.map(({ value, label }) => (
                <div
                  key={label}
                  className="min-w-[130px] rounded-2xl border border-white/10 px-4 py-3 backdrop-blur-sm"
                >
                  <p className="text-2xl font-black text-yellow-300">{value}</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-1">
            {navSections.map((section) => (
              <div key={section.title}>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
                  {section.title}
                </p>
                <ul className="mt-4 space-y-3 text-sm">
                  {section.links.map((link) => {
                    const key = link.to ?? link.href ?? link.label
                    const sharedClasses =
                      'flex items-center gap-2 text-white/80 transition-colors hover:text-yellow-300'
                    return (
                      <li key={key}>
                        {link.to ? (
                          <Link to={link.to} className={sharedClasses} onClick={scrollToTop}>
                            <span className="inline-block h-1 w-1 rounded-full bg-yellow-400" />
                            {link.label}
                          </Link>
                        ) : (
                          <a href={link.href} className={sharedClasses} onClick={scrollToTop}>
                            <span className="inline-block h-1 w-1 rounded-full bg-yellow-400" />
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
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
              Ghé thăm
            </p>
            <ul className="mt-4 space-y-4 text-sm text-white/80">
              {featuredStores.map((store) => (
                <li
                  key={store.district}
                  className="rounded-2xl border border-white/10 p-4 backdrop-blur-sm"
                >
                  <p className="text-base font-semibold text-white">
                    {store.district}
                  </p>
                  <p className="mt-1 flex items-start gap-2 text-sm text-white/70">
                    <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0" />
                    {store.address}
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-yellow-300">
                    <ClockIcon className="h-4 w-4" />
                    {store.hours}
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-white">
                    <PhoneIcon className="h-4 w-4" />
                    {store.hotline}
                  </p>
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
                className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e21b1b]/20 text-[#ffb703]">
                  <IconComponent className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                    {channel.title}
                  </p>
                  <p className="text-lg font-semibold text-white">{channel.value}</p>
                  <p className="text-sm text-white/70">{channel.description}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-[#e21b1b] to-[#b91c1c] px-6 py-8 text-center sm:text-left sm:flex sm:items-center sm:justify-between sm:gap-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/70">
              Nhận ưu đãi mới
            </p>
            <h3 className="text-2xl font-black text-white">
              Gửi email để nhận thực đơn & khuyến mãi hàng tuần
            </h3>
            <p className="mt-2 text-sm text-white/80">
              Chúng tôi chỉ gửi tối đa 2 email/tháng và bạn có thể hủy bất cứ lúc nào.
            </p>
          </div>
          <form
            onSubmit={handleNewsletter}
            className="mt-6 w-full max-w-md space-y-3 sm:mt-0"
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                placeholder="Email của bạn"
                required
                className="flex-1 rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-white placeholder:text-white/60 focus:border-white focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-2xl bg-white px-5 py-3 font-semibold text-[#b91c1c] transition-colors hover:bg-yellow-100"
              >
                Đăng ký
              </button>
            </div>
            <p className="text-xs text-white/70">
              Nhấn nút là bạn đồng ý với chính sách bảo mật của McDono.
            </p>
          </form>
        </div>

        <div className="flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-white/70 md:flex-row md:items-center md:justify-between">
          <p>© {currentYear} McDono. Tự hào phục vụ Hà Nội với 50+ cửa hàng.</p>
          <div className="flex flex-wrap gap-4">
            <Link to="/contact" className="transition-colors hover:text-white" onClick={scrollToTop}>
              Hỗ trợ khách hàng
            </Link>
            <Link to="/about" className="transition-colors hover:text-white" onClick={scrollToTop}>
              Về thương hiệu
            </Link>
            <a href="tel:19001234" className="transition-colors hover:text-white" onClick={scrollToTop}>
              Hotline 1900 1234
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
