import connectDB from "../_lib/db.mjs";
import User from "../_lib/models/User.mjs";
import { handleCors, sendError } from "../_lib/auth.mjs";

export default async function handler(req, res) {
  if (handleCors(req, res, ["POST"])) return;
  if (req.method !== "POST") return sendError(res, 405, "Method not allowed");

  try {
    await connectDB();
    const { email, pin } = req.body;

    if (!email || !pin) return sendError(res, 400, "Email and PIN are required");

    const user = await User.findOne({ email }).select("+pin");
    if (!user) return sendError(res, 401, "Invalid credentials");
    if (!user.isActive) return sendError(res, 401, "Account deactivated");

    const isMatch = await user.matchPin(pin);
    if (!isMatch) return sendError(res, 401, "Invalid credentials");

    user.lastLogin = new Date();
    await user.save({ validateModifiedOnly: true });

    const token = user.generateToken();
    res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name.split(" ")[0]}!`,
      token,
      user: user.toSafe(),
    });
  } catch (err) {
    console.error("Login error:", err);
    sendError(res, 500, "Server error");
  }
}
