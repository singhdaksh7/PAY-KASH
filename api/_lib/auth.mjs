import jwt from "jsonwebtoken";
import User from "./models/User.mjs";
import connectDB from "./db.mjs";

/**
 * Parse & verify JWT from the Authorization header.
 * Returns the user document or null.
 */
export async function getAuthUser(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await connectDB();
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) return null;
    return user;
  } catch {
    return null;
  }
}

/**
 * Standard JSON error response
 */
export function sendError(res, status, message) {
  return res.status(status).json({ success: false, message });
}

/**
 * Handle CORS preflight + method check
 */
export function handleCors(req, res, allowedMethods = ["GET", "POST", "PUT", "DELETE"]) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", allowedMethods.join(",") + ",OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return true;
  }
  return false;
}
