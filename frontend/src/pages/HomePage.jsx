import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/authContext'

import Banner1 from '../assets/images/home/Banner1.png'
import Banner2 from '../assets/images/home/2.png'
import Banner3 from '../assets/images/home/3.png'

const highlightStats = [
  { value: '50+', label: 'Món signature', description: 'Luôn sẵn sàng cho mọi khẩu vị' },
  { value: '4.9/5', label: 'Đánh giá trung bình', description: 'Hơn 12K lượt khen ngợi' },
  { value: '15 phút', label: 'Tốc độ giao', description: 'Trung bình tại nội thành' },
  { value: '24/7', label: 'Hỗ trợ tận tâm', description: 'Chat trực tuyến mọi lúc' }
]

const featureCards = [
  {
    icon: '🍔',
    title: 'Burger chuẩn vị',
    description: 'Thịt nướng lửa lớn, sốt signature và rau củ được đặt trong bánh brioche mềm thơm.'
  },
  {
    icon: '🥤',
    title: 'Đồ uống mixology',
    description: 'Thức uống pha lạnh với trà trái cây, cold brew và topping thủ công.'
  },
  {
    icon: '🥗',
    title: 'Healthy corner',
    description: 'Salad ấm, bowl ngũ cốc, protein chuẩn macros giúp bạn giữ phong độ.'
  }
]

const featuredSlides = [
  {
    tag: 'Chef’s pick',
    title: 'McDono Midnight Burger',
    description: 'Wagyu sear, phô mai raclette và sốt muối biển hun khói tạo nên combo đêm huyền ảo.',
    image: Banner1
  },
  {
    tag: 'Vegan glow',
    title: 'Green Crunch Bowl',
    description: 'Kale giòn, hạt quinoa rang và sốt miso gừng cân bằng vị béo bùi.',
    image: Banner2
  },
  {
    tag: 'Collab limited',
    title: 'Saigon Heat Fries',
    description: 'Khoai tây hai textures cùng sốt sả ớt caramel hoá với hành tím ngâm.',
    image: Banner3
  }
]

const workflowSteps = [
  {
    title: 'Chọn món',
    description: 'Khám phá thực đơn được cá nhân hoá với các góc món hot và ưu đãi realtime.'
  },
  {
    title: 'Tuỳ chỉnh hương vị',
    description: 'Thêm topping, giảm đường hoặc đổi loại bánh chỉ với một chạm.'
  },
  {
    title: 'Theo dõi hành trình',
    description: 'Nhận thông báo khi bếp bắt đầu chế biến cho tới lúc shipper bấm chuông.'
  }
]

export default function HomePage() {
  const { user } = useAuth()
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    if (featuredSlides.length <= 1) return undefined

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredSlides.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900">
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-red-700 via-rose-500 to-pink-300 text-white">
        <div className="absolute inset-0 opacity-30" aria-hidden>
          <div className="absolute -right-24 top-0 h-80 w-80 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute left-10 bottom-0 h-64 w-64 rounded-full bg-amber-300/30 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-16 px-4 py-24 lg:flex-row">
          <div className="flex-1 space-y-8">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
              Fresh drop everyday
            </p>

            <div>
              <h1 className="text-4xl font-black leading-tight md:text-6xl">
                McDono • Trải nghiệm fast-food phiên bản hiện đại
              </h1>
              <p className="mt-4 text-lg text-white/90 md:text-xl">
                Menu fusion của McDono lấy cảm hứng từ đường phố châu Á, kết hợp dịch vụ giao siêu tốc và hệ thống phần thưởng realtime.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/menu"
                className="rounded-full bg-white px-8 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Khám phá thực đơn
              </Link>
              {!user && (
                <Link
                  to="/register"
                  className="rounded-full border border-white/60 px-8 py-3 font-semibold text-white transition hover:bg-white/10"
                >
                  Tạo tài khoản
                </Link>
              )}
            </div>

            <div className="flex flex-wrap gap-8 text-white/80">
              <div>
                <p className="text-3xl font-bold">120K+</p>
                <p className="text-sm uppercase tracking-widest">Đơn hoàn tất</p>
              </div>
              <div>
                <p className="text-3xl font-bold">12 thành phố</p>
                <p className="text-sm uppercase tracking-widest">Đang phục vụ</p>
              </div>
            </div>
          </div>

          <div className="w-full max-w-xl flex-1">
            <div className="rounded-[32px] border border-white/30 bg-white/10 p-6 backdrop-blur">
              <div className="aspect-[4/3] overflow-hidden rounded-3xl border border-white/40 bg-white/5">
                <img
                  src={Banner1}
                  alt="Combo Urban Bánh Mì"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/30 bg-white/10 p-4">
                  <p className="text-sm text-white/60">Đơn hàng gần nhất</p>
                  <p className="mt-2 text-2xl font-semibold">Combo Urban Bánh Mì</p>
                </div>
                <div className="rounded-2xl border border-white/30 bg-white/10 p-4">
                  <p className="text-sm text-white/60">Ưu đãi độc quyền</p>
                  <p className="mt-2 text-2xl font-semibold">-30% thành viên</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto space-y-16 px-4 py-16 text-gray-900 md:px-6 lg:px-8 lg:py-20 xl:px-0">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 md:grid-cols-4">
          {highlightStats.map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <p className="text-3xl font-black text-rose-600">{stat.value}</p>
              <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-gray-500">{stat.label}</p>
              <p className="mt-2 text-sm text-gray-600">{stat.description}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto max-w-6xl space-y-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">McDono</p>
              <h2 className="text-3xl font-bold">Trải nghiệm fast-food phiên bản hiện đại</h2>
              <p className="mt-3 text-lg text-gray-600">
                Menu fusion lấy cảm hứng từ đường phố châu Á, kết hợp dịch vụ giao siêu tốc và hệ thống phần thưởng realtime.
              </p>
            </div>
            <Link to="/menu" className="text-sm font-semibold text-rose-600 hover:text-rose-700">
              Khám phá menu signature →
            </Link>
          </div>

          <div className="overflow-hidden rounded-[40px] border border-gray-200 bg-white/60 shadow-xl backdrop-blur">
            <div
              className="flex transition-transform duration-[1200ms] ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {featuredSlides.map((slide) => (
                <div key={slide.title} className="flex min-w-full flex-col gap-6 p-8 md:flex-row md:p-12">
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
                      <img src={slide.image} alt={slide.title} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center gap-2">
            {featuredSlides.map((_, index) => (
              <span
                key={index}
                className={`h-2 w-10 rounded-full transition-colors duration-500 ${
                  index === currentSlide ? 'bg-rose-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
          <div className="rounded-3xl bg-gray-900 p-8 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">Why choose us</p>
            <h2 className="mt-4 text-3xl font-bold">Chất lượng craft, tiện nghi công nghệ</h2>
            <p className="mt-4 text-white/70">
              Chúng tôi kết hợp nguyên liệu địa phương premium với chuỗi cung ứng lạnh. Mọi món ăn được theo dõi bằng QR giúp bạn biết chính xác
              nguồn gốc.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {featureCards.map((feature) => (
                <div key={feature.title} className="rounded-2xl bg-white/10 p-4">
                  <div className="text-3xl">{feature.icon}</div>
                  <p className="mt-4 text-lg font-semibold">{feature.title}</p>
                  <p className="mt-2 text-sm text-white/70">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">3 bước đơn giản</p>
            <h2 className="mt-4 text-3xl font-bold">Đặt món chỉ trong vài giây</h2>
            <div className="mt-8 space-y-8">
              {workflowSteps.map((step, index) => (
                <div key={step.title} className="relative pl-10">
                  <span className="absolute left-0 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-sm font-semibold text-rose-600">
                    {index + 1}
                  </span>
                  <p className="text-xl font-semibold">{step.title}</p>
                  <p className="mt-2 text-sm text-gray-600">{step.description}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 rounded-2xl border border-dashed border-gray-300 p-6 text-center">
              <div className="aspect-video overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                <img src={Banner3} alt="Banner3" className="h-full w-full object-cover" />
              </div>
              <p className="mt-4 text-sm text-gray-500">Video/ảnh giới thiệu sẽ được thêm tại đây</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">Ưu đãi ngay hôm nay</p>
          <h2 className="mt-4 text-4xl font-bold">
            Thành viên mới nhận ưu đãi giao hàng miễn phí 03 đơn đầu tiên
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Dù bạn ăn tại chỗ, mang đi hay ship, hệ thống loyalty cộng điểm tự động và đề xuất món theo thời tiết, lịch tập luyện hay lịch làm việc của bạn.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/menu" className="rounded-full bg-rose-600 px-8 py-3 font-semibold text-white transition hover:bg-rose-700">
              Bắt đầu đặt món
            </Link>
            {!user && (
              <Link
                to="/register"
                className="rounded-full border border-gray-200 px-8 py-3 font-semibold text-gray-900 transition hover:bg-gray-50"
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
