import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import api from "../lib/api";

const formatDate = (d) => {
  const now = new Date();
  const date = new Date(d);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const typeIcons = {
  money_received: { icon: "R", color: "bg-[#00F5A0]/15 text-[#00F5A0]" },
  money_sent: { icon: "S", color: "bg-accent-red/15 text-accent-red" },
  request_received: { icon: "!", color: "bg-[#f8b500]/15 text-[#f8b500]" },
  request_accepted: { icon: "+", color: "bg-[#00F5A0]/15 text-[#00F5A0]" },
  request_declined: { icon: "X", color: "bg-accent-red/15 text-accent-red" },
  credit_received: { icon: "+", color: "bg-[#a29bfe]/15 text-[#a29bfe]" },
  welcome: { icon: "W", color: "bg-[#00D9F5]/15 text-[#00D9F5]" },
};

export default function Notifications() {
  const { user, showToast } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadNotifications(); }, []);

  const loadNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data.notifications || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const markAllRead = async () => {
    try {
      await api.markNotificationsRead(null, true);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      showToast("All marked as read");
    } catch (err) { showToast(err.message, "error"); }
  };

  const markRead = async (id) => {
    try {
      await api.markNotificationsRead(id);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
    } catch {}
  };

  if (!user) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen max-w-lg mx-auto pb-10 animate-fade-in">
      <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-dark-900/85 backdrop-blur-lg">
        <button onClick={() => navigate("/dashboard")} className="text-xl text-white">&#8592;</button>
        <h2 className="font-bold text-lg">Notifications</h2>
        {unreadCount > 0 ? (
          <button onClick={markAllRead} className="text-xs text-[#00F5A0] font-semibold">Read All</button>
        ) : <div className="w-12" />}
      </div>

      {unreadCount > 0 && (
        <div className="mx-5 mb-3 px-3 py-2 rounded-xl bg-[#00F5A0]/10 border border-[#00F5A0]/20 text-center">
          <span className="text-sm font-semibold text-[#00F5A0]">{unreadCount} new notification{unreadCount > 1 ? "s" : ""}</span>
        </div>
      )}

      <div className="px-5">
        {loading && <p className="text-muted text-center py-10 text-sm">Loading...</p>}
        {!loading && notifications.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">&#128276;</div>
            <p className="text-muted text-sm">No notifications yet</p>
          </div>
        )}

        <div className="space-y-1">
          {notifications.map((n) => {
            const style = typeIcons[n.type] || typeIcons.welcome;
            return (
              <button key={n._id} onClick={() => { markRead(n._id); if (n.type === "request_received") navigate("/requests"); }}
                className={`w-full flex items-start gap-3 py-3.5 px-1 border-b border-white/[0.03] text-left transition ${
                  !n.isRead ? "bg-white/[0.02]" : ""}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${style.color}`}>
                  {style.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{n.title}</span>
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-[#00F5A0] shrink-0" />}
                  </div>
                  <p className="text-xs text-muted mt-0.5 truncate">{n.message}</p>
                  <span className="text-[11px] text-muted/60">{formatDate(n.createdAt)}</span>
                </div>
                {n.amount && (
                  <span className={`text-sm font-bold shrink-0 ${n.type.includes("received") || n.type.includes("accepted") || n.type === "credit_received" ? "text-[#00F5A0]" : "text-accent-red"}`}>
                    {n.type.includes("sent") ? "-" : "+"}{n.amount} PK
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
