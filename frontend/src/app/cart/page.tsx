"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function CartPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["cart"], queryFn: async () => (await api.get("/cart/")).data });

  const updateItem = useMutation({
    mutationFn: ({ id, quantity }: {id:number; quantity:number}) =>
      api.patch(`/cart/items/${id}/`, { quantity }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  const removeItem = useMutation({
    mutationFn: (id: number) => api.delete(`/cart/items/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  const checkout = useMutation({
    mutationFn: () => api.post("/orders/checkout/", { payment_method: "cash" }),
    onSuccess: () => { alert("Đặt hàng thành công!"); qc.invalidateQueries({ queryKey: ["cart"] }); },
  });

  const items = data?.items ?? [];

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Giỏ hàng</h1>
      {items.length === 0 ? <div>Giỏ hàng trống.</div> : (
        <div className="space-y-2">
          {items.map((ci: any) => (
            <div key={ci.id} className="bg-white border rounded p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{ci.menu_item.name}</div>
                <div className="text-sm opacity-70">SL: {ci.quantity}</div>
              </div>
              <div className="space-x-2">
                <button className="px-2 py-1 border rounded" onClick={() => updateItem.mutate({ id: ci.id, quantity: ci.quantity + 1 })}>+</button>
                <button className="px-2 py-1 border rounded" onClick={() => updateItem.mutate({ id: ci.id, quantity: Math.max(1, ci.quantity - 1) })}>-</button>
                <button className="px-2 py-1 border rounded" onClick={() => removeItem.mutate(ci.id)}>Xoá</button>
              </div>
            </div>
          ))}
          <button onClick={() => checkout.mutate()} className="mt-4 px-4 py-2 rounded bg-black text-white">
            Đặt hàng
          </button>
        </div>
      )}
    </div>
  );
}
