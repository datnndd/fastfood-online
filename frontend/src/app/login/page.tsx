"use client";
import { useForm } from "react-hook-form";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { register, handleSubmit } = useForm<{username:string; password:string}>();
  const { login } = useAuth();
  const router = useRouter();

  async function onSubmit(v: {username:string; password:string}) {
    await login(v.username, v.password);
    router.push("/menu");
  }
  return (
    <div className="max-w-sm mx-auto">
      <h1 className="text-xl font-semibold mb-4">Đăng nhập</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <input {...register("username")} placeholder="Username" className="w-full border p-2 rounded" />
        <input {...register("password")} placeholder="Password" type="password" className="w-full border p-2 rounded" />
        <button className="w-full bg-black text-white py-2 rounded">Đăng nhập</button>
      </form>
      <p className="text-sm mt-3">Chưa có tài khoản? <a className="underline" href="/register">Đăng ký</a></p>
    </div>
  );
}
