import mongoose from "mongoose";

const paymentRequestSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 0.01 },
    note: { type: String, trim: true, maxlength: 200, default: "" },
    status: { type: String, enum: ["pending", "accepted", "declined", "cancelled"], default: "pending" },
    transaction: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },
  },
  { timestamps: true }
);

paymentRequestSchema.index({ to: 1, status: 1 });
paymentRequestSchema.index({ from: 1, createdAt: -1 });

export default mongoose.models.PaymentRequest || mongoose.model("PaymentRequest", paymentRequestSchema);
