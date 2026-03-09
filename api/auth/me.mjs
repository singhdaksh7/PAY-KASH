import connectDB from "../_lib/db.mjs";
import { getAuthUser, handleCors, sendError } from "../_lib/auth.mjs";

export default async function handler(req, res) {
  if (handleCors(req, res, ["GET"])) return;
  if (req.method !== "GET") return sendError(res, 405, "Method not allowed");

  const user = await getAuthUser(req);
  if (!user) return sendError(res, 401, "Not authorized");

  res.status(200).json({ success: true, user: user.toSafe() });
}
