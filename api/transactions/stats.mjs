import connectDB from "../_lib/db.mjs";
import Transaction from "../_lib/models/Transaction.mjs";
import { getAuthUser, handleCors, sendError } from "../_lib/auth.mjs";

export default async function handler(req, res) {
  if (handleCors(req, res, ["GET"])) return;
  if (req.method !== "GET") return sendError(res, 405, "Method not allowed");

  const user = await getAuthUser(req);
  if (!user) return sendError(res, 401, "Not authorized");

  try {
    await connectDB();
    const userId = user._id;

    const [sentStats, receivedStats] = await Promise.all([
      Transaction.aggregate([
        { $match: { from: userId, status: "completed" } },
        { $group: { _id: null, totalAmount: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      Transaction.aggregate([
        { $match: { to: userId, status: "completed" } },
        { $group: { _id: null, totalAmount: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        sent: sentStats[0] || { totalAmount: 0, count: 0 },
        received: receivedStats[0] || { totalAmount: 0, count: 0 },
      },
    });
  } catch (err) {
    console.error("Stats error:", err);
    sendError(res, 500, "Server error");
  }
}
