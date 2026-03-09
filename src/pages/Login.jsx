import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, showToast } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(email, pin);
      navigate(data.user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5 relative">
      {/* Background particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="absolute rounded-full bg-[#00F5A0]/10 animate-float"
            style={{
              left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
              width: Math.random() * 4 + 1, height: Math.random() * 4 + 1,
              animationDelay: `${Math.random() * -20}s`, animationDuration: `${Math.random() * 15 + 15}s`,
            }} />
        ))}
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm p-8 bg-dark-800/80 backdrop-blur-xl rounded-3xl border border-white/5 relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block mb-3">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="11" stroke="#00F5A0" strokeWidth="2" />
              <text x="12" y="17" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#00F5A0">C</text>
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">PAY-KASH</h1>
          <p className="text-muted text-sm mt-1">Your digital campus currency</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Email</label>
            <input type="email" placeholder="you@campus.edu" value={email}
              onChange={(e) => setEmail(e.target.value)} required
              className="w-full px-4 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">PIN</label>
            <input type="password" placeholder="Your PIN" value={pin} maxLength={6}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} required
              className="w-full px-4 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm" />
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full mt-6 py-3.5 bg-gradient-to-r from-[#00F5A0] to-[#00D9F5] rounded-xl text-dark-900 font-bold text-sm shadow-lg shadow-[#00F5A0]/25 hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50">
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <p className="text-center text-muted text-sm mt-4">
          Don't have an account?{" "}
          <Link to="/signup" className="text-[#00F5A0] font-semibold hover:underline">Create one</Link>
        </p>

        <div className="mt-5 p-3 bg-[#00F5A0]/5 rounded-xl border border-[#00F5A0]/10 text-xs text-muted leading-relaxed">
          <strong className="text-white">Demo:</strong> aarav@campus.edu / PIN 1234<br />
          Admin: admin@campus.edu / PIN 000000
        </div>
      </form>
    </div>
  );
}
