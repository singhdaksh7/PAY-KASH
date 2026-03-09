import mongoose from "mongoose";
import connectDB from "../_lib/db.mjs";
import User from "../_lib/models/User.mjs";
import Transaction from "../_lib/models/Transaction.mjs";
import PaymentRequest from "../_lib/models/PaymentRequest.mjs";
import { getAuthUser, handleCors, sendError } from "../_lib/auth.mjs";
import { createNotification } from "../_lib/notify.mjs";

export default async function handler(req, res) {
  if (handleCors(req, res, ["GET", "POST", "PUT"])) return;

  const user = await getAuthUser(req);
  if (!user) return sendError(res, 401, "Not authorized");

  await connectDB();

  // GET - list requests (sent and received)
  if (req.method === "GET") {
    try {
      const [sent, received] = await Promise.all([
        PaymentRequest.find({ from: user._id }).populate("to", "name email avatar").sort({ createdAt: -1 }).limit(30),
        PaymentRequest.find({ to: user._id }).populate("from", "name email avatar").sort({ createdAt: -1 }).limit(30),
      ]);
      return res.status(200).json({ success: true, sent, received });
    } catch (err) {
      console.error("Requests error:", err);
      return sendError(res, 500, "Server error");
    }
  }

  // POST - create a new request
  if (req.method === "POST") {
    try {
      const { toUserId, amount, note } = req.body;
      if (!toUserId || !amount) return sendError(res, 400, "Recipient and amount required");

      const amt = parseFloat(amount);
      if (isNaN(amt) || amt <= 0) return sendError(res, 400, "Amount must be positive");
      if (user._id.toString() === toUserId) return sendError(res, 400, "Cannot request from yourself");

      const target = await User.findById(toUserId);
      if (!target) return sendError(res, 404, "User not found");

      const request = await PaymentRequest.create({
        from: user._id, to: target._id, amount: amt, note: note || "",
      });

      createNotification({
        user: target._id, type: "request_received",
        title: "Payment Request",
        message: `${user.name} is requesting ${amt} PK from you`,
        relatedUser: user._id, amount: amt,
      });

      return res.status(201).json({ success: true, message: `Requested ${amt} PK from ${target.name}`, request });
    } catch (err) {
      console.error("Create request error:", err);
      return sendError(res, 500, "Server error");
    }
  }

  // PUT - accept or decline a request
  if (req.method === "PUT") {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { requestId, action } = req.body;
      if (!requestId || !["accept", "decline"].includes(action)) {
        await session.abortTransaction();
        return sendError(res, 400, "Request ID and action (accept/decline) required");
      }

      const request = await PaymentRequest.findById(requestId).session(session);
      if (!request) { await session.abortTransaction(); return sendError(res, 404, "Request not found"); }
      if (request.to.toString() !== user._id.toString()) { await session.abortTransaction(); return sendError(res, 403, "Not your request"); }
      if (request.status !== "pending") { await session.abortTransaction(); return sendError(res, 400, "Request already processed"); }

      if (action === "decline") {
        request.status = "declined";
        await request.save({ session });
        await session.commitTransaction();

        const requester = await User.findById(request.from);
        createNotification({
          user: request.from, type: "request_declined",
          title: "Request Declined",
          message: `${user.name} declined your request for ${request.amount} PK`,
          relatedUser: user._id, amount: request.amount,
        });

        return res.status(200).json({ success: true, message: "Request declined" });
      }

      // Accept - transfer money
      const payer = await User.findById(user._id).session(session);
      const requester = await User.findById(request.from).session(session);

      if (payer.balance < request.amount) {
        await session.abortTransaction();
        return sendError(res, 400, `Insufficient balance. You have ${payer.balance} PK`);
      }

      const pBefore = payer.balance, rBefore = requester.balance;
      payer.balance -= request.amount;
      requester.balance += request.amount;

      await payer.save({ session, validateModifiedOnly: true });
      await requester.save({ session, validateModifiedOnly: true });

      const tx = await Transaction.create([{
        from: payer._id, to: requester._id, amount: request.amount,
        note: request.note || "Payment request", type: "transfer", status: "completed",
        senderBalanceBefore: pBefore, senderBalanceAfter: payer.balance,
        receiverBalanceBefore: rBefore, receiverBalanceAfter: requester.balance,
      }], { session });

      request.status = "accepted";
      request.transaction = tx[0]._id;
      await request.save({ session });

      await session.commitTransaction();

      createNotification({
        user: request.from, type: "request_accepted",
        title: "Request Accepted",
        message: `${user.name} paid your request of ${request.amount} PK`,
        relatedUser: user._id, relatedTransaction: tx[0]._id, amount: request.amount,
      });
      createNotification({
        user: user._id, type: "money_sent",
        title: "Request Paid",
        message: `You paid ${request.amount} PK to ${requester.name}`,
        relatedUser: requester._id, relatedTransaction: tx[0]._id, amount: request.amount,
      });

      return res.status(200).json({ success: true, message: `Paid ${request.amount} PK to ${requester.name}` });
    } catch (err) {
      await session.abortTransaction();
      console.error("Request action error:", err);
      return sendError(res, 500, "Server error");
    } finally {
      session.endSession();
    }
  }

  return sendError(res, 405, "Method not allowed");
}
