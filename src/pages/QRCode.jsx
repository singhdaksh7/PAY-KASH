import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import api from "../lib/api";

// Simple QR code generator using Canvas
function generateQR(canvas, data, size = 200) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  canvas.width = size;
  canvas.height = size;

  // Encode data as a visual pattern (simplified QR-like)
  const encoded = btoa(JSON.stringify(data));
  const grid = 25;
  const cellSize = size / grid;

  ctx.fillStyle = "#0a0f1a";
  ctx.fillRect(0, 0, size, size);

  // Draw QR-like pattern from data
  let hash = 0;
  for (let i = 0; i < encoded.length; i++) {
    hash = ((hash << 5) - hash + encoded.charCodeAt(i)) | 0;
  }

  ctx.fillStyle = "#00F5A0";

  // Position detection patterns (corners)
  const drawFinder = (x, y) => {
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        if (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4)) {
          ctx.fillRect((x + j) * cellSize, (y + i) * cellSize, cellSize, cellSize);
        }
      }
    }
  };

  drawFinder(1, 1);
  drawFinder(grid - 8, 1);
  drawFinder(1, grid - 8);

  // Data modules
  for (let i = 9; i < grid - 1; i++) {
    for (let j = 9; j < grid - 1; j++) {
      const charIdx = ((i * grid + j) + hash) % encoded.length;
      const bit = encoded.charCodeAt(charIdx) % 3;
      if (bit === 0) {
        ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
      }
    }
  }

  // Timing patterns
  for (let i = 8; i < grid - 8; i++) {
    if (i % 2 === 0) {
      ctx.fillRect(i * cellSize, 6 * cellSize, cellSize, cellSize);
      ctx.fillRect(6 * cellSize, i * cellSize, cellSize, cellSize);
    }
  }
}

export default function QRCode() {
  const { user, showToast } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [tab, setTab] = useState("my-qr");
  const [scanInput, setScanInput] = useState("");
  const [scannedUser, setScannedUser] = useState(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tab === "my-qr" && canvasRef.current && user) {
      const qrData = { type: "paykash", userId: user.id, name: user.name, email: user.email };
      generateQR(canvasRef.current, qrData, 220);
    }
  }, [tab, user]);

  const handleScan = () => {
    try {
      const data = JSON.parse(atob(scanInput.trim()));
      if (data.type !== "paykash") throw new Error();
      setScannedUser(data);
      showToast(`Found: ${data.name}`);
    } catch {
      showToast("Invalid QR code data", "error");
    }
  };

  const handlePay = async () => {
    if (!scannedUser || !amount) return;
    setLoading(true);
    try {
      const data = await api.send(scannedUser.userId, amount, note || "QR Payment");
      showToast(data.message);
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
      <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-dark-900/85 backdrop-blur-lg">
        <button onClick={() => navigate("/dashboard")} className="text-xl text-white">&#8592;</button>
        <h2 className="font-bold text-lg">QR Payment</h2>
        <div className="w-8" />
      </div>

      {/* Tabs */}
      <div className="flex mx-5 mb-5 bg-dark-700/50 rounded-xl p-1">
        {["my-qr", "scan"].map((t) => (
          <button key={t} onClick={() => { setTab(t); setScannedUser(null); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
              tab === t ? "bg-[#00F5A0]/15 text-[#00F5A0]" : "text-muted"}`}>
            {t === "my-qr" ? "My QR Code" : "Scan & Pay"}
          </button>
        ))}
      </div>

      {/* My QR Code */}
      {tab === "my-qr" && (
        <div className="px-5 flex flex-col items-center">
          <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 flex flex-col items-center">
            <canvas ref={canvasRef} className="rounded-2xl mb-4" />
            <h3 className="font-bold text-lg">{user.name}</h3>
            <p className="text-muted text-sm">{user.email}</p>
            <p className="text-xs text-muted mt-2">Share this QR code to receive payments</p>
          </div>

          <div className="mt-5 w-full">
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Your QR Data (share this)</label>
            <div className="relative">
              <input readOnly value={btoa(JSON.stringify({ type: "paykash", userId: user.id, name: user.name, email: user.email }))}
                className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-xs font-mono pr-16" />
              <button onClick={() => { navigator.clipboard.writeText(btoa(JSON.stringify({ type: "paykash", userId: user.id, name: user.name, email: user.email }))); showToast("Copied!"); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#00F5A0]/15 text-[#00F5A0] rounded-lg text-xs font-semibold">
                Copy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scan & Pay */}
      {tab === "scan" && !scannedUser && (
        <div className="px-5">
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 text-center mb-5">
            <div className="text-4xl mb-3">&#128247;</div>
            <p className="text-sm text-muted">Paste the QR code data from another user below</p>
          </div>
          <textarea placeholder="Paste QR code data here..." value={scanInput}
            onChange={(e) => setScanInput(e.target.value)} rows={3}
            className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm font-mono mb-4 resize-none" />
          <button onClick={handleScan}
            className="w-full py-3.5 bg-gradient-to-r from-[#a29bfe] to-[#6c5ce7] rounded-xl text-white font-bold text-sm shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-transform">
            Scan QR Data
          </button>
        </div>
      )}

      {/* Pay after scan */}
      {tab === "scan" && scannedUser && (
        <div className="px-5">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00F5A0]/30 to-[#00D9F5]/30 flex items-center justify-center text-xl font-bold text-[#00F5A0] mx-auto mb-2 border border-[#00F5A0]/20">
              {scannedUser.name?.split(" ").map(w => w[0]).join("").slice(0, 2)}
            </div>
            <div className="font-semibold">{scannedUser.name}</div>
            <div className="text-sm text-muted">{scannedUser.email}</div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Amount (PK)</label>
            <input type="number" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-3xl font-bold text-center" />
          </div>

          <div className="flex gap-2 mb-4">
            {[50, 100, 500, 1000].map((a) => (
              <button key={a} onClick={() => setAmount(String(a))}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm font-semibold text-muted hover:text-white transition">
                {a}
              </button>
            ))}
          </div>

          <input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)}
            className="w-full px-4 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm mb-4" />

          <button onClick={handlePay} disabled={loading || !amount}
            className="w-full py-3.5 bg-gradient-to-r from-[#00F5A0] to-[#00D9F5] rounded-xl text-dark-900 font-bold text-sm shadow-lg shadow-[#00F5A0]/25 hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50">
            {loading ? "Sending..." : `Pay ${amount || 0} PK`}
          </button>
          <button onClick={() => setScannedUser(null)}
            className="w-full mt-2 py-3 rounded-xl border border-white/10 text-muted text-sm">
            Scan Again
          </button>
        </div>
      )}
    </div>
  );
}
