import React from "react";
import heroAbout from "../assets/images/hero-about.png";
import garan from "../assets/images/garan.png";
import hamberger from "../assets/images/hamberger.jpg";
import herobanner from "../assets/images/herobanner.jpg";
import herobanner2 from "../assets/images/herobanner2.jpg";
import online from "../assets/images/online.jpg";

import a1 from "../assets/images/about/a1.png";
import a2 from "../assets/images/about/a2.png";
import a3 from "../assets/images/about/a3.png";

export default function About() {
  const storyMoments = [
    {
      tag: "Midnight Lab",
      title: "Burger Giờ Chạng Vạng ra đời",
      description:
        "Ba anh em sáng lập thử 12 phiên bản sốt trên chiếc bếp từ trong căn hộ Cầu Giấy, ghi chú bằng bút dạ và mời hàng xóm nếm thử đến 2h sáng.",
      stat: "120 phần bán hết sau 02 giờ mở bán",
      image: a1,
    },
    {
      tag: "Pop-up Tour",
      title: "Xe bếp đỏ rực chạy khắp 5 quận",
      description:
        "Thay vì chờ khách, McDono dựng quầy lưu động tại các sự kiện đêm. Khói BBQ, playlist hiphop và tiếng reo khi 200 đơn đầu tiên chốt trong 45 phút.",
      stat: "5 quận • 1.400 phần ăn mỗi đêm",
      image: a2,
    },
    {
      tag: "Delivery Live",
      title: "Tiệc 8 phút ở chung cư mới",
      description:
        "Đội giao nhận kết hợp livestream hành trình đơn hàng khiến khách thấy burger vẫn bốc khói ngay trước cửa, tạo nên hàng dài feedback 5 ⭐.",
      stat: "8 phút/giao • 98% đánh giá 5⭐",
      image: a3,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fff1f0] via-[#ffe5e3] to-[#ffd1cf] text-gray-800 overflow-hidden">
      {/* HERO */}
      <section className="relative py-24 text-center text-white">
        <img
          src={heroAbout}
          alt="McDono hero"
          className="absolute inset-0 w-full h-full object-cover brightness-50"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-rose-700/80 via-red-700/60 to-black/70" />
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <h1 className="text-6xl font-extrabold drop-shadow-xl mb-6">
            Về McDono 🍔
          </h1>
          <p className="text-lg font-medium text-white/90">
            Những câu chuyện fast-food được kể bằng vị giòn tan, nhịp sống trẻ và
            nụ cười thật ở từng cửa hàng Hà Nội.
          </p>
        </div>
      </section>

      {/* STORY */}
      <section className="max-w-6xl mx-auto py-20 px-6 grid md:grid-cols-[1.1fr_0.9fr] gap-10 items-start">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-rose-600 mb-3">
            🏆 Câu chuyện McDono
          </p>
          <h2 className="text-4xl font-bold text-rose-600 mb-6">
            Hành trình từ căn bếp chung cư đến bản đồ fast-food Hà Nội
          </h2>
          <p className="mb-4">
            McDono khởi nguồn năm 2019 với chiếc chảo gang duy nhất và lời hứa
            “giòn - nóng - khác lạ”. Từng chiếc burger thử nghiệm được ghi chú
            bằng bút dạ, gửi miễn phí cho hàng xóm và đo phản ứng bằng… emoji.
          </p>
          <p className="mb-6">
            Hôm nay, các cloud-kitchen và cửa hàng vệ tinh của McDono phục vụ hơn
            một nghìn đơn mỗi tối nhưng vẫn giữ kỷ luật thủ công: gà tươi nhận vào
            sáng sớm, ướp trong 4 giờ và chỉ vào chảo khi đơn hàng được xác nhận.
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { value: "5+", label: "năm kể chuyện bằng vị giòn" },
              { value: "50", label: "điểm giao hoạt động mỗi đêm" },
              { value: "92%", label: "khách quay lại ngay tuần kế" },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-white/90 rounded-2xl border border-rose-200 p-4 shadow-sm"
              >
                <p className="text-3xl font-black text-rose-600">
                  {item.value}
                </p>
                <p className="text-sm uppercase tracking-wide text-gray-500">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-8 p-5 bg-white/80 rounded-3xl border border-white/40 shadow-inner">
            <p className="text-xs text-gray-500 uppercase tracking-[0.4em] mb-2">
              mantra bếp mcdono
            </p>
            <p className="text-lg font-semibold text-gray-700">
              “Một chiếc burger ngon có thể đổi mood cả ngày của khách, nên từng
              lớp phải thật chỉnh chu.”
            </p>
            <p className="text-sm text-gray-500 mt-2">— Team Bếp McDono</p>
          </div>
        </div>
        <div className="space-y-6">
          {storyMoments.map((moment) => (
            <article
              key={moment.title}
              className="bg-white rounded-3xl shadow-xl overflow-hidden border border-rose-100"
            >
              <img
                src={moment.image}
                alt={`Placeholder cho ${moment.title}`}
                className="w-full h-44 object-cover"
              />
              <div className="p-6">
                <span className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-600">
                  {moment.tag}
                </span>
                <h3 className="text-2xl font-bold mt-3 mb-2 text-gray-900">
                  {moment.title}
                </h3>
                <p className="text-gray-600 mb-4">{moment.description}</p>
                <span className="inline-flex items-center gap-2 bg-white/80 text-rose-600 font-semibold text-sm px-4 py-2 rounded-full">
                  {moment.stat}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* MISSION */}
      <section className="bg-gradient-to-br from-rose-600 via-red-600 to-red-700 text-white py-20">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <img
            src={hamberger}
            alt="Burger"
            className="rounded-3xl shadow-lg hidden md:block"
          />
          <div>
            <h3 className="text-3xl font-bold mb-4">🎯 Sứ mệnh</h3>
            <p className="text-lg mb-6">
              McDono cam kết mang đến trải nghiệm ẩm thực thú vị nhất – nơi món
              ăn ngon, dịch vụ nhanh chóng và nụ cười thân thiện luôn song hành.
            </p>
            <h3 className="text-3xl font-bold mb-4">🌟 Tầm nhìn</h3>
            <p className="text-lg">
              Trở thành thương hiệu thức ăn nhanh hàng đầu Việt Nam, tiên phong
              trong sự sáng tạo, chất lượng và trải nghiệm khách hàng.
            </p>
          </div>
        </div>
      </section>

      {/* CORE VALUES */}
      <section className="max-w-6xl mx-auto py-20 px-6 text-center space-y-10">
        <h2 className="text-4xl font-bold text-rose-600">💡 Giá trị cốt lõi</h2>
        <div className="grid md:grid-cols-3 gap-10">
          {[
            {
              title: "Chất lượng hàng đầu",
              desc: "Mỗi miếng gà, mỗi chiếc burger đều được chế biến cẩn thận với nguyên liệu tươi ngon.",
              img: garan,
              color: "border-rose-300",
            },
            {
              title: "Trải nghiệm vui vẻ",
              desc: "Không chỉ là bữa ăn, McDono mang đến niềm vui, tiếng cười và sự ấm cúng trong từng khoảnh khắc.",
              img: herobanner2,
              color: "border-rose-500",
            },
            {
              title: "Đổi mới liên tục",
              desc: "Không ngừng sáng tạo và cải tiến menu để mang đến những hương vị mới mẻ cho khách hàng.",
              img: online,
              color: "border-pink-400",
            },
          ].map((item, i) => (
            <div
              key={i}
              className={`bg-white rounded-2xl shadow-xl overflow-hidden border-t-8 ${item.color}`}
            >
              <img
                src={item.img}
                alt={item.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h4 className="text-xl font-semibold mb-3">{item.title}</h4>
                <p>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* GALLERY */}
      <section className="py-20 bg-white">
        <h2 className="text-4xl font-bold text-rose-600 text-center mb-10">
          📸 Khoảnh khắc McDono
        </h2>
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6 px-6">
          {[herobanner, hamberger, garan].map((img, i) => (
            <img
              key={i}
              src={img}
              alt="McDono moment"
              className="rounded-2xl shadow-lg hover:scale-105 transition-transform duration-300"
            />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-20 bg-gradient-to-br from-rose-600 to-red-600 text-white">
        <h2 className="text-4xl font-extrabold mb-6">
          Ghé McDono để tận hưởng hương vị tuyệt vời ngay hôm nay! 🍟
        </h2>
        <a
          href="/menu"
          className="inline-block bg-white hover:bg-gray-50 text-rose-600 font-bold text-lg px-10 py-4 rounded-full shadow-lg transition-all duration-300 hover:scale-105"
        >
          Xem thực đơn ngay
        </a>
      </section>
    </div>
  );
}
