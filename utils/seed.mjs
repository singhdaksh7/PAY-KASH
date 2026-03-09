/**
 * PAY-KASH Database Seeder
 *
 * Run: node utils/seed.mjs
 *
 * Set MONGO_URI env variable or it defaults to localhost.
 * Use this to seed your MongoDB Atlas database before deploying.
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/pay-kash";

// ── Define schemas inline (so we don't need to resolve module paths) ──
const userSchema = new mongoose.Schema({
  name: String, email: { type: String, unique: true, lowercase: true },
  pin: String, avatar: String, balance: { type: Number, default: 0 },
  role: { type: String, default: "user" }, isActive: { type: Boolean, default: true },
  lastLogin: Date,
}, { timestamps: true });

const txSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  to: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  amount: Number, note: { type: String, default: "" },
  type: { type: String, default: "transfer" },
  status: { type: String, default: "completed" },
  referenceId: String,
  senderBalanceBefore: Number, senderBalanceAfter: Number,
  receiverBalanceBefore: Number, receiverBalanceAfter: Number,
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
const Transaction = mongoose.model("Transaction", txSchema);

const hashPin = async (pin) => bcrypt.hash(pin, 10);

const users = [
  { name: "Admin", email: "admin@campus.edu", pin: "000000", balance: 100000, role: "admin", avatar: "AD" },
  { name: "Aarav Sharma", email: "aarav@campus.edu", pin: "1234", balance: 5000, avatar: "AS" },
  { name: "Priya Patel", email: "priya@campus.edu", pin: "1234", balance: 3200, avatar: "PP" },
  { name: "Rohan Gupta", email: "rohan@campus.edu", pin: "1234", balance: 7800, avatar: "RG" },
  { name: "Sneha Reddy", email: "sneha@campus.edu", pin: "1234", balance: 1500, avatar: "SR" },
  { name: "Vikram Singh", email: "vikram@campus.edu", pin: "1234", balance: 4400, avatar: "VS" },
  { name: "Ananya Iyer", email: "ananya@campus.edu", pin: "1234", balance: 2800, avatar: "AI" },
  { name: "Karan Malhotra", email: "karan@campus.edu", pin: "1234", balance: 6100, avatar: "KM" },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("📦 Connected to MongoDB");

    await User.deleteMany({});
    await Transaction.deleteMany({});
    console.log("🗑️  Cleared old data");

    // Hash PINs before inserting
    const usersWithHashedPins = await Promise.all(
      users.map(async (u) => ({ ...u, pin: await hashPin(u.pin) }))
    );

    const created = await User.insertMany(usersWithHashedPins);
    console.log(`👥 Created ${created.length} users`);

    const map = {};
    created.forEach((u) => { map[u.email.split("@")[0]] = u; });

    const txs = [
      { from: map.aarav._id, to: map.priya._id, amount: 500, note: "Lunch money" },
      { from: map.rohan._id, to: map.aarav._id, amount: 1200, note: "Project supplies" },
      { from: map.priya._id, to: map.sneha._id, amount: 300, note: "Coffee" },
      { from: map.vikram._id, to: map.rohan._id, amount: 2000, note: "Event tickets" },
      { from: map.ananya._id, to: map.karan._id, amount: 750, note: "Birthday gift" },
      { from: map.karan._id, to: map.vikram._id, amount: 1500, note: "Lab equipment" },
      { from: map.sneha._id, to: map.ananya._id, amount: 200, note: "Notes printout" },
    ].map((t) => ({
      ...t, type: "transfer", status: "completed",
      referenceId: `TX-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`.toUpperCase(),
    }));

    await Transaction.insertMany(txs);
    console.log(`💸 Created ${txs.length} transactions`);

    console.log("\n✅ Seeded successfully!\n");
    console.log("Credentials:");
    console.log("  Admin:  admin@campus.edu  / 000000");
    console.log("  Users:  aarav@campus.edu  / 1234");
    console.log("          priya@campus.edu  / 1234");
    console.log("          (and others...)\n");

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

seed();
