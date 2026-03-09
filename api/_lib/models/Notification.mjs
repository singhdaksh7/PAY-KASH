import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["money_received", "money_sent", "request_received", "request_accepted", "request_declined", "credit_received", "welcome"],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    relatedUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    relatedTransaction: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },
    amount: { type: Number },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });

export default mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
