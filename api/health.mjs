export default function handler(req, res) {
  res.status(200).json({
    success: true,
    message: "PAY-KASH API is running on Vercel",
    timestamp: new Date().toISOString(),
    currency: { name: "PAY-KASH", symbol: "PK", rate: "1 PK = ₹1 INR" },
  });
}
