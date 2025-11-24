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
    accent: "from-[#f97316] to-[#facc15]",
  },
  {
    id: "member-sync",
    eyebrow: "McDono Rewards",
    title: "Tích điểm online, nhận quà tại quầy",
    body: "Quét mã thành viên ngay quầy thanh toán để nhân đôi điểm và đổi merchandise theo banner từng tuần.",
    accent: "from-[#ec4899] to-[#8b5cf6]",
  },
  {
    id: "friday-drop",
    eyebrow: "Lịch phát hành banner",
    title: "Mỗi thứ Sáu lúc 09:00",
    body: "Các banner quảng cáo mới được công bố trên trang này và màn hình LED tại quầy lễ tân.",
    accent: "from-[#22d3ee] to-[#0ea5e9]",
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
  const [loading, setLoading] = useState(true);

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
        setLoading(false);
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
              <p className="uppercase tracking-[0.4em] text-xs text-white/70 mb-4">
                Banner quảng cáo chính thức
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight drop-shadow-lg">
                Săn ưu đãi McDono mỗi ngày
              </h1>
              <p className="mt-4 text-lg md:text-xl text-white/90 max-w-3xl">
                Cập nhật banner khuyến mãi mới nhất, đặt lịch ghé quầy và xem thực đơn trực tuyến để
                chuẩn bị trước khi tận hưởng ưu đãi đặc biệt tại cửa hàng.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <button
                  onClick={handleOrderNow}
                  className="bg-[#ff3030] hover:bg-[#d91919] text-white font-semibold py-3 px-8 rounded-full shadow-lg shadow-red-500/30 transition-transform hover:-translate-y-0.5"
                >
                  Đặt hàng
                </button>
                <button
                  onClick={handleOrderNow}
                  className="border border-white/70 text-white font-semibold py-3 px-8 rounded-full hover:bg-white/15 transition-colors"
                >
                  Xem thực đơn
                </button>
              </div>
              <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-5">
                {heroMetrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="backdrop-blur bg-white/10 border border-white/20 rounded-2xl p-4"
                  >
                    <p className="text-xs uppercase tracking-[0.3em] text-white/70">
                      {metric.label}
                    </p>
                    <p className="text-xl font-bold">{metric.value}</p>
                    <p className="text-sm text-white/80">{metric.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative w-full h-[320px] sm:h-[380px] lg:h-[420px]">
              <div className="absolute inset-0 blur-3xl opacity-70 bg-gradient-to-tr from-[#ff6b6b] via-[#ffd166] to-[#80ed99]" />
              <div className="relative h-full w-full rounded-[36px] bg-white/5 border border-white/10 p-4">
                <div className="h-full w-full rounded-[28px] overflow-hidden bg-black/10 flex items-center justify-center">
                  <img
                    src={heroBanner}
                    alt="McDono promotions hero"
                    className="max-h-full w-full object-contain"
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
            <p className="text-[#ff3030] font-semibold uppercase tracking-[0.3em] text-xs mb-2">
              Banner tại quầy
            </p>
            <h2 className="text-3xl md:text-4xl font-black">
              Ưu đãi lớn chỉ kích hoạt khi bạn thanh toán trực tiếp
            </h2>
            <p className="mt-3 text-gray-600">
              Xem trước các banner được treo tại cửa hàng để chuẩn bị lịch ghé quầy.
            </p>
          </div>
          <button
            onClick={handleOrderNow}
            className="px-6 py-3 rounded-full border border-[#ff3030] text-[#ff3030] font-semibold hover:bg-[#ff3030] hover:text-white transition-colors"
          >
            Đặt hàng
          </button>
        </div>
        {instoreBillboards.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">Nothing to show</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {instoreBillboards.map((banner) => (
              <div
                key={banner.id}
                className="relative h-[320px] rounded-[34px] overflow-hidden shadow-lg"
              >
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                {/* lớp nền tối mạnh hơn */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent" />

                <div className="relative z-10 h-full p-8 flex flex-col justify-end text-white">
                  {/* eyebrow có nền riêng, bo nhẹ */}
                  <span className="self-start bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-[0.25em] text-white/90 shadow-md">
                    {banner.eyebrow}
                  </span>

                  {/* tiêu đề sáng hơn, có viền bóng */}
                  <h3 className="text-2xl font-black mt-3 text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)]">
                    {banner.title}
                  </h3>

                  {/* mô tả có nền bán trong suốt */}
                  <div className="mt-3 bg-black/60 backdrop-blur-[2px] rounded-2xl p-4 ring-1 ring-white/10">
                    <p className="text-white/95 text-sm leading-relaxed">
                      {banner.description}
                    </p>
                    <p className="mt-3 text-[11px] uppercase tracking-[0.35em] text-yellow-300/95">
                      {banner.note}
                    </p>
                  </div>

                  <button
                    onClick={handleOrderNow}
                    className="mt-6 self-start bg-white/20 hover:bg-white/30 border border-white/40 px-6 py-2 rounded-full text-sm font-semibold transition-colors"
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
      <section className="bg-gradient-to-r from-[#0f172a] to-[#1f2937] text-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/60">Banner online</p>
              <h3 className="text-3xl font-black mt-2">Theo dõi lịch phát hành khuyến mãi</h3>
              <p className="text-white/80 mt-3">
                Các banner này giúp bạn chủ động đặt hàng trước nhưng ưu đãi lớn vẫn nhận tại quầy.
              </p>
            </div>
            <button
              onClick={handleOrderNow}
              className="px-6 py-3 rounded-full border border-white/50 font-semibold hover:bg-white/10 transition-colors"
            >
              Đặt hàng
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {digitalBanners.map((banner) => (
              <div
                key={banner.id}
                className={`rounded-3xl p-6 shadow-xl shadow-black/30 bg-gradient-to-br ${banner.accent}`}
              >
                <p className="text-xs uppercase tracking-[0.4em] text-white/70">
                  {banner.eyebrow}
                </p>
                <h4 className="text-2xl font-black mt-2 drop-shadow-[0_3px_8px_rgba(0,0,0,0.6)]">
                  {banner.title}
                </h4>
                <p className="mt-3 text-sm text-white/90">{banner.body}</p>
                <button
                  onClick={handleOrderNow}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold"
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
        <div className="rounded-[40px] bg-white shadow-2xl overflow-hidden">
          <div className="grid lg:grid-cols-[1.25fr_0.9fr]">
            <div className="p-8 md:p-12 lg:p-16">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#ffe0de] px-4 py-2 text-[#c31625] text-xs font-semibold tracking-[0.3em] uppercase">
                Đặt lịch ghé quầy
              </div>
              <h4 className="text-3xl md:text-4xl font-black mt-4 leading-snug">
                Giữ suất ưu đãi trước khi bạn di chuyển tới McDono
              </h4>
              <p className="text-gray-600 mt-3 max-w-3xl">
                Đội ngũ CSKH dùng chung dữ liệu với trang Liên hệ: giao nhanh 30 phút và miễn phí ship toàn Hà Nội.
                Gọi trước giúp kiểm tra banner còn hiệu lực và chuẩn bị quà tặng đúng khung giờ.
              </p>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {contactNotices.map((notice) => (
                  <div
                    key={notice.label}
                    className="rounded-2xl border border-gray-100 p-5 bg-gray-50/80"
                  >
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
                      {notice.label}
                    </p>
                    <p
                      className={`text-xl font-bold mt-1 ${notice.label === "Email" ? "break-all" : ""
                        }`}
                      title={notice.value}
                    >
                      {notice.label === "Email" ? (
                        <a
                          href={`mailto:${notice.value}`}
                          className="text-[#c31625] underline-offset-4 hover:underline"
                        >
                          {notice.value}
                        </a>
                      ) : (
                        notice.value
                      )}
                    </p>
                    <p className="text-sm text-gray-500">{notice.detail}</p>
                  </div>
                ))}
              </div>

              <div className="mt-10 space-y-4">
                {bookingSteps.map((step, index) => (
                  <div key={step.title} className="flex gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-[#ffefec] text-[#c31625] font-bold flex items-center justify-center shadow-inner">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{step.title}</p>
                      <p className="text-sm text-gray-600">{step.detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <button
                  onClick={handleOrderNow}
                  className="bg-[#ff3030] hover:bg-[#d91919] text-white font-semibold py-3 px-8 rounded-full shadow-lg shadow-red-200"
                >
                  Giữ ưu đãi qua hotline
                </button>
                <button
                  onClick={handleOrderNow}
                  className="border border-gray-900 text-gray-900 font-semibold py-3 px-8 rounded-full hover:bg-gray-900 hover:text-white transition-colors"
                >
                  Xem thực đơn ưu đãi
                </button>
              </div>
            </div>

            <div className="relative bg-[#0f172a] text-white p-7 md:p-10">
              <div className="relative rounded-[32px] overflow-hidden shadow-xl">
                <img
                  src={hotlineImg}
                  alt="Hotline McDono"
                  className="w-full h-[260px] object-contain bg-black/40 p-4"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <p className="text-xs uppercase tracking-[0.4em] text-white/70">Support</p>
                  <p className="text-2xl font-black mt-1 drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
                    Luôn sẵn sàng 24/7
                  </p>
                  <p className="text-sm text-white/90 mt-2 drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">
                    Gọi hotline để khóa ưu đãi tại quầy trước khi di chuyển.
                  </p>
                </div>
              </div>

              <div className="mt-8 rounded-3xl bg-white/5 border border-white/10 p-6 space-y-4">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.4em] text-white/70">
                  <span>Giờ hoạt động</span>
                  <span>07:00 - 23:00</span>
                </div>
                <div className="h-px bg-white/15" />
                <p className="text-lg font-semibold">
                  Miễn phí giao hàng nội thành Hà Nội cho mọi đơn đặt trước hotline.
                </p>
                <p className="text-sm text-white/70">
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
