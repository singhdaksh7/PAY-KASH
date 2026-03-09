import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import api from "../lib/api";

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function Admin() {
  const { user, logout, showToast } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const [data, setData] = useState(null);
  const [txs, setTxs] = useState([]);
  const [creditUserId, setCreditUserId] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  const [creditNote, setCreditNote] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [dashData, txData] = await Promise.all([
        api.getAdminDashboard(),
        api.getAdminTransactions(),
      ]);
      setData(dashData.dashboard);
      setTxs(txData.transactions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCredit = async () => {
    if (!creditUserId || !creditAmount) return;
    try {
      const res = await api.creditUser(creditUserId, creditAmount, creditNote);
      showToast(res.message);
      setCreditAmount("");
      setCreditNote("");
      loadData();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  if (!user || loading) return <div className="min-h-screen flex items-center justify-center text-muted">Loading...</div>;

  const tabs = ["overview", "users", "transactions", "credit"];

  return (
    <div className="min-h-screen max-w-2xl mx-auto pb-10 animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-dark-900/85 backdrop-blur-lg">
        <div className="flex items-center gap-2">
          <span className="text-[#00F5A0]">🛡️</span>
          <span className="font-bold text-lg">Admin Panel</span>
        </div>
        <button onClick={() => { logout(); navigate("/login"); }}
          className="p-2 rounded-lg bg-white/5 text-muted text-sm">Logout</button>
      </div>

      {/* Tabs */}
      <div className="flex px-5 border-b border-dark-600">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-semibold transition border-b-2 ${
              tab === t ? "text-[#00F5A0] border-[#00F5A0]" : "text-muted border-transparent"}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="px-5 mt-5">
        {/* Overview */}
        {tab === "overview" && data && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Total Users", value: data.totalUsers, color: "text-white" },
              { label: "In Circulation", value: data.totalCirculation?.toLocaleString() + " CC", color: "text-[#00F5A0]" },
              { label: "Transactions", value: data.totalTransactions, color: "text-white" },
              { label: "Total Volume", value: data.totalVolume?.toLocaleString() + " CC", color: "text-[#f8b500]" },
            ].map((s, i) => (
              <div key={i} className="p-5 rounded-2xl bg-white/[0.03] border border-white/5">
                <div className="text-xs text-muted uppercase tracking-wider">{s.label}</div>
                <div className={`text-2xl font-extrabold mt-1 ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Users */}
        {tab === "users" && data?.allUsers && (
          <div className="space-y-2">
            {data.allUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00F5A0]/30 to-[#00D9F5]/30 flex items-center justify-center text-sm font-bold text-[#00F5A0] border border-[#00F5A0]/20">
                    {u.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{u.name}</div>
                    <div className="text-xs text-muted">{u.email}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold text-[#00F5A0]">{u.balance.toLocaleString()} CC</div>
                  <div className="text-[11px] text-muted">{u.isActive ? "Active" : "Inactive"}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Transactions */}
        {tab === "transactions" && (
          <div className="space-y-1">
            {txs.map((tx) => (
              <div key={tx._id} className="flex items-center justify-between py-3 border-b border-white/[0.03]">
                <div>
                  <div className="text-sm font-semibold">
                    {tx.from?.name || "System"} → {tx.to?.name || "User"}
                  </div>
                  <div className="text-xs text-muted">{tx.note || tx.type}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-[#f8b500]">{tx.amount.toLocaleString()} CC</div>
                  <div className="text-[11px] text-muted">{formatDate(tx.createdAt)}</div>
                </div>
              </div>
            ))}
            {txs.length === 0 && <p className="text-muted text-center py-8 text-sm">No transactions yet</p>}
          </div>
        )}

        {/* Credit */}
        {tab === "credit" && data?.allUsers && (
          <div className="p-6 rounded-2xl bg-dark-700/80 border border-white/5">
            <h3 className="font-bold text-lg mb-4">Credit PAY-KASH</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Select User</label>
                <select value={creditUserId} onChange={(e) => setCreditUserId(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm appearance-none">
                  <option value="">Choose a user...</option>
                  {data.allUsers.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.balance.toLocaleString()} CC)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Amount</label>
                <input type="number" placeholder="Enter amount" value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Note (optional)</label>
                <input placeholder="Reason for credit" value={creditNote}
                  onChange={(e) => setCreditNote(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm" />
              </div>
              <button onClick={handleCredit}
                className="w-full py-3.5 bg-gradient-to-r from-[#00F5A0] to-[#00D9F5] rounded-xl text-dark-900 font-bold text-sm shadow-lg shadow-[#00F5A0]/25 hover:scale-[1.02] active:scale-[0.98] transition-transform">
                Credit Amount
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
