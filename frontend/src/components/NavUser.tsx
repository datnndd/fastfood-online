"use client";
import { useAuth } from "@/lib/auth";

export default function NavUser() {
  const { me, logout } = useAuth();
  if (!me) return <a href="/login" className="underline">Đăng nhập</a>;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span>Hi, {me.username} ({me.role})</span>
      {me.role !== "customer" && <a href="/staff/orders">Staff</a>}
      {me.role === "manager" && <a href="/manager/menu">Manager</a>}
      <button onClick={logout} className="underline">Đăng xuất</button>
    </div>
  );
}
