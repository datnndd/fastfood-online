"use client";
import RequireAuth from "@/components/RequireAuth";
import { useForm } from "react-hook-form";
import { api } from "@/lib/api";

export default function ManagerStaffPage() {
  const { register, handleSubmit, reset } = useForm<{username:string; email:string; password:string}>();
  async function onSubmit(v:any) {
    await api.post("/accounts/staff/create/", { ...v, role: "staff" });
    alert("Đã tạo nhân viên");
    reset();
  }
  return (
    <RequireAuth role="manager">
      <h1 className="text-xl font-semibold mb-4">Tạo nhân viên</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 bg-white border rounded p-4 max-w-md">
        <input {...register("username")} placeholder="Username" className="w-full border p-2 rounded" />
        <input {...register("email")} placeholder="Email" className="w-full border p-2 rounded" />
        <input {...register("password")} type="password" placeholder="Password" className="w-full border p-2 rounded" />
        <button className="px-4 py-2 rounded bg-black text-white">Tạo</button>
      </form>
    </RequireAuth>
  );
}
