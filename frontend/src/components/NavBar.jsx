import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth, useRole } from "../lib/auth";
import { useEffect, useState } from "react";
import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import logo from "../assets/images/logo.jpg";
import { CatalogAPI } from "../lib/api";

export default function NavBar() {
  const { user, logout } = useAuth();
  const { hasStaffAccess, isManager } = useRole();
  const [cartCount, setCartCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [categories, setCategories] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

  // Lấy danh mục từ API khi component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await CatalogAPI.listCategories();
        setCategories(res.data.results || res.data);
      } catch (error) {
        console.error("Lỗi khi lấy danh mục:", error);
      }
    };
    fetchCategories();
  }, []);

  const navLinks = [
    { path: "/", label: "Trang chủ" },
    { path: "/about", label: "Về Mc Dono" },
    { path: "/menu", label: "Thực đơn", dropdown: categories },
    { path: "/promotions", label: "Khuyến mãi" },
    { path: "/stores", label: "Cửa hàng" },
    { path: "/contact", label: "Liên hệ" },
  ];

  return (
    <>
      {/* Thanh trên cùng */}
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

      {/* Thanh điều hướng chính */}
      <div className="bg-[#e21b1b] text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-[90px] px-6">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img
              src={logo}
              alt="Mc Dono Logo"
              className="h-[65px] w-auto rounded-md bg-white p-1"
            />
          </Link>

          {/* Navigation */}
          <div className="flex space-x-6 font-semibold uppercase text-[14px] relative">
            {navLinks.map((link) => {
              const isActive =
                location.pathname === link.path ||
                (link.path !== "/" && location.pathname.startsWith(link.path));

              return (
                <div key={link.path} className="relative group">
                  <Link
                    to={link.path}
                    className={`px-4 py-2 border-2 transition-all duration-200 rounded-full ${
                      isActive
                        ? "border-white bg-[#f9d7d7] text-[#b91c1c]"
                        : "border-transparent hover:border-white hover:bg-[#f9d7d7] hover:text-[#b91c1c]"
                    }`}
                  >
                    {link.label}
                  </Link>

                  {/* Dropdown Thực đơn */}
                  {link.dropdown && link.dropdown.length > 0 && (
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-[750px] bg-white text-black rounded-xl shadow-lg p-5 z-50 opacity-0 invisible group-hover:visible group-hover:opacity-100 group-hover:translate-y-2 transition-all duration-300 ease-out">
                      <div className="grid grid-cols-4 gap-5">
                        {link.dropdown.map((item) => (
                          <div
                            key={item.slug}
                            onClick={() => navigate(`/menu?category=${item.slug}`)}
                            className="flex flex-col items-center hover:scale-105 transition-transform duration-200 cursor-pointer"
                          >
                            <img
                              src={item.image || item.image_url || "/default.jpg"}
                              alt={item.name}
                              className="w-20 h-20 object-contain mb-2"
                            />
                            <span className="font-semibold text-sm text-gray-800 text-center">
                              {item.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Staff/Manager links */}
            {hasStaffAccess && (
              <Link
                to="/work"
                className={`px-4 py-2 border-2 transition-all duration-200 rounded-full ${
                  location.pathname === "/work" || location.pathname.startsWith("/work")
                    ? "border-white bg-[#f9d7d7] text-[#b91c1c]"
                    : "border-transparent hover:border-white hover:bg-[#f9d7d7] hover:text-[#b91c1c]"
                }`}
              >
                Quản lý
              </Link>
            )}
            {isManager && (
              <Link
                to="/manager/accounts"
                className={`px-4 py-2 border-2 transition-all duration-200 rounded-full ${
                  location.pathname === "/manager/accounts" || location.pathname.startsWith("/manager")
                    ? "border-white bg-[#f9d7d7] text-[#b91c1c]"
                    : "border-transparent hover:border-white hover:bg-[#f9d7d7] hover:text-[#b91c1c]"
                }`}
              >
                Tài khoản
              </Link>
            )}
          </div>

          {/* Giỏ hàng + Người dùng */}
          <div className="flex items-center space-x-6">
            {user && (
              <Link
                to="/cart"
                className="relative p-2 text-white hover:text-yellow-300 transition-colors"
              >
                <ShoppingCartIcon className="w-7 h-7" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {user && (
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
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-800 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Hồ sơ của tôi
                      </Link>
                      <Link
                        to="/orders"
                        className="block px-4 py-2 text-sm text-gray-800 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Đơn hàng của tôi
                      </Link>
                      {isManager && (
                        <Link
                          to="/manager/accounts"
                          className="block px-4 py-2 text-sm text-gray-800 hover:bg-gray-100"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Quản lý tài khoản
                        </Link>
                      )}
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
            )}
          </div>
        </div>
      </div>
    </>
  );
}
