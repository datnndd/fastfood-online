"use client";
import RequireAuth from "@/components/RequireAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

const NEXT = ["PREPARING","READY","DELIVERING","COMPLETED","CANCELLED"];

export default function StaffOrdersPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["work-orders"], queryFn: async () => (await api.get("/orders/work/")).data });
  const update = useMutation({
    mutationFn: ({id, status}:{id:number; status:string}) => api.patch(`/orders/work/${id}/`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["work-orders"] }),
  });

  const orders = data?.results ?? data ?? [];
  return (
    <RequireAuth role="staff">
      <h1 className="text-xl font-semibold mb-4">Đơn hàng (nhân viên)</h1>
      <div className="space-y-3">
        {orders.map((o: any) => (
          <div key={o.id} className="bg-white border rounded p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">#{o.id} — {o.user}</div>
                <div className="text-sm">Trạng thái: {o.status}</div>
              </div>
              <div className="space-x-2">
                {NEXT.map(s => (
                  <button key={s} className="px-2 py-1 border rounded" onClick={() => update.mutate({id:o.id, status:s})}>{s}</button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </RequireAuth>
  );
}
