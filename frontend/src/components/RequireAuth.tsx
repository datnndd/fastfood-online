"use client";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RequireAuth({ role, children }:{
  role?: "staff"|"manager"; children: React.ReactNode
}) {
  const { me, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading) {
      if (!me) router.push("/login");
      else if (role && me.role !== role && me.role !== "manager") router.push("/");
    }
  }, [me, loading, role, router]);
  if (loading || !me) return null;
  if (role && me.role !== role && me.role !== "manager") return null;
  return <>{children}</>;
}
