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
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [transactions, total] = await Promise.all([
      Transaction.find({})
        .populate("from", "name email avatar")
        .populate("to", "name email avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Transaction.countDocuments({}),
    ]);

    res.status(200).json({
      success: true, count: transactions.length, total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page), transactions,
    });
  } catch (err) {
    console.error("Admin tx error:", err);
    sendError(res, 500, "Server error");
  }
}
