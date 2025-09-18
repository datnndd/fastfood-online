import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "FastFood Dono",
  description: "Order management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-gray-50">
        <Providers>
          <header className="border-b bg-white">
            <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
              <a href="/" className="font-semibold flex items-center gap-2">
                {/* logo từ public */}
                <img src="/images/logo/logo.svg" alt="Logo" className="h-6" />
                FastFood Dono
              </a>
              <nav className="text-sm flex items-center gap-4">
                <a href="/menu">Menu</a>
                <a href="/cart">Giỏ hàng</a>
                <a href="/orders">Đơn của tôi</a>
                {/* dùng component hiển thị trạng thái người dùng */}
                {/* <NavUser /> nếu bạn đã tạo */}
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
