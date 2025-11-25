import React, { useState, useEffect } from "react";
import logo from "../assets/images/logo.png";
import hotline from "../assets/images/hotline.png";
import locationImg from "../assets/images/location.jpg";
import { FeedbackAPI, ContentAPI } from "../lib/api";

export default function ContactPage() {
  const [storeLocations, setStoreLocations] = useState([]);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [formState, setFormState] = useState({
    submitting: false,
    success: "",
    error: "",
  });

  // Fetch stores from API on mount
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await ContentAPI.getStores();
        const stores = Array.isArray(response) ? response : response.results || [];

        if (stores.length > 0) {
          setStoreLocations(stores);
        }
      } catch (error) {
        console.error('Error fetching stores:', error);
      } finally {
        // loading state removed
      }
    };

    fetchStores();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (formState.submitting) return;
    setFormState({ submitting: true, success: "", error: "" });
    try {
      await FeedbackAPI.submit(formData);
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
      setFormState({
        submitting: false,
        success: "Cảm ơn bạn! McDono đã nhận được phản hồi và sẽ liên hệ sớm nhất.",
        error: "",
      });
    } catch (error) {
      console.error("Submit feedback failed", error);
      setFormState({
        submitting: false,
        success: "",
        error: "Không thể gửi phản hồi lúc này. Vui lòng thử lại sau ít phút.",
      });
    }
  };

  return (
    <div className="min-h-screen vn-bg-rice-paper text-gray-900 pb-16">
      {/* Hero */}
      <section className="relative overflow-hidden vn-gradient-red-gold text-white vn-lotus-pattern">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top,_#ffffff_0%,_transparent_55%)]" />
        {/* Decorative lanterns */}
        <div className="absolute top-10 left-10 text-5xl vn-animate-lantern-sway">🏮</div>
        <div className="absolute top-10 right-10 text-5xl vn-animate-lantern-sway" style={{ animationDelay: '0.5s' }}>🏮</div>
        <div className="absolute inset-0 vn-bamboo-lines opacity-5" />

        <div className="max-w-6xl mx-auto px-6 py-16 lg:py-20 relative z-10">
          <div className="grid gap-10 lg:grid-cols-2 items-center">
            <div>
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/15 rounded-full border border-white/30 mb-6 backdrop-blur-sm">
                <img src={logo} alt="McDono" className="w-10 h-10 rounded-full border border-white/40" />
                <span className="uppercase tracking-widest text-xs font-bold text-yellow-200">
                  Kết nối & ghé thăm McDono
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black leading-tight drop-shadow-sm vn-heading-display-white">
                Liên hệ ngay để được giao đơn nóng hổi hoặc đặt bàn tại các chi nhánh Hà Nội.
              </h1>
              <p className="mt-4 text-lg text-white/90 max-w-xl font-medium">
                Đội ngũ McDono luôn trực 24/7 để hỗ trợ mọi thắc mắc từ khách hàng, đối tác sự kiện
                tới cộng đồng tài xế giao hàng.
              </p>
              <p className="mt-3 text-base text-white/80 max-w-xl font-semibold flex items-center gap-2">
                <span className="text-xl">🚚</span> Giao hàng miễn phí toàn bộ nội thành Hà Nội cho mọi đơn hàng online trong giờ hoạt động.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="tel:19001234"
                  className="vn-btn-gold px-6 py-3 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all"
                >
                  📞 Gọi hotline 1900 1234
                </a>
                <a
                  href="mailto:support@mcdono.com"
                  className="vn-btn-outline border-white text-white hover:bg-white hover:text-red-700 px-6 py-3"
                >
                  ✉️ support@mcdono.com
                </a>
              </div>
            </div>

            <div className="relative h-[360px] lg:h-full">
              <div className="absolute inset-0 rounded-[40px] bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl shadow-black/20 overflow-hidden vn-lantern-glow">
                <img
                  src={locationImg}
                  alt="Hệ thống cửa hàng McDono"
                  className="w-full h-full object-cover brightness-[0.85]"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-black/30 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 bg-white/95 rounded-3xl p-5 text-gray-800 shadow-xl border-2 vn-border-gold">
                  <p className="text-xs font-bold uppercase vn-text-red-primary tracking-widest">
                    50+ Cửa hàng toàn quốc
                  </p>
                  <p className="text-lg font-bold mt-1 vn-heading-display">Đến McDono bất cứ khi nào bạn thèm ngon</p>
                  <p className="text-sm text-gray-600 mt-2">
                    Cung cấp dịch vụ giao hàng trong 30 phút khu vực nội thành.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Kênh liên hệ */}
      <section className="max-w-6xl mx-auto px-6 -mt-12 relative z-20">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="vn-card-lotus shadow-2xl vn-animate-lotus-bloom bg-white">
            <p className="text-xs font-bold uppercase vn-text-gold-primary tracking-widest">Hotline</p>
            <div className="flex items-center gap-4 mt-3">
              <img src={hotline} alt="Hotline" className="w-12 h-12 object-contain" />
              <div>
                <p className="text-3xl font-black vn-text-red-primary">1900 1234</p>
                <p className="text-sm text-gray-600 font-medium">Miễn phí cước gọi</p>
              </div>
            </div>
          </div>
          <div className="vn-card-lotus shadow-2xl vn-animate-lotus-bloom bg-white" style={{ animationDelay: '0.1s' }}>
            <p className="text-xs font-bold uppercase vn-text-gold-primary tracking-widest">Email</p>
            <p className="text-2xl font-bold mt-3 break-words vn-text-red-primary">support@mcdono.com</p>
            <p className="text-sm text-gray-600 mt-2 font-medium">Hỗ trợ đối tác & nhượng quyền</p>
          </div>
          <div className="vn-card-lotus shadow-2xl vn-animate-lotus-bloom bg-white" style={{ animationDelay: '0.2s' }}>
            <p className="text-xs font-bold uppercase vn-text-gold-primary tracking-widest">Giao hàng</p>
            <p className="text-2xl font-bold mt-3 vn-text-red-primary">Miễn phí nội thành</p>
            <p className="text-sm text-gray-600 mt-2 font-medium">
              Áp dụng cho Hà Nội, bán kính giao nhanh 7km quanh mỗi chi nhánh.
            </p>
          </div>
        </div>
      </section>

      {/* Cửa hàng quanh Hà Nội */}
      <section className="max-w-6xl mx-auto px-6 mt-20">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-gray-400 font-bold">Store tour</p>
            <h2 className="text-3xl md:text-4xl font-black vn-text-red-primary mt-1 vn-heading-display">
              Các cửa hàng quanh Hà Nội
            </h2>
            <p className="text-gray-500 mt-2 font-medium">
              Chọn vị trí yêu thích để đặt bàn, nhận đồ tại quầy hoặc gọi giao tận nơi với dịch vụ giao hàng miễn phí.
            </p>
          </div>
          <a
            href="https://maps.google.com"
            target="_blank"
            rel="noreferrer"
            className="vn-btn-primary inline-flex items-center gap-2 px-5 py-3 shadow-md hover:shadow-lg"
          >
            Xem bản đồ lớn →
          </a>
        </div>

        {/* Danh sách cửa hàng */}
        {storeLocations.length === 0 ? (
          <div className="mt-12 text-center py-16 border-2 border-dashed border-gray-300 rounded-3xl">
            <p className="text-gray-500 text-lg font-medium">🪷 Chưa có cửa hàng</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {storeLocations.map((store, idx) => (
              <div
                key={store.id || store.name}
                className="vn-card border-2 vn-border-lotus hover:shadow-2xl vn-animate-lotus-bloom group"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <h3 className="text-xl font-black vn-text-red-primary flex items-center gap-2 group-hover:scale-105 transition-transform origin-left">
                  🏮 {store.name}
                </h3>
                <div className="mt-4 space-y-2 text-sm text-gray-600 font-medium">
                  <p className="flex items-start gap-2"><span className="text-red-500">📍</span> {store.address}</p>
                  <p className="flex items-center gap-2"><span className="text-red-500">🕒</span> {store.hours}</p>
                  <p className="font-bold vn-text-gold-primary flex items-center gap-2"><span className="text-red-500">☎</span> {store.hotline}</p>
                </div>
                <div className="mt-4 rounded-xl overflow-hidden border border-gray-200 shadow-inner">
                  <iframe
                    title={`Bản đồ ${store.name}`}
                    className="h-48 w-full"
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(store.map_query || store.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Form phản hồi */}
      <section className="max-w-6xl mx-auto px-6 mt-20">
        <div className="vn-card border-2 vn-border-gold p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-5 text-9xl pointer-events-none">🪷</div>
          <p className="text-xs uppercase tracking-[0.4em] text-gray-400 font-bold relative z-10">Phản hồi</p>
          <h3 className="text-3xl font-black vn-text-red-primary mt-2 vn-heading-display relative z-10">Chia sẻ trải nghiệm</h3>
          <p className="text-gray-600 mt-2 font-medium relative z-10">
            Hãy để lại lời nhắn, chúng tôi sẽ phản hồi trong vòng 24 giờ. Các góp ý về menu mới,
            trải nghiệm giao hàng hoặc hợp tác đều được ghi nhận.
          </p>

          <form className="mt-8 space-y-5 relative z-10" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-bold text-gray-700">Họ và tên</label>
              <input
                type="text"
                placeholder="Nguyễn Văn A"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border-2 border-gray-200 px-4 py-3 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all font-medium"
                required
              />
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="text-sm font-bold text-gray-700">Email</label>
                <input
                  type="email"
                  placeholder="banhmi@mcdono.com"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border-2 border-gray-200 px-4 py-3 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all font-medium"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700">Số điện thoại</label>
                <input
                  type="tel"
                  placeholder="0909 000 000"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border-2 border-gray-200 px-4 py-3 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all font-medium"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700">Chủ đề (tùy chọn)</label>
              <input
                type="text"
                placeholder="Ví dụ: Đặt tiệc sinh nhật"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border-2 border-gray-200 px-4 py-3 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all font-medium"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700">Nội dung</label>
              <textarea
                placeholder="Chia sẻ mong muốn của bạn..."
                name="message"
                value={formData.message}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border-2 border-gray-200 px-4 py-3 h-36 resize-none focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all font-medium"
                required
              />
            </div>
            {formState.success && (
              <div className="rounded-2xl bg-green-50 border border-green-200 px-4 py-3 text-green-700 text-sm font-bold flex items-center gap-2">
                <span>✅</span> {formState.success}
              </div>
            )}
            {formState.error && (
              <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm font-bold flex items-center gap-2">
                <span>⚠️</span> {formState.error}
              </div>
            )}
            <button
              type="submit"
              disabled={formState.submitting}
              className="w-full vn-btn-primary py-4 text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {formState.submitting ? "Đang gửi..." : "Gửi phản hồi cho McDono"}
            </button>
          </form>
        </div>
      </section >
    </div >
  );
}
