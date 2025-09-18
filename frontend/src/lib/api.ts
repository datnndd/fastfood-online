import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE,
});

let isRefreshing = false;
let waiters: ((token: string | null) => void)[] = [];
const notify = (t: string | null) => { waiters.forEach(cb => cb(t)); waiters = []; };

api.interceptors.request.use(cfg => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access");
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

api.interceptors.response.use(
  r => r,
  async (err) => {
    const original = err.config;
    if (err?.response?.status === 401 && !original._retry) {
      original._retry = true;
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refresh = localStorage.getItem("refresh");
          const { data } = await axios.post(
            `${process.env.NEXT_PUBLIC_API_BASE}/auth/token/refresh/`,
            { refresh }
          );
          localStorage.setItem("access", data.access);
          isRefreshing = false;
          notify(data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch {
          isRefreshing = false;
          notify(null);
          localStorage.removeItem("access");
          localStorage.removeItem("refresh");
        }
      }
      return new Promise((resolve, reject) => {
        waiters.push((t) => {
          if (t) {
            original.headers.Authorization = `Bearer ${t}`;
            resolve(api(original));
          } else reject(err);
        });
      });
    }
    return Promise.reject(err);
  }
);
