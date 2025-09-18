"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function MenuPage() {
  const { data } = useQuery({
    queryKey: ["items"],
    queryFn: async () => (await api.get("/catalog/items/")).data.results ?? (await api.get("/catalog/items/")).data
  });

  async function addToCart(id: number) {
    await api.post("/cart/items/", { menu_item_id: id, quantity: 1 });
    alert("Đã thêm vào giỏ");
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Menu</h1>
      <div className="grid md:grid-cols-3 gap-4">
        {(data ?? []).map((it: any) => (
          <div key={it.id} className="bg-white border rounded-xl p-4">
            <div className="font-semibold">{it.name}</div>
            <div className="text-sm opacity-70">{it.description}</div>
            <div className="mt-2">{Number(it.price).toLocaleString()} đ</div>
            <button onClick={() => addToCart(it.id)} className="mt-3 px-3 py-2 rounded bg-black text-white">
              Thêm vào giỏ
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
