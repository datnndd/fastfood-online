import React from "react";
import logo from "../assets/images/logo.jpg";
import hotline from "../assets/images/hotline.png";

export default function ContactPage() {
  return (
    <div class="min-h-screen bg-yellow-50 text-gray-800">
      {/* Banner chính với logo và tiêu đề */}
      <div className="relative bg-[#e21b1b] text-white py-12 flex flex-col items-center justify-center">
        <img src={logo} alt="Logo" className="h-24 w-auto mb-4 rounded-md shadow-lg" />
        <h1 className="text-4xl md:text-5xl font-extrabold text-center drop-shadow-lg">
          Liên hệ với chúng tôi
        </h1>
        <p className="mt-2 text-lg md:text-xl text-gray-200 text-center">
          Chúng tôi luôn sẵn sàng lắng nghe bạn
        </p>
      </div>

      {/* Hotline nổi bật */}
      <div className="max-w-4xl mx-auto p-6 mt-6">
        <div className="flex flex-col md:flex-row items-center md:justify-start bg-[#e21b1b] text-white rounded-lg p-6 shadow-md gap-4">
          <img src={hotline} alt="Hotline" className="h-14 w-auto" />
          <div className="text-center md:text-left">
            <p className="text-xl font-semibold">Hotline: 1900 1234</p>
            <p className="mt-1">Email: support@mcdono.com</p>
          </div>
        </div>
      </div>

      {/* Thông tin khác */}
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Địa chỉ */}
        <div className="bg-gray-50 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-2 text-[#e21b1b]">Địa chỉ</h2>
          <p>123 Đường ABC, Quận 1, TP. Hồ Chí Minh</p>
        </div>

        {/* Giờ làm việc */}
        <div className="bg-gray-50 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-2 text-[#e21b1b]">Giờ làm việc</h2>
          <p>Thứ 2 - Chủ Nhật: 08:00 - 21:00</p>
        </div>

        {/* Form phản hồi */}
        <div className="bg-gray-50 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4 text-[#e21b1b]">Gửi phản hồi</h2>
          <form className="space-y-4">
            <input
              type="text"
              placeholder="Họ và tên"
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#e21b1b]"
            />
            <input
              type="email"
              placeholder="Email"
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#e21b1b]"
            />
            <textarea
              placeholder="Nội dung"
              className="w-full p-3 border border-gray-300 rounded h-36 focus:outline-none focus:ring-2 focus:ring-[#e21b1b]"
            />
            <button
              type="submit"
              className="bg-[#e21b1b] text-white px-6 py-3 rounded hover:bg-red-700 transition font-semibold"
            >
              Gửi
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
