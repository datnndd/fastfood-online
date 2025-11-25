import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import heroBanner from "../assets/images/herobanner2.jpg";
import heroAbout from "../assets/images/hero-about.png";
import locationImg from "../assets/images/location.jpg";
import onlineImg from "../assets/images/online.jpg";
import hotlineImg from "../assets/images/hotline.png";

const heroMetrics = [
  {
    label: "Banner mới mỗi tuần",
    value: "03 thiết kế",
    detail: "Ra mắt vào sáng thứ Sáu",
  },
  {
    label: "Cửa hàng tham gia",
    value: "7 chi nhánh",
    detail: "Trải khắp nội thành Hà Nội",
  },
  {
    label: "Suất quà mỗi ngày",
    value: "100+ phần",
    detail: "Chia theo từng khung giờ cao điểm",
  },
];

// instoreBillboards will be fetched dynamically from the API

const digitalBanners = [
  {
    id: "delivery-pledge",
    eyebrow: "Banner trực tuyến",
    title: "Đặt trước – giao nhanh 30 phút",
    body: 'Các nút "Đặt Hàng" sẽ đưa bạn tới đầu trang Thực đơn để chọn món trước khi đến quầy thanh toán.',
    accent: "vn-gradient-red-gold",
  },
  {
    id: "member-sync",
    eyebrow: "McDono Rewards",
    title: "Tích điểm online, nhận quà tại quầy",
    body: "Quét mã thành viên ngay quầy thanh toán để nhân đôi điểm và đổi merchandise theo banner từng tuần.",
    accent: "vn-gradient-lotus",
  },
  {
    id: "friday-drop",
    eyebrow: "Lịch phát hành banner",
    title: "Mỗi thứ Sáu lúc 09:00",
    body: "Các banner quảng cáo mới được công bố trên trang này và màn hình LED tại quầy lễ tân.",
    accent: "bg-gradient-to-br from-cyan-500 to-blue-500",
  },
];

const contactNotices = [
  {
    label: "Hotline",
    value: "1900 1234",
    detail: "Miễn phí cước gọi 24/7",
  },
  {
    label: "Email",
    value: "support@mcdono.com",
    detail: "Phản hồi trong 24 giờ",
  },
  {
    label: "Giờ hoạt động",
    value: "07:00 - 23:00",
    detail: "Giao miễn phí nội thành Hà Nội",
  },
];

const bookingSteps = [
  {
    title: "Chọn chi nhánh",
    detail: "Xác định cửa hàng muốn ghé hoặc quét mã trên banner tại khu vực đó.",
  },
  {
    title: "Giữ ưu đãi",
    detail: "Gọi hotline để giữ suất, nhân viên xác nhận banner hiện hành còn hiệu lực.",
  },
  {
    title: "Check-in nhận quà",
    detail: "Đến quầy, quét mã để nhận voucher, tem tích lũy hoặc merchandise giới hạn.",
  },
];

export default function Promotions() {
  const navigate = useNavigate();

  const [instoreBillboards, setInstoreBillboards] = useState([]);

  useEffect(() => {
    // Fetch billboards from API
    const fetchBillboards = async () => {
      try {
        const { ContentAPI } = await import('../lib/api');
        const data = await ContentAPI.getContentItems('promotions');

        // Handle paginated response
        const items = Array.isArray(data) ? data : data.results || [];

        // Filter for slides/banners and sort by created_at (newest first)
        const billboards = items
          .filter(item => (item.type === 'slide' || item.type === 'banner') && item.is_active)
          .sort((a, b) => {
            // Sort by created_at descending (newest first)
            const dateA = new Date(a.created_at);
            const dateB = new Date(b.created_at);
            return dateB - dateA;
          })
          .map((item) => ({
            id: item.id,
            eyebrow: item.eyebrow || '',
            title: item.title,
            description: item.description,
            image: item.image_url || getImageByKey(item.metadata?.imageKey || item.id),
            note: item.metadata?.note || '',
          }));

        if (billboards.length > 0) {
          setInstoreBillboards(billboards);
        }
      } catch (error) {
        console.error("Failed to fetch billboards:", error);
      } finally {
        // loading state removed
      }
    };

    fetchBillboards();
  }, []);

  // Helper function to map image keys to imports
  const getImageByKey = (key) => {
    const imageMap = {
      "grand-counter": heroAbout,
      "photo-booth": locationImg,
      "night-light": onlineImg,
      heroAbout,
      locationImg,
      onlineImg,
    };
    return imageMap[key] || heroAbout;
  };

  const handleOrderNow = () => {
    window.scrollTo({ top: 0, behavior: "auto" });
    navigate("/menu");
  };

  return (
    <div className="vn-bg-rice-paper min-h-screen text-gray-900">
      {/* HERO */}
      <section className="relative overflow-hidden vn-gradient-red-gold vn-lotus-pattern">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25)_0%,_transparent_55%)]" />
        {/* Decorative lanterns */}
        <div className="absolute top-10 left-10 text-6xl vn-animate-lantern-sway">🏮</div>
        <div className="absolute top-10 right-10 text-6xl vn-animate-lantern-sway" style={{ animationDelay: '0.5s' }}>🏮</div>
        <div className="absolute inset-0 vn-bamboo-lines opacity-5" />
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-16 lg:py-20">
          <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] items-center text-white">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold uppercase tracking-[0.2em] border border-white/20 backdrop-blur-sm mb-6">
                <span className="text-lg">🏮</span>
                <span className="vn-text-gold-primary">Banner quảng cáo chính thức</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight drop-shadow-lg vn-heading-display-white">
                Săn ưu đãi McDono mỗi ngày
              </h1>
              <p className="mt-4 text-lg md:text-xl text-white/90 max-w-3xl font-medium">
                Cập nhật banner khuyến mãi mới nhất, đặt lịch ghé quầy và xem thực đơn trực tuyến để
                chuẩn bị trước khi tận hưởng ưu đãi đặc biệt tại cửa hàng.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <button
                  onClick={handleOrderNow}
                  className="vn-btn-gold px-8 py-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all"
                >
                  Đặt hàng
                </button>
                <button
                  onClick={handleOrderNow}
                  className="vn-btn-outline border-white text-white hover:bg-white hover:text-red-700 px-8 py-3"
                >
                  Xem thực đơn
                </button>
              </div>
              <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-5">
                {heroMetrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="backdrop-blur bg-white/10 border border-white/20 rounded-2xl p-4 hover:bg-white/20 transition-colors"
                  >
                    <p className="text-xs uppercase tracking-[0.3em] text-white/70 font-bold">
                      {metric.label}
                    </p>
                    <p className="text-xl font-bold mt-1 vn-text-gold-primary">{metric.value}</p>
                    <p className="text-sm text-white/80 mt-1">{metric.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative w-full h-[320px] sm:h-[380px] lg:h-[420px]">
              <div className="absolute inset-0 blur-3xl opacity-70 bg-gradient-to-tr from-[#ff6b6b] via-[#ffd166] to-[#80ed99]" />
              <div className="relative h-full w-full rounded-[36px] bg-white/5 border border-white/10 p-4 vn-lantern-glow">
                <div className="h-full w-full rounded-[28px] overflow-hidden bg-black/10 flex items-center justify-center relative">
                  <div className="absolute inset-0 vn-lotus-pattern opacity-20"></div>
                  <img
                    src={heroBanner}
                    alt="McDono promotions hero"
                    className="max-h-full w-full object-contain relative z-10"
                    draggable="false"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* IN-STORE BANNERS */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
          <div>
            <p className="vn-text-red-primary font-bold uppercase tracking-[0.3em] text-xs mb-2 flex items-center gap-2">
              <span className="text-lg">🪷</span> Banner tại quầy
            </p>
            <h2 className="text-3xl md:text-4xl font-black vn-heading-display">
              Ưu đãi lớn chỉ kích hoạt khi bạn thanh toán trực tiếp
            </h2>
            <p className="mt-3 text-gray-600 font-medium">
              Xem trước các banner được treo tại cửa hàng để chuẩn bị lịch ghé quầy.
            </p>
          </div>
          <button
            onClick={handleOrderNow}
            className="vn-btn-primary px-6 py-3 shadow-md hover:shadow-lg"
          >
            Đặt hàng
          </button>
        </div>
        {instoreBillboards.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-3xl">
            <p className="text-gray-500 text-lg font-medium">🪷 Chưa có banner nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {instoreBillboards.map((banner) => (
              <div
                key={banner.id}
                className="relative h-[320px] rounded-[34px] overflow-hidden shadow-lg group vn-card border-0"
              >
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                {/* lớp nền tối mạnh hơn */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

                <div className="relative z-10 h-full p-8 flex flex-col justify-end text-white">
                  {/* eyebrow có nền riêng, bo nhẹ */}
                  <span className="self-start bg-red-600/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-[0.25em] text-white shadow-md border border-white/20">
                    {banner.eyebrow}
                  </span>

                  {/* tiêu đề sáng hơn, có viền bóng */}
                  <h3 className="text-2xl font-black mt-3 text-white drop-shadow-lg vn-heading-display-white">
                    {banner.title}
                  </h3>

                  {/* mô tả có nền bán trong suốt */}
                  <div className="mt-3 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                    <p className="text-white/95 text-sm leading-relaxed font-medium">
                      {banner.description}
                    </p>
                    <p className="mt-3 text-[11px] uppercase tracking-[0.35em] vn-text-gold-primary font-bold">
                      {banner.note}
                    </p>
                  </div>

                  <button
                    onClick={handleOrderNow}
                    className="mt-6 self-start vn-btn-gold px-6 py-2 text-sm shadow-lg"
                  >
                    Đặt hàng
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* DIGITAL BANNERS */}
      <section className="vn-bg-rice-paper py-16 relative">
        <div className="absolute inset-0 vn-bamboo-lines opacity-5 pointer-events-none" />
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-gray-500 font-bold">Banner online</p>
              <h3 className="text-3xl font-black mt-2 vn-heading-display vn-text-red-primary">Theo dõi lịch phát hành khuyến mãi</h3>
              <p className="text-gray-600 mt-3 font-medium">
                Các banner này giúp bạn chủ động đặt hàng trước nhưng ưu đãi lớn vẫn nhận tại quầy.
              </p>
            </div>
            <button
              onClick={handleOrderNow}
              className="vn-btn-outline px-6 py-3"
            >
              Đặt hàng
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {digitalBanners.map((banner) => (
              <div
                key={banner.id}
                className={`rounded-3xl p-6 shadow-xl border-0 text-white ${banner.accent.includes('gradient') ? banner.accent : 'bg-gray-800'}`}
              >
                <p className="text-xs uppercase tracking-[0.4em] text-white/80 font-bold">
                  {banner.eyebrow}
                </p>
                <h4 className="text-2xl font-black mt-2 drop-shadow-md vn-heading-display-white">
                  {banner.title}
                </h4>
                <p className="mt-3 text-sm text-white/90 font-medium">{banner.body}</p>
                <button
                  onClick={handleOrderNow}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-bold hover:underline underline-offset-4"
                >
                  Đặt hàng →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT NOTICE */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="rounded-[40px] bg-white shadow-2xl overflow-hidden border-2 vn-border-gold">
          <div className="grid lg:grid-cols-[1.25fr_0.9fr]">
            <div className="p-8 md:p-12 lg:p-16 relative overflow-hidden">
              <div className="absolute top-0 right-0 opacity-5 text-9xl pointer-events-none rotate-12">🪷</div>
              <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-red-600 text-xs font-bold tracking-[0.3em] uppercase border border-red-100 relative z-10">
                Đặt lịch ghé quầy
              </div>
              <h4 className="text-3xl md:text-4xl font-black mt-4 leading-snug vn-heading-display relative z-10">
                Giữ suất ưu đãi trước khi bạn di chuyển tới McDono
              </h4>
              <p className="text-gray-600 mt-3 max-w-3xl font-medium relative z-10">
                Đội ngũ CSKH dùng chung dữ liệu với trang Liên hệ: giao nhanh 30 phút và miễn phí ship toàn Hà Nội.
                Gọi trước giúp kiểm tra banner còn hiệu lực và chuẩn bị quà tặng đúng khung giờ.
              </p>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                {contactNotices.map((notice) => (
                  <div
                    key={notice.label}
                    className="rounded-2xl border border-gray-200 p-5 bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-400 font-bold">
                      {notice.label}
                    </p>
                    <p
                      className={`text-xl font-black mt-1 vn-text-red-primary ${notice.label === "Email" ? "break-all" : ""
                        }`}
                      title={notice.value}
                    >
                      {notice.label === "Email" ? (
                        <a
                          href={`mailto:${notice.value}`}
                          className="hover:underline underline-offset-4"
                        >
                          {notice.value}
                        </a>
                      ) : (
                        notice.value
                      )}
                    </p>
                    <p className="text-sm text-gray-500 font-medium">{notice.detail}</p>
                  </div>
                ))}
              </div>

              <div className="mt-10 space-y-4 relative z-10">
                {bookingSteps.map((step, index) => (
                  <div key={step.title} className="flex gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-red-50 text-red-600 font-black flex items-center justify-center shadow-sm border border-red-100 text-xl">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg">{step.title}</p>
                      <p className="text-sm text-gray-600 font-medium">{step.detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row relative z-10">
                <button
                  onClick={handleOrderNow}
                  className="vn-btn-primary px-8 py-3 shadow-lg hover:shadow-xl"
                >
                  Giữ ưu đãi qua hotline
                </button>
                <button
                  onClick={handleOrderNow}
                  className="vn-btn-outline px-8 py-3"
                >
                  Xem thực đơn ưu đãi
                </button>
              </div>
            </div>

            <div className="relative bg-[#1a0505] text-white p-7 md:p-10 vn-lotus-pattern">
              <div className="relative rounded-[32px] overflow-hidden shadow-xl border border-white/10">
                <img
                  src={hotlineImg}
                  alt="Hotline McDono"
                  className="w-full h-[260px] object-contain bg-white/5 p-4 backdrop-blur-sm"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <p className="text-xs uppercase tracking-[0.4em] vn-text-gold-primary font-bold">Support</p>
                  <p className="text-2xl font-black mt-1 drop-shadow-lg vn-heading-display-white">
                    Luôn sẵn sàng 24/7
                  </p>
                  <p className="text-sm text-white/90 mt-2 font-medium">
                    Gọi hotline để khóa ưu đãi tại quầy trước khi di chuyển.
                  </p>
                </div>
              </div>

              <div className="mt-8 rounded-3xl bg-white/5 border border-white/10 p-6 space-y-4 backdrop-blur-md">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.4em] text-white/70 font-bold">
                  <span>Giờ hoạt động</span>
                  <span>07:00 - 23:00</span>
                </div>
                <div className="h-px bg-white/15" />
                <p className="text-lg font-bold vn-text-gold-primary">
                  Miễn phí giao hàng nội thành Hà Nội cho mọi đơn đặt trước hotline.
                </p>
                <p className="text-sm text-white/70 font-medium">
                  Gợi ý: gọi trước 30 phút để chắc chắn còn suất banner hot trong ngày.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
