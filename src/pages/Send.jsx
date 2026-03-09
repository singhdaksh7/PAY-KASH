import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import api from "../lib/api";

export default function Send() {
  const { user, showToast, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getUsers(search).then((d) => setUsers(d.users || [])).catch(console.error);
  }, [search]);

  const handleSend = async () => {
    setLoading(true);
    try {
      const data = await api.send(selected._id, amount, note);
      showToast(data.message);
      await refreshUser();
      navigate("/dashboard");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen max-w-lg mx-auto pb-10 animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-dark-900/85 backdrop-blur-lg">
        <button onClick={() => navigate("/dashboard")} className="text-xl text-white">←</button>
        <h2 className="font-bold text-lg">Send PAY-KASH</h2>
        <div className="w-8" />
      </div>

      {/* Steps bar */}
      <div className="flex gap-2 px-5 mb-5">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`flex-1 h-1 rounded-full transition-all duration-300 ${
            s <= step ? "bg-gradient-to-r from-[#00F5A0] to-[#00D9F5]" : "bg-dark-600"}`} />
        ))}
      </div>

      {/* Step 1: Select recipient */}
      {step === 1 && (
        <div className="px-5 space-y-3">
          <input placeholder="Search users..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm" />
          {users.map((u) => (
            <button key={u._id} onClick={() => { setSelected(u); setStep(2); }}
              className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-transparent hover:border-[#00F5A0]/30 transition text-left">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00F5A0]/30 to-[#00D9F5]/30 flex items-center justify-center text-sm font-bold text-[#00F5A0] border border-[#00F5A0]/20 shrink-0">
                {u.avatar}
              </div>
              <div>
                <div className="text-sm font-semibold">{u.name}</div>
                <div className="text-xs text-muted">{u.email}</div>
              </div>
            </button>
          ))}
          {users.length === 0 && <p className="text-muted text-center py-8 text-sm">No users found</p>}
        </div>
      )}

      {/* Step 2: Enter amount */}
      {step === 2 && selected && (
        <div className="px-5">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00F5A0]/30 to-[#00D9F5]/30 flex items-center justify-center text-xl font-bold text-[#00F5A0] mx-auto mb-2 border border-[#00F5A0]/20">
              {selected.avatar}
            </div>
            <div className="font-semibold">{selected.name}</div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Amount (CC)</label>
            <input type="number" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-3xl font-bold text-center" />
            <p className="text-xs text-muted text-center mt-1.5">Balance: {user.balance.toLocaleString()} CC</p>
          </div>

          <div className="flex gap-2 mb-5">
            {[100, 250, 500, 1000].map((a) => (
              <button key={a} onClick={() => setAmount(String(a))}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm font-semibold text-muted hover:text-white hover:border-[#00F5A0]/30 transition">
                {a}
              </button>
            ))}
          </div>

          <div className="mb-5">
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Note (optional)</label>
            <input placeholder="What's this for?" value={note} onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm" />
          </div>

          <button onClick={() => parseFloat(amount) > 0 && setStep(3)}
            className="w-full py-3.5 bg-gradient-to-r from-[#00F5A0] to-[#00D9F5] rounded-xl text-dark-900 font-bold text-sm shadow-lg shadow-[#00F5A0]/25 hover:scale-[1.02] active:scale-[0.98] transition-transform">
            Continue
          </button>
          <button onClick={() => setStep(1)}
            className="w-full mt-2 py-3 rounded-xl border border-white/10 text-muted text-sm">
            Change recipient
          </button>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && selected && (
        <div className="px-5">
          <div className="p-6 rounded-2xl bg-dark-700/80 border border-white/5">
            <h3 className="text-center font-bold text-lg mb-5">Confirm Transfer</h3>
            {[
              ["To", selected.name],
              ["Amount", <span className="text-[#00F5A0] font-bold text-xl">{parseFloat(amount).toLocaleString()} CC</span>],
              ["Equivalent", `₹${parseFloat(amount).toLocaleString()} INR`],
              ...(note ? [["Note", note]] : []),
            ].map(([label, value], i) => (
              <div key={i} className="flex justify-between items-center py-3 border-b border-white/[0.04]">
                <span className="text-muted text-sm">{label}</span>
                <span className="font-semibold text-sm">{value}</span>
              </div>
            ))}
            <button onClick={handleSend} disabled={loading}
              className="w-full mt-5 py-3.5 bg-gradient-to-r from-[#00F5A0] to-[#00D9F5] rounded-xl text-dark-900 font-bold text-sm shadow-lg shadow-[#00F5A0]/25 hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50">
              {loading ? "Sending..." : "Confirm & Send"}
            </button>
            <button onClick={() => setStep(2)}
              className="w-full mt-2 py-3 rounded-xl border border-white/10 text-muted text-sm">
              Go Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
