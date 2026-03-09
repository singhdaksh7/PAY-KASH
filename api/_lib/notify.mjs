import Notification from "./models/Notification.mjs";

export async function createNotification({ user, type, title, message, relatedUser, relatedTransaction, amount }) {
  try {
    await Notification.create({ user, type, title, message, relatedUser, relatedTransaction, amount });
  } catch (err) {
    console.error("Notification create error:", err);
  }
}
