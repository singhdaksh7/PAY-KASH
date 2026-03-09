import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import api from "../lib/api";

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function Dashboard() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [txs, setTxs] = useState([]);
  const [stats, setStats] = useState({ sent: { totalAmount: 0 }, received: { totalAmount: 0 } });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshUser();
    Promise.all([
      api.getHistory({ limit: 5 }),
      api.getStats(),
    ]).then(([histData, statsData]) => {
      setTxs(histData.transactions || []);
      setStats(statsData.stats || stats);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  return (
    <div className="min-h-screen max-w-lg mx-auto pb-10 animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-dark-900/85 backdrop-blur-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00F5A0]/30 to-[#00D9F5]/30 flex items-center justify-center text-sm font-bold text-[#00F5A0] border border-[#00F5A0]/20">
            {user.avatar}
          </div>
          <div>
            <div className="text-xs text-muted">Good {new Date().getHours() < 12 ? "morning" : "evening"},</div>
            <div className="text-lg font-bold">{user.name.split(" ")[0]}</div>
          </div>
        </div>
        <button onClick={() => { logout(); navigate("/login"); }}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-muted text-sm">
          Logout
        </button>
      </div>

      {/* Balance Card */}
      <div className="mx-5 mt-2 p-7 rounded-3xl bg-gradient-to-br from-dark-700/90 to-dark-800/90 border border-white/5 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[#00F5A0]/10 blur-2xl" />
        <p className="text-xs text-muted uppercase tracking-widest">Total Balance</p>
        <h2 className="text-5xl font-extrabold mt-2 mb-1 tracking-tight">
          <span className="text-3xl opacity-50">CC </span>
          {user.balance.toLocaleString("en-IN")}
        </h2>
        <p className="text-xs text-muted">≈ ₹{user.balance.toLocaleString("en-IN")} INR</p>
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5 text-sm font-semibold">
          <span className="text-[#00F5A0]">↑ +{(stats.received?.totalAmount || 0).toLocaleString()}</span>
          <span className="w-px h-4 bg-white/10" />
          <span className="text-accent-red">↓ -{(stats.sent?.totalAmount || 0).toLocaleString()}</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex justify-center gap-6 my-7">
        {[
          { label: "Send", icon: "↗", gradient: "from-[#00F5A0] to-[#00D9F5]", to: "/send" },
          { label: "History", icon: "⏱", gradient: "from-[#f8b500] to-[#ff6b81]", to: "/history" },
        ].map((a) => (
          <button key={a.label} onClick={() => navigate(a.to)}
            className="flex flex-col items-center gap-1.5 group">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${a.gradient} flex items-center justify-center text-xl shadow-lg group-hover:scale-105 transition-transform text-dark-900 font-bold`}>
              {a.icon}
            </div>
            <span className="text-xs text-muted">{a.label}</span>
          </button>
        ))}
      </div>

      {/* Recent Transactions */}
      <div className="px-5">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">Recent Activity</h3>
          {txs.length > 0 && (
            <button onClick={() => navigate("/history")} className="text-xs text-[#00F5A0]">View All</button>
          )}
        </div>

        {loading && <p className="text-muted text-center py-8 text-sm">Loading...</p>}

        {!loading && txs.length === 0 && (
          <p className="text-muted text-center py-8 text-sm">No transactions yet. Send some coins!</p>
        )}

        <div className="space-y-1">
          {txs.map((tx) => {
            const isSent = (tx.from?._id || tx.from) === user.id;
            const otherUser = isSent ? tx.to : tx.from;
            const name = typeof otherUser === "object" ? otherUser.name : "User";
            return (
              <div key={tx._id} className="flex items-center justify-between py-3 border-b border-white/[0.03]">
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
      </div>
    </div>
  );
}
