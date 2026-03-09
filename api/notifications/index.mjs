import connectDB from "../_lib/db.mjs";
import Notification from "../_lib/models/Notification.mjs";
import User from "../_lib/models/User.mjs";
import { getAuthUser, handleCors, sendError } from "../_lib/auth.mjs";

export default async function handler(req, res) {
  if (handleCors(req, res, ["GET", "PUT"])) return;

  const user = await getAuthUser(req);
  if (!user) return sendError(res, 401, "Not authorized");

  await connectDB();

  if (req.method === "GET") {
    try {
      const notifications = await Notification.find({ user: user._id })
        .populate("relatedUser", "name avatar")
        .sort({ createdAt: -1 })
        .limit(50);
      const unreadCount = await Notification.countDocuments({ user: user._id, isRead: false });
      return res.status(200).json({ success: true, notifications, unreadCount });
    } catch (err) {
      console.error("Notifications error:", err);
      return sendError(res, 500, "Server error");
    }
  }

  if (req.method === "PUT") {
    try {
      const { notificationId, markAll } = req.body;
      if (markAll) {
        await Notification.updateMany({ user: user._id, isRead: false }, { isRead: true });
      } else if (notificationId) {
        await Notification.findOneAndUpdate({ _id: notificationId, user: user._id }, { isRead: true });
      }
      return res.status(200).json({ success: true, message: "Marked as read" });
    } catch (err) {
      console.error("Notifications update error:", err);
      return sendError(res, 500, "Server error");
    }
  }

  return sendError(res, 405, "Method not allowed");
}
