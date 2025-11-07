import React from "react";
import locationImg from "../assets/images/location.jpg";

export default function StoresPage() {
  return (
    <div className="min-h-screen bg-[#fff8e1] py-16 px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

        {/* --- Bên trái: Hình nền + text đè lên --- */}
        <div className="relative rounded-2xl overflow-hidden shadow-lg h-[650px]">
          {/* Ảnh nền */}
          <img
            src={locationImg}
            alt="McDono Store"
            className="w-full h-full object-cover brightness-75"
          />

          {/* Text đè lên hình */}
          <div className="absolute inset-0 flex flex-col justify-center items-start p-10 text-white">
            <h1 className="text-5xl font-extrabold mb-6 drop-shadow-lg uppercase">
              Hệ Thống Cửa Hàng McDono
            </h1>
            <p className="text-lg font-medium leading-relaxed max-w-lg drop-shadow-md">
              Tận hưởng hương vị giòn tan – nóng hổi của McDono tại các chi nhánh trên toàn quốc.
              <br />
              Dễ dàng tìm cửa hàng gần nhất và ghé thăm ngay hôm nay!
            </p>
          </div>
        </div>

        {/* --- Bên phải: Google Map --- */}
        <div className="rounded-2xl overflow-hidden shadow-lg h-[650px]">
          <iframe
            title="Google Map"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.480547155431!2d106.70042357486907!3d10.775658992320274!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f3e8b1b5bcd%3A0x8ef8e7a73ec2e75f!2zQ8O0bmcgVHkgQ-G7lSBQaOG6p24gTWNEb25v!5e0!3m2!1svi!2s!4v1683123123123!5m2!1svi!2s"
            width="100%"
            height="650"
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </div>
    </div>
  );
}
