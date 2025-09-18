"use client";
import RequireAuth from "@/components/RequireAuth";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function MyOrdersPage() {
  const { data } = useQuery({ queryKey: ["my-orders"], queryFn: async () => (await api.get("/orders/my/")).data });
  const orders = data ?? [];
  return (
    <RequireAuth>
      <h1 className="text-xl font-semibold mb-4">Đơn của tôi</h1>
      <div className="space-y-3">
        {orders.map((o: any) => (
          <div key={o.id} className="bg-white border rounded p-3">
            <div className="font-medium">Mã đơn #{o.id}</div>
            <div className="text-sm">Trạng thái: {o.status}</div>
            <ul className="mt-2 text-sm list-disc pl-6">
              {o.items.map((it: any) => (
                <li key={it.id}>{it.menu_item_name} x {it.quantity}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </RequireAuth>
  );
}
