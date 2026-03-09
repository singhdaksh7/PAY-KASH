import connectDB from "../_lib/db.mjs";
import Transaction from "../_lib/models/Transaction.mjs";
import User from "../_lib/models/User.mjs"; // needed for populate
import { getAuthUser, handleCors, sendError } from "../_lib/auth.mjs";

export default async function handler(req, res) {
  if (handleCors(req, res, ["GET"])) return;
  if (req.method !== "GET") return sendError(res, 405, "Method not allowed");

  const user = await getAuthUser(req);
  if (!user) return sendError(res, 401, "Not authorized");

  try {
    await connectDB();
    const { page = 1, limit = 20, type = "all", startDate, endDate } = req.query;
    const userId = user._id;

    let query = {};
    if (type === "sent") query.from = userId;
    else if (type === "received") query.to = userId;
    else query.$or = [{ from: userId }, { to: userId }];

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate("from", "name email avatar")
        .populate("to", "name email avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Transaction.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      transactions,
    });
  } catch (err) {
    console.error("History error:", err);
    sendError(res, 500, "Server error");
  }
}
