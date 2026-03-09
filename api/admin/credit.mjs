import mongoose from "mongoose";
import connectDB from "../_lib/db.mjs";
import User from "../_lib/models/User.mjs";
import Transaction from "../_lib/models/Transaction.mjs";
import { getAuthUser, handleCors, sendError } from "../_lib/auth.mjs";

export default async function handler(req, res) {
  if (handleCors(req, res, ["POST"])) return;
  if (req.method !== "POST") return sendError(res, 405, "Method not allowed");

  const authUser = await getAuthUser(req);
  if (!authUser || authUser.role !== "admin") return sendError(res, 403, "Admin access required");

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await connectDB();
    const { userId, amount, note } = req.body;

    if (!userId || !amount) { await session.abortTransaction(); return sendError(res, 400, "User ID and amount required"); }

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { await session.abortTransaction(); return sendError(res, 400, "Amount must be positive"); }

    const user = await User.findById(userId).session(session);
    if (!user) { await session.abortTransaction(); return sendError(res, 404, "User not found"); }

    const balBefore = user.balance;
    user.balance += amt;
    await user.save({ session, validateModifiedOnly: true });

    await Transaction.create([{
      from: authUser._id, to: user._id, amount: amt,
      note: note || "Admin credit", type: "credit", status: "completed",
      senderBalanceBefore: authUser.balance, senderBalanceAfter: authUser.balance,
      receiverBalanceBefore: balBefore, receiverBalanceAfter: user.balance,
    }], { session });

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: `Credited ${amt} CC to ${user.name}`,
      user: user.toSafe(),
    });
  } catch (err) {
    await session.abortTransaction();
    console.error("Credit error:", err);
    sendError(res, 500, "Server error");
  } finally {
    session.endSession();
  }
}
