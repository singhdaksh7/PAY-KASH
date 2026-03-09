import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import api from "../lib/api";

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function History() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [txs, setTxs] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    api.getHistory({ type: filter, page, limit: 20 })
      .then((d) => {
        setTxs(d.transactions || []);
        setTotalPages(d.totalPages || 1);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter, page]);

  if (!user) return null;

  return (
    <div className="min-h-screen max-w-lg mx-auto pb-10 animate-fade-in">
      <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-dark-900/85 backdrop-blur-lg">
        <button onClick={() => navigate("/dashboard")} className="text-xl text-white">←</button>
        <h2 className="font-bold text-lg">Transaction History</h2>
        <div className="w-8" />
      </div>

      {/* Filters */}
      <div className="flex gap-2 px-5 mb-4">
        {["all", "sent", "received"].map((f) => (
          <button key={f} onClick={() => { setFilter(f); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              filter === f
                ? "bg-[#00F5A0]/15 text-[#00F5A0] border border-[#00F5A0]/20"
                : "text-muted border border-transparent hover:bg-white/5"}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="px-5">
        {loading && <p className="text-muted text-center py-10 text-sm">Loading...</p>}

        {!loading && txs.length === 0 && (
          <p className="text-muted text-center py-10 text-sm">No transactions found</p>
        )}

        <div className="space-y-1">
          {txs.map((tx) => {
            const isSent = (tx.from?._id || tx.from) === user.id;
            const other = isSent ? tx.to : tx.from;
            const name = typeof other === "object" ? other.name : "User";
            return (
              <div key={tx._id} className="flex items-center justify-between py-3.5 border-b border-white/[0.03]">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm ${
                    isSent ? "bg-accent-red/15 text-accent-red" : "bg-[#00F5A0]/15 text-[#00F5A0]"}`}>
                    {isSent ? "↑" : "↓"}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{isSent ? `To ${name}` : `From ${name}`}</div>
                    <div className="text-xs text-muted">{tx.note || "Transfer"}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold ${isSent ? "text-accent-red" : "text-[#00F5A0]"}`}>
                    {isSent ? "-" : "+"}{tx.amount.toLocaleString()} CC
                  </div>
                  <div className="text-[11px] text-muted">{formatDate(tx.createdAt)}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-6">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-4 py-2 rounded-lg bg-white/5 text-sm disabled:opacity-30">← Prev</button>
            <span className="text-sm text-muted">{page} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-4 py-2 rounded-lg bg-white/5 text-sm disabled:opacity-30">Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
