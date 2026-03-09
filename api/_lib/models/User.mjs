import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 50 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    pin: { type: String, required: true, minlength: 4, select: false },
    avatar: { type: String, default: "" },
    balance: { type: Number, default: 0, min: 0 },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("pin")) return next();
  this.pin = await bcrypt.hash(this.pin, 10);
  next();
});

userSchema.pre("save", function (next) {
  if (!this.avatar && this.name) {
    this.avatar = this.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  }
  next();
});

userSchema.methods.matchPin = async function (entered) {
  return bcrypt.compare(entered, this.pin);
};

userSchema.methods.generateToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

userSchema.methods.toSafe = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    avatar: this.avatar,
    balance: this.balance,
    role: this.role,
    isActive: this.isActive,
    createdAt: this.createdAt,
    lastLogin: this.lastLogin,
  };
};

export default mongoose.models.User || mongoose.model("User", userSchema);
