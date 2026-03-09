import { useAuth } from "../lib/AuthContext";

export default function Toast() {
  const { toast } = useAuth();
  if (!toast) return null;

  const bg =
    toast.type === "success"
      ? "bg-[#00F5A0] text-[#0a0f1a]"
      : toast.type === "error"
      ? "bg-red-500 text-white"
      : "bg-yellow-500 text-[#0a0f1a]";

  return (
    <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[9999] px-6 py-3 rounded-xl font-semibold text-sm shadow-lg animate-slide-down ${bg}`}>
      {toast.message}
    </div>
  );
}
