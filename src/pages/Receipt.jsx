import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import api from "../lib/api";

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function Receipt() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tx, setTx] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = searchParams.get("id");
    if (!id) { navigate("/history"); return; }
    api.getReceipt(id)
      .then((data) => setTx(data.transaction))
      .catch(() => navigate("/history"))
      .finally(() => setLoading(false));
  }, [searchParams]);

  const handleDownload = () => {
    if (!tx) return;
    const isSent = tx.from?._id === user.id;
    const content = `
PAY-KASH - Transaction Receipt
================================

Reference ID: ${tx.referenceId}
Date: ${formatDate(tx.createdAt)}
Type: ${tx.type.replace("_", " ").toUpperCase()}
Status: ${tx.status.toUpperCase()}

From: ${tx.from?.name} (${tx.from?.email})
To: ${tx.to?.name} (${tx.to?.email})

Amount: ${tx.amount.toLocaleString()} PK (Rs.${tx.amount.toLocaleString()} INR)
${tx.note ? `Note: ${tx.note}` : ""}

${isSent ? `Balance Before: ${tx.senderBalanceBefore?.toLocaleString()} PK` : `Balance Before: ${tx.receiverBalanceBefore?.toLocaleString()} PK`}
${isSent ? `Balance After: ${tx.senderBalanceAfter?.toLocaleString()} PK` : `Balance After: ${tx.receiverBalanceAfter?.toLocaleString()} PK`}

================================
This is a computer-generated receipt.
PAY-KASH - Digital Campus Currency
    `.trim();

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PAY-KASH-Receipt-${tx.referenceId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!user) return null;
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted">Loading...</div>;
  if (!tx) return null;

  const isSent = tx.from?._id === user.id;
  const otherUser = isSent ? tx.to : tx.from;

  return (
    <div className="min-h-screen max-w-lg mx-auto pb-10 animate-fade-in">
      <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-dark-900/85 backdrop-blur-lg">
        <button onClick={() => navigate(-1)} className="text-xl text-white">&#8592;</button>
        <h2 className="font-bold text-lg">Receipt</h2>
        <button onClick={handleDownload} className="px-3 py-1.5 bg-[#00F5A0]/15 text-[#00F5A0] rounded-lg text-xs font-semibold">
          Download
        </button>
      </div>

      <div className="mx-5 mt-4">
        {/* Receipt Card */}
        <div className="rounded-3xl bg-white/[0.03] border border-white/5 overflow-hidden">
          {/* Top section */}
          <div className={`p-6 text-center ${isSent ? "bg-accent-red/5" : "bg-[#00F5A0]/5"}`}>
            <div className={`inline-flex w-14 h-14 rounded-2xl items-center justify-center text-xl font-bold mb-3 ${
              isSent ? "bg-accent-red/15 text-accent-red" : "bg-[#00F5A0]/15 text-[#00F5A0]"}`}>
              {isSent ? "S" : "R"}
            </div>
            <div className={`text-3xl font-extrabold ${isSent ? "text-accent-red" : "text-[#00F5A0]"}`}>
              {isSent ? "-" : "+"}{tx.amount.toLocaleString()} PK
            </div>
            <p className="text-sm text-muted mt-1">Rs.{tx.amount.toLocaleString()} INR</p>
            <div className="inline-block mt-2 px-3 py-1 rounded-full bg-[#00F5A0]/10 text-[#00F5A0] text-xs font-semibold uppercase">
              {tx.status}
            </div>
          </div>

          {/* Details */}
          <div className="p-6 space-y-4">
            {[
              ["Reference ID", tx.referenceId],
              ["Date", formatDate(tx.createdAt)],
              ["Type", tx.type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())],
              [isSent ? "To" : "From", otherUser?.name],
              ["Email", otherUser?.email],
              ...(tx.note ? [["Note", tx.note]] : []),
              [isSent ? "Balance Before" : "Balance Before",
               `${(isSent ? tx.senderBalanceBefore : tx.receiverBalanceBefore)?.toLocaleString()} PK`],
              [isSent ? "Balance After" : "Balance After",
               `${(isSent ? tx.senderBalanceAfter : tx.receiverBalanceAfter)?.toLocaleString()} PK`],
            ].map(([label, value], i) => (
              <div key={i} className="flex justify-between items-center py-1.5 border-b border-white/[0.04] last:border-0">
                <span className="text-sm text-muted">{label}</span>
                <span className="text-sm font-semibold text-right max-w-[60%] truncate">{value}</span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-white/[0.02] border-t border-white/5 text-center">
            <p className="text-xs text-muted">PAY-KASH - Digital Campus Currency</p>
            <p className="text-[10px] text-muted/60 mt-0.5">This is a computer-generated receipt</p>
          </div>
        </div>
      </div>
    </div>
  );
}
