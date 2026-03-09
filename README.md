# 🪙 PAY-KASH — Deploy to Vercel

Full-stack digital campus currency app. **1 PK Coin = ₹1 INR.**
React frontend + Vercel Serverless API + MongoDB Atlas.

---

## 🚀 Step-by-Step Deployment Guide

### STEP 1: Create a Free MongoDB Atlas Database

1. Go to **https://mongodb.com/atlas** → Sign up (free)
2. Click **"Build a Database"** → Choose **M0 FREE** tier
3. Pick a region close to you (e.g., Mumbai `ap-south-1`)
4. Set a **username** and **password** (remember these!)
5. Under **Network Access** → Click **"Add IP Address"** → Choose **"Allow Access from Anywhere"** (0.0.0.0/0)
   - This is needed so Vercel's serverless functions can connect
6. Go to **Database** → Click **"Connect"** → Choose **"Drivers"**
7. Copy the connection string — it looks like:
   ```
   mongodb+srv://youruser:yourpassword@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority
   ```
8. Add `/pay-kash` before the `?` to specify the database name:
   ```
   mongodb+srv://youruser:yourpassword@cluster0.abc123.mongodb.net/pay-kash?retryWrites=true&w=majority
   ```

---

### STEP 2: Seed the Database

Before deploying, populate the database with demo users:

```bash
cd PAY-KASH

# Install dependencies
npm install

# Set your MongoDB URI temporarily
export MONGO_URI="mongodb+srv://youruser:yourpass@cluster0.abc123.mongodb.net/pay-kash?retryWrites=true&w=majority"

# Run the seed script
node utils/seed.mjs
```

You should see:
```
📦 Connected to MongoDB
🗑️  Cleared old data
👥 Created 8 users
💸 Created 7 transactions
✅ Seeded successfully!
```

---

### STEP 3: Push to GitHub

```bash
# Initialize git
git init
git add .
git commit -m "PAY-KASH - initial commit"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/pay-kash.git
git branch -M main
git push -u origin main
```

---

### STEP 4: Deploy to Vercel

1. Go to **https://vercel.com** → Sign up with GitHub
2. Click **"Add New → Project"**
3. Import your **pay-kash** repository
4. Vercel auto-detects Vite — leave the defaults:
   - Framework: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. **⚠️ IMPORTANT** — Click **"Environment Variables"** and add:

   | Key          | Value                                              |
   |--------------|----------------------------------------------------|
   | `MONGO_URI`  | `mongodb+srv://user:pass@cluster.mongodb.net/pay-kash?retryWrites=true&w=majority` |
   | `JWT_SECRET` | `any_long_random_string_here_make_it_strong`       |

6. Click **"Deploy"**
7. Wait ~1 minute → Your app is live! 🎉

---

### STEP 5: Test Your Live App

1. Visit your Vercel URL (e.g., `https://pay-kash-xyz.vercel.app`)
2. Login with demo credentials:
   - **User:** `aarav@campus.edu` / PIN: `1234`
   - **Admin:** `admin@campus.edu` / PIN: `000000`
3. Try sending coins between users!

---

## 📁 Project Structure

```
PAY-KASH/
├── api/                          # ← Vercel Serverless Functions
│   ├── _lib/                     #    Shared code (not exposed as routes)
│   │   ├── auth.mjs              #    JWT verification helper
│   │   ├── db.mjs                #    MongoDB connection (cached)
│   │   └── models/
│   │       ├── User.mjs          #    User schema
│   │       └── Transaction.mjs   #    Transaction schema
│   ├── health.mjs                # GET  /api/health
│   ├── auth/
│   │   ├── login.mjs             # POST /api/auth/login
│   │   ├── signup.mjs            # POST /api/auth/signup
│   │   └── me.mjs                # GET  /api/auth/me
│   ├── transactions/
│   │   ├── send.mjs              # POST /api/transactions/send
│   │   ├── history.mjs           # GET  /api/transactions/history
│   │   └── stats.mjs             # GET  /api/transactions/stats
│   ├── users/
│   │   └── index.mjs             # GET  /api/users
│   └── admin/
│       ├── dashboard.mjs         # GET  /api/admin/dashboard
│       ├── credit.mjs            # POST /api/admin/credit
│       └── transactions.mjs      # GET  /api/admin/transactions
│
├── src/                          # ← React Frontend (Vite)
│   ├── components/
│   │   └── Toast.jsx
│   ├── lib/
│   │   ├── api.js                #    API client
│   │   └── AuthContext.jsx        #    Auth state management
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Send.jsx
│   │   ├── History.jsx
│   │   └── Admin.jsx
│   ├── App.jsx                   #    Router setup
│   ├── main.jsx                  #    Entry point
│   └── index.css                 #    Tailwind CSS
│
├── utils/
│   └── seed.mjs                  # Database seeder
├── vercel.json                   # Vercel config
├── vite.config.js
├── tailwind.config.js
├── package.json
└── README.md
```

---

## 🔑 API Endpoints

| Method | Endpoint                    | Auth     | Description             |
|--------|-----------------------------|----------|-------------------------|
| GET    | `/api/health`               | Public   | Health check            |
| POST   | `/api/auth/signup`          | Public   | Register + 1000 CC bonus|
| POST   | `/api/auth/login`           | Public   | Login with email + PIN  |
| GET    | `/api/auth/me`              | User     | Get profile             |
| GET    | `/api/users`                | User     | List users (for send)   |
| POST   | `/api/transactions/send`    | User     | Send coins (atomic)     |
| GET    | `/api/transactions/history` | User     | Transaction history     |
| GET    | `/api/transactions/stats`   | User     | Sent/received totals    |
| GET    | `/api/admin/dashboard`      | Admin    | System stats            |
| POST   | `/api/admin/credit`         | Admin    | Credit coins to user    |
| GET    | `/api/admin/transactions`   | Admin    | All system transactions |

---

## 🔒 Security

- PINs hashed with **bcrypt** (10 rounds)
- **JWT** token auth (30-day expiry)
- Money transfers use **MongoDB atomic sessions**
- Admin routes require `role: "admin"`
- CORS configured in vercel.json

---

## 🛠️ Local Development

```bash
# Install
npm install

# Create .env.local with your MONGO_URI and JWT_SECRET
cp .env.example .env.local

# Run dev server (frontend on :5173, API proxied)
npm run dev
```

Note: For local dev, the Vite proxy forwards `/api/*` requests. 
For the serverless functions to work locally, you can use `vercel dev` instead:

```bash
npm i -g vercel
vercel dev
```

---

## 💡 Tips for College Presentation

- Show the MongoDB Atlas dashboard to demonstrate real database
- Do a live demo: create account → send coins → check history
- Show the admin panel with system-wide stats
- Explain atomic transactions (money safety)
- Mention it's deployed live on Vercel (production-ready)

---

## Demo Credentials

| Role  | Email              | PIN    |
|-------|--------------------|--------|
| Admin | admin@campus.edu   | 000000 |
| User  | aarav@campus.edu   | 1234   |
| User  | priya@campus.edu   | 1234   |
| User  | rohan@campus.edu   | 1234   |
| User  | sneha@campus.edu   | 1234   |
| User  | vikram@campus.edu  | 1234   |
| User  | ananya@campus.edu  | 1234   |
| User  | karan@campus.edu   | 1234   |
