import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup, showToast } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pin.length < 4) return showToast("PIN must be at least 4 digits", "error");
    setLoading(true);
    try {
      await signup(name, email, pin);
      navigate("/dashboard");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5">
      <form onSubmit={handleSubmit} className="w-full max-w-sm p-8 bg-dark-800/80 backdrop-blur-xl rounded-3xl border border-white/5">
        <div className="text-center mb-8">
          <div className="inline-block mb-3">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="11" stroke="#00F5A0" strokeWidth="2" />
              <text x="12" y="17" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#00F5A0">C</text>
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Join PAY-KASH</h1>
          <p className="text-muted text-sm mt-1">Get 1000 PK welcome bonus!</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Full Name</label>
            <input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full px-4 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Email</label>
            <input type="email" placeholder="you@campus.edu" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full px-4 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Create PIN</label>
            <input type="password" placeholder="4-6 digit PIN" value={pin} maxLength={6}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} required
              className="w-full px-4 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm" />
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full mt-6 py-3.5 bg-gradient-to-r from-[#00F5A0] to-[#00D9F5] rounded-xl text-dark-900 font-bold text-sm shadow-lg shadow-[#00F5A0]/25 hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50">
          {loading ? "Creating..." : "Create Account"}
        </button>

        <p className="text-center text-muted text-sm mt-4">
          Already registered?{" "}
          <Link to="/login" className="text-[#00F5A0] font-semibold hover:underline">Sign In</Link>
        </p>
      </form>
    </div>
  );
}
