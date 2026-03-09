import connectDB from "../_lib/db.mjs";
import User from "../_lib/models/User.mjs";
import { getAuthUser, handleCors, sendError } from "../_lib/auth.mjs";

export default async function handler(req, res) {
  if (handleCors(req, res, ["PUT"])) return;
  if (req.method !== "PUT") return sendError(res, 405, "Method not allowed");

  const user = await getAuthUser(req);
  if (!user) return sendError(res, 401, "Not authorized");

  try {
    await connectDB();
    const { name, avatar, currentPin, newPin } = req.body;

    const dbUser = await User.findById(user._id).select("+pin");

    if (name) dbUser.name = name.trim();
    if (avatar) dbUser.avatar = avatar.trim().toUpperCase().slice(0, 2);

    if (newPin) {
      if (!currentPin) return sendError(res, 400, "Current PIN required to change PIN");
      const isMatch = await dbUser.matchPin(currentPin);
      if (!isMatch) return sendError(res, 400, "Current PIN is incorrect");
      if (newPin.length < 4) return sendError(res, 400, "New PIN must be at least 4 digits");
      dbUser.pin = newPin;
    }

    await dbUser.save();

    res.status(200).json({
      success: true,
      message: newPin ? "Profile and PIN updated" : "Profile updated",
      user: dbUser.toSafe(),
    });
  } catch (err) {
    console.error("Profile update error:", err);
    sendError(res, 500, "Server error");
  }
}
