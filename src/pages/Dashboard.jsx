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
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshUser();
    Promise.all([
      api.getHistory({ limit: 5 }),
      api.getStats(),
      api.getNotifications().catch(() => ({ unreadCount: 0 })),
    ]).then(([histData, statsData, notifData]) => {
      setTxs(histData.transactions || []);
      setStats(statsData.stats || stats);
      setUnread(notifData.unreadCount || 0);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  return (
    <div className="min-h-screen max-w-lg mx-auto pb-24 animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-dark-900/85 backdrop-blur-lg">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/profile")}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00F5A0]/30 to-[#00D9F5]/30 flex items-center justify-center text-sm font-bold text-[#00F5A0] border border-[#00F5A0]/20 hover:scale-105 transition">
            {user.avatar}
          </button>
          <div>
            <div className="text-xs text-muted">Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},</div>
            <div className="text-lg font-bold">{user.name.split(" ")[0]}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/notifications")} className="relative p-2 rounded-lg bg-white/5 hover:bg-white/10 transition">
            <span className="text-lg">&#128276;</span>
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent-red rounded-full text-[10px] font-bold flex items-center justify-center text-white">{unread > 9 ? "9+" : unread}</span>
            )}
          </button>
          <button onClick={() => { logout(); navigate("/login"); }}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-muted text-sm">
            Logout
          </button>
        </div>
      </div>

      {/* Balance Card */}
      <div className="mx-5 mt-2 p-7 rounded-3xl bg-gradient-to-br from-dark-700/90 to-dark-800/90 border border-white/5 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[#00F5A0]/10 blur-2xl" />
        <p className="text-xs text-muted uppercase tracking-widest">Total Balance</p>
        <h2 className="text-5xl font-extrabold mt-2 mb-1 tracking-tight">
          <span className="text-3xl opacity-50">PK </span>
          {user.balance.toLocaleString("en-IN")}
        </h2>
        <p className="text-xs text-muted">= Rs.{user.balance.toLocaleString("en-IN")} INR</p>
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5 text-sm font-semibold">
          <span className="text-[#00F5A0]">+ {(stats.received?.totalAmount || 0).toLocaleString()}</span>
          <span className="w-px h-4 bg-white/10" />
          <span className="text-accent-red">- {(stats.sent?.totalAmount || 0).toLocaleString()}</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-3 mx-5 my-6">
        {[
          { label: "Send", icon: "S", gradient: "from-[#00F5A0] to-[#00D9F5]", to: "/send" },
          { label: "Request", icon: "R", gradient: "from-[#f8b500] to-[#ff6b81]", to: "/requests" },
          { label: "QR Pay", icon: "Q", gradient: "from-[#a29bfe] to-[#6c5ce7]", to: "/qr" },
          { label: "History", icon: "H", gradient: "from-[#fd79a8] to-[#e84393]", to: "/history" },
        ].map((a) => (
          <button key={a.label} onClick={() => navigate(a.to)}
            className="flex flex-col items-center gap-1.5 group">
            <div className={`w-13 h-13 rounded-2xl bg-gradient-to-br ${a.gradient} flex items-center justify-center text-lg shadow-lg group-hover:scale-105 transition-transform text-dark-900 font-bold p-3`}>
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
              <button key={tx._id} onClick={() => navigate(`/receipt?id=${tx._id}`)}
                className="w-full flex items-center justify-between py-3 border-b border-white/[0.03] hover:bg-white/[0.02] transition text-left">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm ${
                    isSent ? "bg-accent-red/15 text-accent-red" : "bg-[#00F5A0]/15 text-[#00F5A0]"}`}>
                    {isSent ? "S" : "R"}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{isSent ? `To ${name}` : `From ${name}`}</div>
                    <div className="text-xs text-muted">{tx.note || "Transfer"}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold ${isSent ? "text-accent-red" : "text-[#00F5A0]"}`}>
                    {isSent ? "-" : "+"}{tx.amount.toLocaleString()} PK
                  </div>
                  <div className="text-[11px] text-muted">{formatDate(tx.createdAt)}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-dark-900/95 backdrop-blur-lg border-t border-white/5 z-20">
        <div className="max-w-lg mx-auto flex justify-around py-2">
          {[
            { label: "Home", icon: "H", to: "/dashboard", active: true },
            { label: "QR", icon: "Q", to: "/qr" },
            { label: "Send", icon: "S", to: "/send" },
            { label: "Requests", icon: "R", to: "/requests" },
            { label: "Profile", icon: "P", to: "/profile" },
          ].map((nav) => (
            <button key={nav.label} onClick={() => navigate(nav.to)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 ${nav.active ? "text-[#00F5A0]" : "text-muted hover:text-white"} transition`}>
              <span className="text-base font-bold">{nav.icon}</span>
              <span className="text-[10px]">{nav.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
