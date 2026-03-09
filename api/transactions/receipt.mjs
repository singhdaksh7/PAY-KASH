import connectDB from "../_lib/db.mjs";
import Transaction from "../_lib/models/Transaction.mjs";
import User from "../_lib/models/User.mjs";
import { getAuthUser, handleCors, sendError } from "../_lib/auth.mjs";

export default async function handler(req, res) {
  if (handleCors(req, res, ["GET"])) return;
  if (req.method !== "GET") return sendError(res, 405, "Method not allowed");

  const user = await getAuthUser(req);
  if (!user) return sendError(res, 401, "Not authorized");

  try {
    await connectDB();
    const { id } = req.query;
    if (!id) return sendError(res, 400, "Transaction ID required");

    const tx = await Transaction.findById(id)
      .populate("from", "name email avatar")
      .populate("to", "name email avatar");

    if (!tx) return sendError(res, 404, "Transaction not found");

    const userId = user._id.toString();
    if (tx.from._id.toString() !== userId && tx.to._id.toString() !== userId) {
      return sendError(res, 403, "Not your transaction");
    }

    res.status(200).json({ success: true, transaction: tx });
  } catch (err) {
    console.error("Receipt error:", err);
    sendError(res, 500, "Server error");
  }
}
