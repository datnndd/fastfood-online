import React, { useState } from "react";
import logo from "../assets/images/logo.jpg";
import hotline from "../assets/images/hotline.png";
import locationImg from "../assets/images/location.jpg";
import { FeedbackAPI } from "../lib/api";

const storeLocations = [
  {
    city: "Hoàn Kiếm, Hà Nội",
    address: "25 Bà Triệu, P.Hàng Bài",
    hours: "07:00 - 23:00 mỗi ngày",
    hotline: "1900 1234",
    mapQuery: "25 Bà Triệu, Hàng Bài, Hoàn Kiếm, Hà Nội",
  },
  {
    city: "Ba Đình, Hà Nội",
    address: "210 Kim Mã, P.Kim Mã",
    hours: "07:00 - 22:30 (T2 - CN)",
    hotline: "1900 1234",
    mapQuery: "210 Kim Mã, Ba Đình, Hà Nội",
  },
  {
    city: "Hai Bà Trưng, Hà Nội",
    address: "68 Trần Khát Chân, P.Thanh Nhàn",
    hours: "08:00 - 22:00 (T2 - CN)",
    hotline: "1900 1234",
    mapQuery: "68 Trần Khát Chân, Hai Bà Trưng, Hà Nội",
  },
  {
    city: "Cầu Giấy, Hà Nội",
    address: "142 Cầu Giấy, P.Quan Hoa",
    hours: "07:30 - 22:30 mỗi ngày",
    hotline: "1900 1234",
    mapQuery: "142 Cầu Giấy, Cầu Giấy, Hà Nội",
  },
  {
    city: "Tây Hồ, Hà Nội",
    address: "35 Xuân Diệu, P.Quảng An",
    hours: "08:00 - 22:00 (T2 - CN)",
    hotline: "1900 1234",
    mapQuery: "35 Xuân Diệu, Tây Hồ, Hà Nội",
  },
  {
    city: "Thanh Xuân, Hà Nội",
    address: "19 Nguyễn Trãi, P.Thanh Xuân Trung",
    hours: "07:30 - 22:00 mỗi ngày",
    hotline: "1900 1234",
    mapQuery: "19 Nguyễn Trãi, Thanh Xuân, Hà Nội",
  },
  {
    city: "Long Biên, Hà Nội",
    address: "12 Nguyễn Văn Cừ, P.Bồ Đề",
    hours: "08:00 - 21:30 (T2 - CN)",
    hotline: "1900 1234",
    mapQuery: "12 Nguyễn Văn Cừ, Long Biên, Hà Nội",
  },
];

export default function ContactPage() {
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
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 via-white to-white text-gray-900 pb-16">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#e21b1b] text-white">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top,_#ffffff_0%,_transparent_55%)]" />
        <div className="max-w-6xl mx-auto px-6 py-16 lg:py-20 relative z-10">
          <div className="grid gap-10 lg:grid-cols-2 items-center">
            <div>
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/15 rounded-full border border-white/30 mb-6">
                <img src={logo} alt="McDono" className="w-10 h-10 rounded-full border border-white/40" />
                <span className="uppercase tracking-widest text-xs font-semibold text-yellow-200">
                  Kết nối & ghé thăm McDono
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black leading-tight drop-shadow-sm">
                Liên hệ ngay để được giao đơn nóng hổi hoặc đặt bàn tại các chi nhánh Hà Nội.
              </h1>
              <p className="mt-4 text-lg text-yellow-50/90 max-w-xl">
                Đội ngũ McDono luôn trực 24/7 để hỗ trợ mọi thắc mắc từ khách hàng, đối tác sự kiện
                tới cộng đồng tài xế giao hàng.
              </p>
              <p className="mt-3 text-base text-yellow-100 max-w-xl font-semibold">
                🚚 Giao hàng miễn phí toàn bộ nội thành Hà Nội cho mọi đơn hàng online trong giờ hoạt động.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="tel:19001234"
                  className="bg-white text-[#e21b1b] px-6 py-3 rounded-full font-semibold shadow-lg shadow-black/20 hover:scale-105 transition-transform"
                >
                  📞 Gọi hotline 1900 1234
                </a>
                <a
                  href="mailto:support@mcdono.com"
                  className="border border-white px-6 py-3 rounded-full font-semibold hover:bg-white/15 transition-colors"
                >
                  ✉️ support@mcdono.com
                </a>
              </div>
            </div>

            <div className="relative h-[360px] lg:h-full">
              <div className="absolute inset-0 rounded-[40px] bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl shadow-black/20 overflow-hidden">
                <img
                  src={locationImg}
                  alt="Hệ thống cửa hàng McDono"
                  className="w-full h-full object-cover brightness-[0.85]"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-black/30 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 bg-white/95 rounded-3xl p-5 text-gray-800 shadow-xl">
                  <p className="text-xs font-semibold uppercase text-[#e21b1b] tracking-widest">
                    50+ Cửa hàng toàn quốc
                  </p>
                  <p className="text-lg font-bold mt-1">Đến McDono bất cứ khi nào bạn thèm ngon</p>
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
      <section className="max-w-6xl mx-auto px-6 -mt-12">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white rounded-3xl shadow-xl p-6 border border-yellow-100">
            <p className="text-xs font-semibold uppercase text-gray-400 tracking-widest">Hotline</p>
            <div className="flex items-center gap-4 mt-3">
              <img src={hotline} alt="Hotline" className="w-12 h-12 object-contain" />
              <div>
                <p className="text-2xl font-black text-[#e21b1b]">1900 1234</p>
                <p className="text-sm text-gray-500">Miễn phí cước gọi</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-3xl shadow-xl p-6 border border-yellow-100">
            <p className="text-xs font-semibold uppercase text-gray-400 tracking-widest">Email</p>
            <p className="text-2xl font-semibold mt-3 break-words">support@mcdono.com</p>
            <p className="text-sm text-gray-500 mt-2">Hỗ trợ đối tác & nhượng quyền</p>
          </div>
          <div className="bg-white rounded-3xl shadow-xl p-6 border border-yellow-100">
            <p className="text-xs font-semibold uppercase text-gray-400 tracking-widest">Giao hàng</p>
            <p className="text-2xl font-semibold mt-3 text-[#e21b1b]">Miễn phí nội thành</p>
            <p className="text-sm text-gray-500 mt-2">
              Áp dụng cho Hà Nội, bán kính giao nhanh 7km quanh mỗi chi nhánh.
            </p>
          </div>
        </div>
      </section>

      {/* Cửa hàng quanh Hà Nội */}
      <section className="max-w-6xl mx-auto px-6 mt-16">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-gray-400 font-semibold">Store tour</p>
            <h2 className="text-3xl md:text-4xl font-black text-[#e21b1b] mt-1">
              Các cửa hàng quanh Hà Nội
            </h2>
            <p className="text-gray-500 mt-2">
              Chọn vị trí yêu thích để đặt bàn, nhận đồ tại quầy hoặc gọi giao tận nơi với dịch vụ giao hàng miễn phí.
            </p>
          </div>
          <a
            href="https://maps.google.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#e21b1b] text-white rounded-full font-semibold shadow-md hover:bg-[#c21515]"
          >
            Xem bản đồ lớn →
          </a>
        </div>

        <div className="grid gap-8 mt-10 md:grid-cols-2">
          {storeLocations.map((store) => (
            <div
              key={store.city}
              className="bg-white rounded-3xl border border-yellow-100 shadow-lg p-7 flex flex-col gap-4"
            >
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest">
                {store.city}
              </p>
              <p className="text-2xl font-bold text-gray-900">{store.address}</p>
              <p className="text-sm text-gray-500">Giờ mở cửa: {store.hours}</p>
              <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-inner">
                <iframe
                  title={`Bản đồ ${store.city}`}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(store.mapQuery || store.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                  width="100%"
                  height="220"
                  loading="lazy"
                  className="w-full border-0"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-dashed border-gray-200">
                <span className="text-sm font-semibold text-[#e21b1b]">
                  Hotline đặt bàn: {store.hotline}
                </span>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.mapQuery || store.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-gray-600 hover:text-[#e21b1b]"
                >
                  Chỉ đường
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Form phản hồi */}
      <section className="max-w-6xl mx-auto px-6 mt-16">
        <div className="bg-white rounded-3xl shadow-2xl border border-yellow-100 p-8">
          <p className="text-xs uppercase tracking-[0.4em] text-gray-400 font-semibold">Phản hồi</p>
          <h3 className="text-3xl font-black text-[#e21b1b] mt-2">Chia sẻ trải nghiệm</h3>
          <p className="text-gray-500 mt-2">
            Hãy để lại lời nhắn, chúng tôi sẽ phản hồi trong vòng 24 giờ. Các góp ý về menu mới,
            trải nghiệm giao hàng hoặc hợp tác đều được ghi nhận.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-semibold text-gray-600">Họ và tên</label>
              <input
                type="text"
                placeholder="Nguyễn Văn A"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#e21b1b]"
                required
              />
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-gray-600">Email</label>
                <input
                  type="email"
                  placeholder="banhmi@mcdono.com"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#e21b1b]"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Số điện thoại</label>
                <input
                  type="tel"
                  placeholder="0909 000 000"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#e21b1b]"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">Chủ đề (tùy chọn)</label>
              <input
                type="text"
                placeholder="Ví dụ: Đặt tiệc sinh nhật"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#e21b1b]"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">Nội dung</label>
              <textarea
                placeholder="Chia sẻ mong muốn của bạn..."
                name="message"
                value={formData.message}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 h-36 resize-none focus:outline-none focus:ring-2 focus:ring-[#e21b1b]"
                required
              />
            </div>
            {formState.success && (
              <div className="rounded-2xl bg-green-50 border border-green-200 px-4 py-3 text-green-700 text-sm font-semibold">
                {formState.success}
              </div>
            )}
            {formState.error && (
              <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm font-semibold">
                {formState.error}
              </div>
            )}
            <button
              type="submit"
              disabled={formState.submitting}
              className="w-full bg-[#e21b1b] text-white py-4 rounded-2xl font-semibold text-lg shadow-lg shadow-[#e21b1b]/40 hover:bg-[#c21515] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {formState.submitting ? "Đang gửi..." : "Gửi phản hồi cho McDono"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
