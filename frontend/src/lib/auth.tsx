"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

type Me = { id:number; username:string; email:string; role:"customer"|"staff"|"manager" };

const Ctx = createContext<{
  me: Me | null;
  loading: boolean;
  login: (u: string, p: string) => Promise<void>;
  register: (u: string, p: string, email?: string) => Promise<void>;
  logout: () => void;
}>({ me: null, loading: true, login: async () => {}, register: async () => {}, logout: () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchMe() {
    try { setMe((await api.get("/accounts/me/")).data); }
    catch { setMe(null); }
    setLoading(false);
  }
  useEffect(() => { fetchMe(); }, []);

  async function login(username: string, password: string) {
    const { data } = await api.post("/auth/token/", { username, password });
    localStorage.setItem("access", data.access);
    localStorage.setItem("refresh", data.refresh);
    await fetchMe();
  }
  async function register(username: string, password: string, email?: string) {
    await api.post("/accounts/register/", { username, password, email });
    await login(username, password);
  }
  function logout() {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setMe(null);
  }

  return <Ctx.Provider value={{ me, loading, login, register, logout }}>{children}</Ctx.Provider>;
}
export function useAuth() { return useContext(Ctx); }
