"use client";
import RequireAuth from "@/components/RequireAuth";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function ManagerMenuPage() {
  const qc = useQueryClient();
  const { data: cats } = useQuery({ queryKey: ["cats"], queryFn: async () => (await api.get("/catalog/categories/")).data });
  const { data: items } = useQuery({ queryKey: ["items-mgr"], queryFn: async () => (await api.get("/catalog/items/")).data });

  const { register, handleSubmit, reset } = useForm<{name:string; price:number; category:number}>();
  const createItem = useMutation({
    mutationFn: (v: any) => api.post("/catalog/items/", v),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["items-mgr"] }); reset(); }
  });

  return (
    <RequireAuth role="manager">
      <h1 className="text-xl font-semibold mb-4">Quản lý Menu</h1>

      <form onSubmit={handleSubmit(v => createItem.mutate(v))} className="bg-white border rounded p-4 space-y-2 mb-6">
        <div className="flex gap-2">
          <input {...register("name")} placeholder="Tên món" className="border p-2 rounded w-full" />
          <input type="number" {...register("price", { valueAsNumber: true })} placeholder="Giá" className="border p-2 rounded w-40" />
          <select {...register("category", { valueAsNumber: true })} className="border p-2 rounded w-60">
            {(cats?.results ?? cats ?? []).map((c:any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="px-4 rounded bg-black text-white">Tạo</button>
        </div>
      </form>

      <div className="grid md:grid-cols-2 gap-3">
        {(items?.results ?? items ?? []).map((it:any) => (
          <div key={it.id} className="bg-white border rounded p-3">
            <div className="font-medium">{it.name}</div>
            <div className="text-sm opacity-70">{Number(it.price).toLocaleString()} đ — {it.category}</div>
          </div>
        ))}
      </div>
    </RequireAuth>
  );
}
