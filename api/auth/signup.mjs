import connectDB from "../_lib/db.mjs";
import User from "../_lib/models/User.mjs";
import Transaction from "../_lib/models/Transaction.mjs";
import { handleCors, sendError } from "../_lib/auth.mjs";

export default async function handler(req, res) {
  if (handleCors(req, res, ["POST"])) return;
  if (req.method !== "POST") return sendError(res, 405, "Method not allowed");

  try {
    await connectDB();
    const { name, email, pin } = req.body;

    if (!name || !email || !pin) return sendError(res, 400, "Name, email, and PIN are required");
    if (pin.length < 4) return sendError(res, 400, "PIN must be at least 4 digits");

    const exists = await User.findOne({ email });
    if (exists) return sendError(res, 400, "Email already registered");

    const BONUS = 1000;
    const user = await User.create({ name, email, pin, balance: BONUS, lastLogin: new Date() });

    // Welcome bonus transaction
    const admin = await User.findOne({ role: "admin" });
    if (admin) {
      await Transaction.create({
        from: admin._id,
        to: user._id,
        amount: BONUS,
        note: "Welcome bonus",
        type: "welcome_bonus",
        senderBalanceBefore: admin.balance,
        senderBalanceAfter: admin.balance - BONUS,
        receiverBalanceBefore: 0,
        receiverBalanceAfter: BONUS,
      });
      admin.balance -= BONUS;
      await admin.save({ validateModifiedOnly: true });
    }

    const token = user.generateToken();
    res.status(201).json({
      success: true,
      message: `Account created! ${BONUS} CC welcome bonus added.`,
      token,
      user: user.toSafe(),
    });
  } catch (err) {
    console.error("Signup error:", err);
    if (err.code === 11000) return sendError(res, 400, "Email already registered");
    sendError(res, 500, "Server error");
  }
}
