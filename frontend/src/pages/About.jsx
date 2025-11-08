import React from "react";
import heroAbout from "../assets/images/hero-about.png";
import garan from "../assets/images/garan.png";
import hamberger from "../assets/images/hamberger.jpg";
import herobanner from "../assets/images/herobanner.jpg";
import herobanner2 from "../assets/images/herobanner2.jpg";
import online from "../assets/images/online.jpg";

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fff7e6] via-[#ffe1cc] to-[#ffcccc] text-gray-800 overflow-hidden">
      {/* HERO */}
      <section className="relative py-24 text-center text-white">
        <img
          src={heroAbout}
          alt="Mc Dono Hero"
          className="absolute inset-0 w-full h-full object-cover brightness-50"
        />
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <h1 className="text-6xl font-extrabold drop-shadow-xl mb-6">
            Về Mc Dono 🍔
          </h1>
          <p className="text-lg font-medium text-white/90">
            Hành trình mang hạnh phúc và hương vị giòn tan đến mọi gia đình Việt.
          </p>
        </div>
      </section>

      {/* STORY */}
      <section className="max-w-6xl mx-auto py-20 px-6 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h2 className="text-4xl font-bold text-[#e21b1b] mb-6">
            🏆 Câu chuyện Mc Dono
          </h2>
          <p className="mb-4">
            Mc Dono được sáng lập với sứ mệnh mang đến những món ăn nhanh ngon
            miệng, sạch sẽ và vui vẻ. Từ gà rán, burger đến mì Ý, mọi món đều được
            làm từ nguyên liệu chất lượng cao và công thức riêng biệt.
          </p>
          <p>
            Mỗi cửa hàng Mc Dono là một không gian đầy màu sắc, thân thiện và gần
            gũi với mọi lứa tuổi – nơi bạn có thể tận hưởng bữa ăn cùng gia đình
            và bạn bè trong không khí ấm áp.
          </p>
        </div>
        <img
          src={herobanner}
          alt="Mc Dono Restaurant"
          className="rounded-3xl shadow-2xl border-4 border-[#f7c600]/70"
        />
      </section>

      {/* MISSION */}
      <section className="bg-[#e21b1b] text-white py-20">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <img
            src={hamberger}
            alt="Burger"
            className="rounded-3xl shadow-lg hidden md:block"
          />
          <div>
            <h3 className="text-3xl font-bold mb-4">🎯 Sứ mệnh</h3>
            <p className="text-lg mb-6">
              Mc Dono cam kết mang đến trải nghiệm ẩm thực thú vị nhất – nơi món
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
        <h2 className="text-4xl font-bold text-[#e21b1b]">💡 Giá trị cốt lõi</h2>
        <div className="grid md:grid-cols-3 gap-10">
          {[
            {
              title: "Chất lượng hàng đầu",
              desc: "Mỗi miếng gà, mỗi chiếc burger đều được chế biến cẩn thận với nguyên liệu tươi ngon.",
              img: garan,
              color: "border-[#f7c600]",
            },
            {
              title: "Trải nghiệm vui vẻ",
              desc: "Không chỉ là bữa ăn, Mc Dono mang đến niềm vui, tiếng cười và sự ấm cúng trong từng khoảnh khắc.",
              img: herobanner2,
              color: "border-[#e21b1b]",
            },
            {
              title: "Đổi mới liên tục",
              desc: "Không ngừng sáng tạo và cải tiến menu để mang đến những hương vị mới mẻ cho khách hàng.",
              img: online,
              color: "border-[#ff9900]",
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
        <h2 className="text-4xl font-bold text-[#e21b1b] text-center mb-10">
          📸 Khoảnh khắc Mc Dono
        </h2>
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6 px-6">
          {[herobanner, hamberger, garan].map((img, i) => (
            <img
              key={i}
              src={img}
              alt="Mc Dono moment"
              className="rounded-2xl shadow-lg hover:scale-105 transition-transform duration-300"
            />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-20 bg-[#e21b1b] text-white">
        <h2 className="text-4xl font-extrabold mb-6">
          Ghé Mc Dono để tận hưởng hương vị tuyệt vời ngay hôm nay! 🍟
        </h2>
        <a
          href="/menu"
          className="inline-block bg-[#f7c600] hover:bg-[#ffd633] text-[#b91c1c] font-bold text-lg px-10 py-4 rounded-full shadow-lg transition-all duration-300 hover:scale-105"
        >
          Xem thực đơn ngay
        </a>
      </section>
    </div>
  );
}
