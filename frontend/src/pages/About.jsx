import { useEffect, useState } from "react";
import { ContentAPI } from "../lib/api";
import heroAbout from "../assets/images/hero-about.png";
import garan from "../assets/images/garan.png";
import hamberger from "../assets/images/hamberger.jpg";
import herobanner from "../assets/images/herobanner.jpg";
import herobanner2 from "../assets/images/herobanner2.jpg";
import online from "../assets/images/online.jpg";

import a1 from "../assets/images/about/a1.png";

export default function About() {
  const [storyMoments, setStoryMoments] = useState([]);

  useEffect(() => {
    const fetchAboutContent = async () => {
      try {
        const response = await ContentAPI.getContentItems('about');
        const items = Array.isArray(response) ? response : response.results || [];

        const stories = items.filter(item => item.type === 'story');

        if (stories.length > 0) {
          // Sort by order
          stories.sort((a, b) => a.order - b.order);

          setStoryMoments(stories.map(item => ({
            tag: item.eyebrow,
            title: item.title,
            description: item.description,
            stat: item.metadata?.stat,
            image: item.image_url || a1 // Fallback to default image if none provided
          })));
        }
      } catch (error) {
        console.error('Error fetching about content:', error);
      }
    };

    fetchAboutContent();
  }, []);

  return (
    <div className="min-h-screen vn-bg-rice-paper text-gray-800 overflow-hidden">
      {/* HERO */}
      <section className="relative py-24 text-center text-white overflow-hidden vn-lotus-pattern">
        <img
          src={heroAbout}
          alt="McDono hero"
          className="absolute inset-0 w-full h-full object-cover brightness-50"
        />
        <div className="absolute inset-0 vn-gradient-red-gold opacity-80" />
        {/* Decorative lanterns */}
        <div className="absolute top-10 left-10 text-5xl vn-animate-lantern-sway">🏮</div>
        <div className="absolute top-10 right-10 text-5xl vn-animate-lantern-sway" style={{ animationDelay: '0.5s' }}>🏮</div>
        <div className="absolute inset-0 vn-bamboo-lines opacity-5" />

        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <h1 className="text-6xl font-black drop-shadow-2xl mb-6 vn-animate-lotus-bloom">
            <span className="text-5xl">🪷</span> Về McDono <span className="text-5xl">🍜</span>
          </h1>
          <p className="text-xl font-semibold text-white/95 max-w-2xl mx-auto">
            Những câu chuyện fast-food được kể bằng vị giòn tan, nhịp sống trẻ và
            nụ cười thật ở từng cửa hàng Hà Nội.
          </p>
        </div>
      </section>

      {/* STORY */}
      <section className="max-w-6xl mx-auto py-20 px-6 space-y-24">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.4em] vn-text-red-primary mb-3 font-bold flex items-center gap-2">
            🏆 Câu chuyện McDono
          </p>
          <h2 className="text-5xl font-black vn-heading-display mb-6">
            Hành trình từ căn bếp chung cư đến bản đồ fast-food Hà Nội
          </h2>
          <p className="mb-4 text-lg leading-relaxed">
            McDono khởi nguồn năm 2019 với chiếc chảo gang duy nhất và lời hứa
            "giòn - nóng - khác lạ". Từng chiếc burger thử nghiệm được ghi chú
            bằng bút dạ, gửi miễn phí cho hàng xóm và đo phản ứng bằng… emoji.
          </p>
          <p className="mb-6 text-lg leading-relaxed">
            Hôm nay, các cloud-kitchen và cửa hàng vệ tinh của McDono phục vụ hơn
            một nghìn đơn mỗi tối nhưng vẫn giữ kỷ luật thủ công: gà tươi nhận vào
            sáng sớm, ướp trong 4 giờ và chỉ vào chảo khi đơn hàng được xác nhận.
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { value: "5+", label: "năm kể chuyện bằng vị giòn" },
              { value: "50", label: "điểm giao hoạt động mỗi đêm" },
              { value: "92%", label: "khách quay lại ngay tuần kế" },
            ].map((item, idx) => (
              <div
                key={item.label}
                className="vn-card-lotus vn-animate-lotus-bloom shadow-md hover:scale-105 transition-transform"
                style={{ animationDelay: `${idx * 0.15}s` }}
              >
                <p className="text-4xl font-black vn-text-red-primary">
                  {item.value}
                </p>
                <p className="text-xs uppercase tracking-[0.3em] vn-text-gold-primary font-bold mt-2">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-8 p-6 vn-card border-2 vn-border-lotus bg-gradient-to-br from-white to-pink-50 shadow-lg">
            <p className="text-xs vn-text-gold-primary uppercase tracking-[0.4em] mb-2 font-bold flex items-center gap-2">
              🪷 mantra bếp mcdono
            </p>
            <p className="text-xl font-bold text-gray-800 leading-relaxed">
              "Một chiếc burger ngon có thể đổi mood cả ngày của khách, nên từng
              lớp phải thật chỉnh chu."
            </p>
            <p className="text-sm vn-text-red-primary mt-3 font-semibold">— Team Bếp McDono</p>
          </div>
        </div>
      </section>
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-4xl font-black vn-heading-display flex items-center gap-3">
            <span className="text-3xl">🏮</span> Tin tức & Sự kiện
          </h2>
          <a href="#" className="vn-btn-outline inline-block">
            Xem tất cả →
          </a>
        </div>
        {storyMoments.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">🪷 Chưa có tin tức</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {storyMoments.map((item, index) => (
              <article key={index} className="flex flex-col items-start justify-between vn-card hover:shadow-2xl vn-animate-lotus-bloom" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="relative w-full aspect-[16/9] overflow-hidden rounded-xl bg-gray-100 border-2 vn-border-lotus">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="absolute inset-0 h-full w-full object-cover transition duration-500 hover:scale-110"
                  />
                  <div className="absolute top-2 right-2 text-2xl">🪷</div>
                </div>
                <div className="max-w-xl w-full">
                  <div className="mt-4 flex items-center gap-x-4 text-xs">
                    <span className="relative z-10 vn-conical-top vn-gradient-lotus px-3 py-1.5 font-bold vn-text-red-primary">
                      {item.tag}
                    </span>
                  </div>
                  <div className="group relative">
                    <h3 className="mt-3 text-xl font-black leading-6 text-gray-900 group-hover:vn-text-red-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-600">
                      {item.description}
                    </p>
                  </div>
                  {item.stat && (
                    <div className="mt-4 flex items-center gap-2 border-t-2 vn-border-gold pt-4 w-full">
                      <span className="text-sm font-bold vn-text-gold-primary vn-gradient-lotus px-3 py-1.5 rounded-full">
                        🔥 {item.stat}
                      </span>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* MISSION */}
      <section className="vn-gradient-red-gold text-white py-20 relative overflow-hidden vn-lotus-pattern">
        {/* Decorative elements */}
        <div className="absolute top-10 right-10 text-6xl opacity-20 vn-animate-lantern-sway">🏮</div>
        <div className="absolute bottom-10 left-10 text-6xl opacity-20">🪷</div>
        <div className="absolute inset-0 vn-bamboo-lines opacity-5" />

        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center relative z-10">
          <img
            src={hamberger}
            alt="Burger"
            className="rounded-3xl shadow-2xl hidden md:block border-4 border-white/20 vn-lantern-glow"
          />
          <div>
            <h3 className="text-4xl font-black mb-4 flex items-center gap-3">
              <span className="text-3xl">🎯</span> Sứ mệnh
            </h3>
            <p className="text-lg mb-6 text-white/95 leading-relaxed">
              McDono cam kết mang đến trải nghiệm ẩm thực thú vị nhất – nơi món
              ăn ngon, dịch vụ nhanh chóng và nụ cười thân thiện luôn song hành.
            </p>
            <h3 className="text-4xl font-black mb-4 flex items-center gap-3">
              <span className="text-3xl">🌟</span> Tầm nhìn
            </h3>
            <p className="text-lg text-white/95 leading-relaxed">
              Trở thành thương hiệu thức ăn nhanh hàng đầu Việt Nam, tiên phong
              trong sự sáng tạo, chất lượng và trải nghiệm khách hàng.
            </p>
          </div>
        </div>
      </section>

      {/* CORE VALUES */}
      <section className="max-w-6xl mx-auto py-20 px-6 text-center space-y-10">
        <h2 className="text-4xl font-black vn-heading-display vn-text-red-primary">
          <span className="text-3xl">💡</span> Giá trị cốt lõi
        </h2>
        <div className="grid md:grid-cols-3 gap-10">
          {[
            {
              title: "Chất lượng hàng đầu",
              desc: "Mỗi miếng gà, mỗi chiếc burger đều được chế biến cẩn thận với nguyên liệu tươi ngon.",
              img: garan,
              color: "vn-border-gold",
            },
            {
              title: "Trải nghiệm vui vẻ",
              desc: "Không chỉ là bữa ăn, McDono mang đến niềm vui, tiếng cười và sự ấm cúng trong từng khoảnh khắc.",
              img: herobanner2,
              color: "vn-border-red",
            },
            {
              title: "Đổi mới liên tục",
              desc: "Không ngừng sáng tạo và cải tiến menu để mang đến những hương vị mới mẻ cho khách hàng.",
              img: online,
              color: "vn-border-lotus",
            },
          ].map((item, i) => (
            <div
              key={i}
              className={`vn-card overflow-hidden border-t-8 ${item.color} group hover:-translate-y-2 transition-transform duration-300`}
            >
              <div className="overflow-hidden h-48">
                <img
                  src={item.img}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <h4 className="text-xl font-bold mb-3 vn-text-red-primary">{item.title}</h4>
                <p className="text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* GALLERY */}
      <section className="py-20 vn-bg-rice-paper relative">
        <div className="absolute inset-0 vn-lotus-pattern opacity-30 pointer-events-none" />
        <h2 className="text-4xl font-black vn-heading-display vn-text-red-primary text-center mb-10 relative z-10">
          <span className="text-3xl">📸</span> Khoảnh khắc McDono
        </h2>
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6 px-6 relative z-10">
          {[herobanner, hamberger, garan].map((img, i) => (
            <div key={i} className="rounded-2xl overflow-hidden border-2 vn-border-gold shadow-lg group">
              <img
                src={img}
                alt="McDono moment"
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-20 vn-gradient-red-gold text-white relative overflow-hidden">
        <div className="absolute inset-0 vn-bamboo-lines opacity-10 pointer-events-none" />
        <div className="absolute top-10 left-10 text-6xl opacity-20 vn-animate-lantern-sway">🏮</div>
        <div className="absolute bottom-10 right-10 text-6xl opacity-20 vn-animate-lantern-sway" style={{ animationDelay: '1s' }}>🏮</div>

        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <h2 className="text-4xl font-black mb-8 vn-heading-display">
            Ghé McDono để tận hưởng hương vị tuyệt vời ngay hôm nay! 🍟
          </h2>
          <a
            href="/menu"
            className="vn-btn-gold inline-flex items-center gap-2 px-10 py-4 text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all"
          >
            <span>Xem thực đơn ngay</span>
            <span>→</span>
          </a>
        </div>
      </section>
    </div >
  );
}
