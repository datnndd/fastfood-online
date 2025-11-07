import React from "react";
import garan from "../assets/images/garan.png";
import hamberger from "../assets/images/hamberger.jpg";
import online from "../assets/images/online.jpg";
import herobanner from "../assets/images/herobanner2.jpg";

export default function Promotions() {
  const promotions = [
    {
      title: "Gà Rán Giòn Tan",
      desc: "Thưởng thức vị ngon giòn rụm hấp dẫn từ McDono!",
      img: garan,
    },
    {
      title: "Hamburger Siêu Đỉnh",
      desc: "Cắn một miếng – tràn đầy năng lượng và hương vị.",
      img: hamberger,
    },
    {
      title: "Đặt Hàng Online",
      desc: "Nhanh – Gọn – Tiện lợi, giao tận nơi chỉ với vài cú click.",
      img: online,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* === HERO BANNER === */}
      <div
        className="relative w-full h-[480px] bg-center bg-cover"
        style={{ backgroundImage: `url(${herobanner})` }}
      >
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-white text-5xl md:text-6xl font-extrabold uppercase drop-shadow-lg">
            Khuyến Mãi Đặc Biệt 🎉
          </h1>
          <p className="text-white mt-3 text-lg md:text-xl font-medium">
            Ưu đãi siêu hấp dẫn – chỉ có tại McDono!
          </p>
          <button className="mt-6 bg-[#e21b1b] hover:bg-[#c41212] text-white font-semibold py-3 px-8 rounded-full shadow-md transition-transform hover:scale-105">
            Đặt hàng ngay
          </button>
        </div>
      </div>

      {/* === DANH SÁCH KHUYẾN MÃI === */}
      <div className="bg-[#fff6db]"> {/* 💛 màu vàng nhẹ */}
        <div className="max-w-7xl mx-auto text-center py-12 px-6">
          <h2 className="text-4xl font-extrabold text-[#e21b1b] mb-10 uppercase">
            Ưu Đãi Hiện Có
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {promotions.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="overflow-hidden rounded-t-2xl">
                  <img
                    src={item.img}
                    alt={item.title}
                    className="w-full h-56 object-cover transition-transform duration-300 hover:scale-110"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-[#e21b1b] mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-700 text-sm mb-4">{item.desc}</p>
                  <button className="bg-[#e21b1b] hover:bg-[#c41212] text-white font-semibold py-2 px-4 rounded-full transition-colors">
                    Đặt hàng ngay
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
