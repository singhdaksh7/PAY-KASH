import mongoose from "mongoose";
import connectDB from "../_lib/db.mjs";
import User from "../_lib/models/User.mjs";
import Transaction from "../_lib/models/Transaction.mjs";
import { getAuthUser, handleCors, sendError } from "../_lib/auth.mjs";
import { createNotification } from "../_lib/notify.mjs";

export default async function handler(req, res) {
  if (handleCors(req, res, ["POST"])) return;
  if (req.method !== "POST") return sendError(res, 405, "Method not allowed");

  const authUser = await getAuthUser(req);
  if (!authUser) return sendError(res, 401, "Not authorized");

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await connectDB();
    const { toUserId, amount, note } = req.body;

    if (!toUserId || !amount) {
      await session.abortTransaction();
      return sendError(res, 400, "Recipient and amount required");
    }

    const txAmount = parseFloat(amount);
    if (isNaN(txAmount) || txAmount <= 0) {
      await session.abortTransaction();
      return sendError(res, 400, "Amount must be positive");
    }
    if (txAmount > 50000) {
      await session.abortTransaction();
      return sendError(res, 400, "Max transaction limit is 50,000 PK");
    }
    if (authUser._id.toString() === toUserId) {
      await session.abortTransaction();
      return sendError(res, 400, "Cannot send to yourself");
    }

    const sender = await User.findById(authUser._id).session(session);
    const receiver = await User.findById(toUserId).session(session);

    if (!receiver) { await session.abortTransaction(); return sendError(res, 404, "Recipient not found"); }
    if (!receiver.isActive) { await session.abortTransaction(); return sendError(res, 400, "Recipient is inactive"); }
    if (sender.balance < txAmount) { await session.abortTransaction(); return sendError(res, 400, `Insufficient balance. You have ${sender.balance} PK`); }

    const sBefore = sender.balance, rBefore = receiver.balance;
    sender.balance -= txAmount;
    receiver.balance += txAmount;

    await sender.save({ session, validateModifiedOnly: true });
    await receiver.save({ session, validateModifiedOnly: true });

    const tx = await Transaction.create([{
      from: sender._id, to: receiver._id, amount: txAmount,
      note: note || "", type: "transfer", status: "completed",
      senderBalanceBefore: sBefore, senderBalanceAfter: sender.balance,
      receiverBalanceBefore: rBefore, receiverBalanceAfter: receiver.balance,
    }], { session });

    await session.commitTransaction();

    createNotification({
      user: receiver._id, type: "money_received",
      title: "Money Received",
      message: `${sender.name} sent you ${txAmount} PK`,
      relatedUser: sender._id, relatedTransaction: tx[0]._id, amount: txAmount,
    });
    createNotification({
      user: sender._id, type: "money_sent",
      title: "Money Sent",
      message: `You sent ${txAmount} PK to ${receiver.name}`,
      relatedUser: receiver._id, relatedTransaction: tx[0]._id, amount: txAmount,
    });

    res.status(200).json({
      success: true,
      message: `Sent ${txAmount} PK to ${receiver.name}`,
      transaction: {
        id: tx[0]._id, referenceId: tx[0].referenceId,
        amount: txAmount, to: receiver.toSafe(), note: note || "",
        createdAt: tx[0].createdAt,
      },
      newBalance: sender.balance,
    });
  } catch (err) {
    await session.abortTransaction();
    console.error("Send error:", err);
    sendError(res, 500, "Transfer failed");
  } finally {
    session.endSession();
  }
}
