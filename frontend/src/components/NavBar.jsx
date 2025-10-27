import { Link, useLocation } from "react-router-dom";
import { useAuth, useRole } from "../lib/auth";
import { CartAPI } from "../lib/api";
import { useState, useEffect } from "react";
import logo from "../assets/images/logo.jpg"; // logo của bạn
import hotline from "../assets/images/hotline.png"; // hotline hình

export default function NavBar() {
  const { user, logout } = useAuth();
  const { hasStaffAccess } = useRole();
  const [cartCount, setCartCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (!user) {
      setCartCount(0);
      return;
    }

    const refreshCartCount = () => {
      CartAPI.getCart()
        .then(({ data }) => {
          const itemCount = (data.items ?? []).reduce((sum, item) => sum + (item.quantity ?? 0), 0);
          const comboCount = (data.combos ?? []).reduce((sum, combo) => sum + (combo.quantity ?? 0), 0);
          setCartCount(itemCount + comboCount);
        })
        .catch(() => setCartCount(0));
    };

    refreshCartCount();
    window.addEventListener("cartUpdated", refreshCartCount);
    return () => window.removeEventListener("cartUpdated", refreshCartCount);
  }, [user]);

  return (
    <>
      {/* Thanh vàng trên cùng */}
      <div className="bg-[#f7c600] text-black text-sm">
        <div className="max-w-7xl mx-auto px-4 py-1 flex justify-between items-center font-semibold">
          <div className="flex items-center space-x-4">
            <span>📍 Hồ Chí Minh</span>
            <span className="cursor-pointer hover:underline">VN / EN</span>
          </div>
          {!user && (
            <div className="flex items-center space-x-4">
              <Link to="/register" className="flex items-center gap-1 hover:text-[#e21b1b]">
                <span>🧑‍🍳</span> <span>Đăng ký</span>
              </Link>
              <Link to="/login" className="flex items-center gap-1 hover:text-[#e21b1b]">
                <span>🔑</span> <span>Đăng nhập</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Thanh chính đỏ */}
      <div className="bg-[#e21b1b] text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-[90px] px-6">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <img src={logo} alt="McDono Logo" className="h-[70px] w-auto rounded-md" />
          </Link>

          {/* Menu chính */}
          <div className="hidden md:flex items-center space-x-6 font-semibold uppercase text-[14px]">
            {[
              { path: "/", label: "Trang chủ" },
              { path: "/menu", label: "Thực đơn" },
              { path: "/promotions", label: "Khuyến mãi" },
              { path: "/stores", label: "Cửa hàng" },
              { path: "/contact", label: "Liên hệ" },
              hasStaffAccess ? { path: "/work", label: "Quản lý" } : null,
            ]
              .filter(Boolean)
              .map((link) => (
                <Link
                key={link.path}
                to={link.path}
                className={`group relative px-4 py-2 rounded-full font-semibold transition-all duration-200 transform
                  ${
                    location.pathname === link.path
                      ? "bg-[#f9d7d7] text-[#a70000] scale-110 shadow-md"
                      : "text-white hover:bg-[#f9d7d7] hover:text-[#a70000] hover:scale-110 hover:shadow-md"
                  }`}
              >
                {link.label}
              </Link>
              ))}
          </div>

          {/* Phần bên phải */}
          <div className="flex items-center space-x-6">
            {/* Hotline hình */}
            <img src={hotline} alt="Hotline" className="h-[55px] w-auto" />

            {/* User + Cart */}
            {user ? (
              <>
                {/* Giỏ hàng */}
                <Link to="/cart" className="relative p-2 text-white hover:text-yellow-300 transition-colors">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6H19M7 13v6a1 1 0 001 1h10a1 1 0 001-1v-6M9 19a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z"
                    />
                  </svg>
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>

                {/* Menu người dùng */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 text-white hover:text-yellow-300 transition-colors"
                  >
                    <div className="w-8 h-8 bg-white text-[#e21b1b] rounded-full flex items-center justify-center font-bold">
                      {user.username[0].toUpperCase()}
                    </div>
                    <span className="hidden md:block">{user.username}</span>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50">
                      <div className="py-2">
                        <div className="px-4 py-2 border-b">
                          <p className="text-sm font-medium text-gray-900">{user.username}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                        <Link to="/profile" className="block px-4 py-2 text-sm text-gray-800 hover:bg-gray-100">
                          Hồ sơ của tôi
                        </Link>
                        <Link to="/orders" className="block px-4 py-2 text-sm text-gray-800 hover:bg-gray-100">
                          Đơn hàng của tôi
                        </Link>
                        <button
                          onClick={() => {
                            logout();
                            setShowUserMenu(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-100"
                        >
                          Đăng xuất
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </>
  )
}
