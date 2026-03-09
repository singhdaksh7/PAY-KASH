import connectDB from "../_lib/db.mjs";
import User from "../_lib/models/User.mjs";
import Transaction from "../_lib/models/Transaction.mjs";
import { getAuthUser, handleCors, sendError } from "../_lib/auth.mjs";

export default async function handler(req, res) {
  if (handleCors(req, res, ["GET"])) return;
  if (req.method !== "GET") return sendError(res, 405, "Method not allowed");

  const user = await getAuthUser(req);
  if (!user || user.role !== "admin") return sendError(res, 403, "Admin access required");

  try {
    await connectDB();

    const [totalUsers, totalTxs, volumeStats, circulation, topUsers, allUsers] = await Promise.all([
      User.countDocuments({ role: "user" }),
      Transaction.countDocuments({ status: "completed" }),
      Transaction.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, totalVolume: { $sum: "$amount" }, avg: { $avg: "$amount" } } },
      ]),
      User.aggregate([{ $match: { role: "user" } }, { $group: { _id: null, total: { $sum: "$balance" } } }]),
      User.find({ role: "user" }).sort({ balance: -1 }).limit(5).select("name email avatar balance"),
      User.find({ role: "user" }).sort({ createdAt: -1 }).select("name email avatar balance isActive createdAt"),
    ]);

    res.status(200).json({
      success: true,
      dashboard: {
        totalUsers,
        totalTransactions: totalTxs,
        totalVolume: volumeStats[0]?.totalVolume || 0,
        avgTransaction: volumeStats[0]?.avg || 0,
        totalCirculation: circulation[0]?.total || 0,
        topUsers,
        allUsers: allUsers.map((u) => u.toSafe()),
      },
    });
  } catch (err) {
    console.error("Admin dashboard error:", err);
    sendError(res, 500, "Server error");
  }
}
