import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import api from "../lib/api";

export default function Profile() {
  const { user, refreshUser, showToast } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPinChange, setShowPinChange] = useState(false);

  if (!user) return null;

  const handleSave = async () => {
    if (showPinChange) {
      if (!currentPin) return showToast("Enter current PIN", "error");
      if (newPin.length < 4) return showToast("New PIN must be at least 4 digits", "error");
      if (newPin !== confirmPin) return showToast("PINs don't match", "error");
    }
    setLoading(true);
    try {
      const payload = { name, avatar };
      if (showPinChange && newPin) {
        payload.currentPin = currentPin;
        payload.newPin = newPin;
      }
      const data = await api.updateProfile(payload);
      showToast(data.message);
      await refreshUser();
      if (!showPinChange) navigate("/dashboard");
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      setShowPinChange(false);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const avatarOptions = ["AS", "PP", "RG", "SR", "VS", "DK", "AK", "SK"];

  return (
    <div className="min-h-screen max-w-lg mx-auto pb-10 animate-fade-in">
      <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-dark-900/85 backdrop-blur-lg">
        <button onClick={() => navigate("/dashboard")} className="text-xl text-white">&#8592;</button>
        <h2 className="font-bold text-lg">Profile</h2>
        <div className="w-8" />
      </div>

      <div className="px-5 mt-4">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#00F5A0]/30 to-[#00D9F5]/30 flex items-center justify-center text-3xl font-bold text-[#00F5A0] border-2 border-[#00F5A0]/20 mb-3">
            {avatar}
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            {avatarOptions.map((a) => (
              <button key={a} onClick={() => setAvatar(a)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold transition ${
                  avatar === a ? "bg-[#00F5A0]/20 text-[#00F5A0] border border-[#00F5A0]/40" : "bg-white/5 text-muted border border-transparent hover:border-white/10"}`}>
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Full Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm" />
        </div>

        {/* Email (read-only) */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Email</label>
          <div className="w-full px-4 py-3.5 bg-white/[0.02] border border-white/[0.05] rounded-xl text-muted text-sm">{user.email}</div>
        </div>

        {/* Account info */}
        <div className="mb-6 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted">Balance</span>
            <span className="font-bold text-[#00F5A0]">{user.balance.toLocaleString()} PK</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted">Role</span>
            <span className="font-semibold capitalize">{user.role}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Joined</span>
            <span className="font-semibold">{new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
          </div>
        </div>

        {/* Change PIN */}
        {!showPinChange ? (
          <button onClick={() => setShowPinChange(true)}
            className="w-full mb-4 py-3 rounded-xl border border-white/10 text-muted text-sm hover:bg-white/5 transition">
            Change PIN
          </button>
        ) : (
          <div className="mb-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
            <h4 className="font-semibold text-sm">Change PIN</h4>
            <input type="password" placeholder="Current PIN" value={currentPin} maxLength={6}
              onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ""))}
              className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm" />
            <input type="password" placeholder="New PIN (min 4 digits)" value={newPin} maxLength={6}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
              className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm" />
            <input type="password" placeholder="Confirm New PIN" value={confirmPin} maxLength={6}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
              className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm" />
            <button onClick={() => { setShowPinChange(false); setCurrentPin(""); setNewPin(""); setConfirmPin(""); }}
              className="w-full py-2 text-xs text-muted hover:text-white transition">Cancel</button>
          </div>
        )}

        {/* Save */}
        <button onClick={handleSave} disabled={loading}
          className="w-full py-3.5 bg-gradient-to-r from-[#00F5A0] to-[#00D9F5] rounded-xl text-dark-900 font-bold text-sm shadow-lg shadow-[#00F5A0]/25 hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50">
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
