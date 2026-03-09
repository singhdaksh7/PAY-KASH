import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 0.01 },
    note: { type: String, trim: true, maxlength: 200, default: "" },
    type: { type: String, enum: ["transfer", "credit", "debit", "welcome_bonus"], default: "transfer" },
    status: { type: String, enum: ["pending", "completed", "failed", "reversed"], default: "completed" },
    referenceId: { type: String, unique: true },
    senderBalanceBefore: Number,
    senderBalanceAfter: Number,
    receiverBalanceBefore: Number,
    receiverBalanceAfter: Number,
  },
  { timestamps: true }
);

transactionSchema.pre("save", function (next) {
  if (!this.referenceId) {
    this.referenceId = `TX-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`.toUpperCase();
  }
  next();
});

transactionSchema.index({ from: 1, createdAt: -1 });
transactionSchema.index({ to: 1, createdAt: -1 });

export default mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);
