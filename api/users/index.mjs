import connectDB from "../_lib/db.mjs";
import User from "../_lib/models/User.mjs";
import { getAuthUser, handleCors, sendError } from "../_lib/auth.mjs";

export default async function handler(req, res) {
  if (handleCors(req, res, ["GET"])) return;
  if (req.method !== "GET") return sendError(res, 405, "Method not allowed");

  const user = await getAuthUser(req);
  if (!user) return sendError(res, 401, "Not authorized");

  try {
    await connectDB();
    const { search = "" } = req.query;

    let query = { _id: { $ne: user._id }, role: "user", isActive: true };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query).select("name email avatar").sort({ name: 1 }).limit(20);
    res.status(200).json({ success: true, count: users.length, users });
  } catch (err) {
    console.error("Users error:", err);
    sendError(res, 500, "Server error");
  }
}
