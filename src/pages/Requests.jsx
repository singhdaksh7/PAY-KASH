import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import api from "../lib/api";

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function Requests() {
  const { user, showToast, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("received");
  const [sent, setSent] = useState([]);
  const [received, setReceived] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => { loadRequests(); }, []);
  useEffect(() => {
    if (showCreate) api.getUsers(search).then((d) => setUsers(d.users || [])).catch(console.error);
  }, [search, showCreate]);

  const loadRequests = async () => {
    try {
      const data = await api.getRequests();
      setSent(data.sent || []);
      setReceived(data.received || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!selected || !amount) return;
    setActionLoading("create");
    try {
      const data = await api.createRequest(selected._id, amount, note);
      showToast(data.message);
      setShowCreate(false);
      setSelected(null);
      setAmount("");
      setNote("");
      loadRequests();
    } catch (err) { showToast(err.message, "error"); }
    finally { setActionLoading(null); }
  };

  const handleRespond = async (requestId, action) => {
    setActionLoading(requestId);
    try {
      const data = await api.respondRequest(requestId, action);
      showToast(data.message);
      await refreshUser();
      loadRequests();
    } catch (err) { showToast(err.message, "error"); }
    finally { setActionLoading(null); }
  };

  if (!user) return null;

  const statusColors = {
    pending: "text-[#f8b500] bg-[#f8b500]/10",
    accepted: "text-[#00F5A0] bg-[#00F5A0]/10",
    declined: "text-accent-red bg-accent-red/10",
  };

  return (
    <div className="min-h-screen max-w-lg mx-auto pb-10 animate-fade-in">
      <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-dark-900/85 backdrop-blur-lg">
        <button onClick={() => navigate("/dashboard")} className="text-xl text-white">&#8592;</button>
        <h2 className="font-bold text-lg">Money Requests</h2>
        <button onClick={() => setShowCreate(true)} className="px-3 py-1.5 bg-[#00F5A0]/15 text-[#00F5A0] rounded-lg text-xs font-semibold">+ New</button>
      </div>

      {/* Create Request Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="w-full max-w-lg bg-dark-800 rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto animate-slide-down">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-lg">Request Money</h3>
              <button onClick={() => { setShowCreate(false); setSelected(null); }} className="text-muted text-xl">x</button>
            </div>

            {!selected ? (
              <>
                <input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm mb-3" />
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {users.map((u) => (
                    <button key={u._id} onClick={() => setSelected(u)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-transparent hover:border-[#00F5A0]/30 transition text-left">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#00F5A0]/30 to-[#00D9F5]/30 flex items-center justify-center text-xs font-bold text-[#00F5A0] shrink-0">{u.avatar}</div>
                      <div>
                        <div className="text-sm font-semibold">{u.name}</div>
                        <div className="text-xs text-muted">{u.email}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00F5A0]/30 to-[#00D9F5]/30 flex items-center justify-center text-sm font-bold text-[#00F5A0]">{selected.avatar}</div>
                  <div>
                    <div className="text-sm font-semibold">{selected.name}</div>
                    <div className="text-xs text-muted">{selected.email}</div>
                  </div>
                  <button onClick={() => setSelected(null)} className="ml-auto text-xs text-muted">Change</button>
                </div>
                <input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-4 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-2xl font-bold text-center mb-3" />
                <div className="flex gap-2 mb-3">
                  {[100, 250, 500, 1000].map((a) => (
                    <button key={a} onClick={() => setAmount(String(a))}
                      className="flex-1 py-2 rounded-lg bg-white/[0.04] text-sm text-muted hover:text-white transition">{a}</button>
                  ))}
                </div>
                <input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)}
                  className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm mb-4" />
                <button onClick={handleCreate} disabled={actionLoading === "create" || !amount}
                  className="w-full py-3.5 bg-gradient-to-r from-[#f8b500] to-[#ff6b81] rounded-xl text-dark-900 font-bold text-sm shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50">
                  {actionLoading === "create" ? "Requesting..." : `Request ${amount || 0} PK`}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 px-5 mb-4">
        {["received", "sent"].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              tab === t ? "bg-[#00F5A0]/15 text-[#00F5A0] border border-[#00F5A0]/20" : "text-muted border border-transparent hover:bg-white/5"}`}>
            {t === "received" ? `Received (${received.filter(r => r.status === "pending").length})` : "Sent"}
          </button>
        ))}
      </div>

      <div className="px-5">
        {loading && <p className="text-muted text-center py-10 text-sm">Loading...</p>}

        {/* Received Requests */}
        {tab === "received" && !loading && (
          <div className="space-y-2">
            {received.length === 0 && <p className="text-muted text-center py-10 text-sm">No requests received</p>}
            {received.map((r) => (
              <div key={r._id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#f8b500]/30 to-[#ff6b81]/30 flex items-center justify-center text-xs font-bold text-[#f8b500]">{r.from?.avatar}</div>
                    <div>
                      <div className="text-sm font-semibold">{r.from?.name}</div>
                      <div className="text-xs text-muted">{formatDate(r.createdAt)}</div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${statusColors[r.status] || ""}`}>{r.status}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xl font-bold text-[#f8b500]">{r.amount.toLocaleString()} PK</span>
                    {r.note && <p className="text-xs text-muted mt-0.5">{r.note}</p>}
                  </div>
                  {r.status === "pending" && (
                    <div className="flex gap-2">
                      <button onClick={() => handleRespond(r._id, "decline")} disabled={actionLoading === r._id}
                        className="px-4 py-2 rounded-xl bg-accent-red/15 text-accent-red text-sm font-semibold hover:bg-accent-red/25 transition disabled:opacity-50">
                        Decline
                      </button>
                      <button onClick={() => handleRespond(r._id, "accept")} disabled={actionLoading === r._id}
                        className="px-4 py-2 rounded-xl bg-[#00F5A0]/15 text-[#00F5A0] text-sm font-semibold hover:bg-[#00F5A0]/25 transition disabled:opacity-50">
                        {actionLoading === r._id ? "..." : "Pay"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sent Requests */}
        {tab === "sent" && !loading && (
          <div className="space-y-2">
            {sent.length === 0 && <p className="text-muted text-center py-10 text-sm">No requests sent</p>}
            {sent.map((r) => (
              <div key={r._id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00F5A0]/30 to-[#00D9F5]/30 flex items-center justify-center text-xs font-bold text-[#00F5A0]">{r.to?.avatar}</div>
                    <div>
                      <div className="text-sm font-semibold">To {r.to?.name}</div>
                      <div className="text-xs text-muted">{formatDate(r.createdAt)}</div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${statusColors[r.status] || ""}`}>{r.status}</span>
                </div>
                <span className="text-lg font-bold text-[#f8b500]">{r.amount.toLocaleString()} PK</span>
                {r.note && <p className="text-xs text-muted mt-0.5">{r.note}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
