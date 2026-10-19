# 🧺 HomeBasket – MongoDB-Based Shopping & Expense Tracker

A complete full-stack household expense management app with MongoDB, Express, Next.js and TypeScript.

---

## 🏗️ Project Structure

```
HomeBasket/
├── backend/                   # Express.js API
│   ├── src/
│   │   ├── config/db.js       # MongoDB connection
│   │   ├── models/            # Mongoose schemas
│   │   │   ├── User.js
│   │   │   ├── Product.js
│   │   │   ├── ShoppingList.js
│   │   │   └── Transaction.js
│   │   ├── controllers/       # Request handlers
│   │   ├── routes/            # API routes
│   │   ├── middleware/auth.js # JWT protection
│   │   ├── validators/        # Zod validation
│   │   ├── app.js             # Express app
│   │   └── server.js          # Entry point
│   ├── tests/run.js           # Basic test suite
│   ├── .env                   # Local environment (gitignored)
│   ├── .env.example           # Template
│   └── package.json
│
└── frontend/                  # Next.js App
    ├── src/
    │   ├── app/
    │   │   ├── (auth)/login/page.tsx
    │   │   ├── (auth)/register/page.tsx
    │   │   ├── (dashboard)/
    │   │   │   ├── dashboard/page.tsx
    │   │   │   ├── products/page.tsx
    │   │   │   ├── shopping/page.tsx
    │   │   │   ├── history/page.tsx
    │   │   │   ├── expenses/page.tsx
    │   │   │   └── settings/page.tsx
    │   │   ├── globals.css
    │   │   └── layout.tsx
    │   ├── context/           # React contexts
    │   ├── lib/api.ts         # Axios API client
    │   ├── lib/utils.ts       # Helpers & formatters
    │   └── types/index.ts     # TypeScript types
    ├── .env.local
    └── package.json
```

---

## 🚀 Quick Start

### Step 1 – Configure MongoDB (Atlas)

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a free cluster
3. Create a database user (Settings → Database Access)
4. Allow your IP (Settings → Network Access → `0.0.0.0/0` for development)
5. Get your connection string from Connect → Drivers → Node.js

### Step 2 – Configure Backend

```bash
cd backend
copy .env.example .env
```

Open `.env` and fill in:

```env
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@cluster0.xxxx.mongodb.net/homebasket?retryWrites=true&w=majority
JWT_SECRET=any_long_random_string_here_min_32_chars
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
COOKIE_SECURE=false
```

### Step 3 – Start Backend

```bash
cd backend
npm install
npm run dev
```

You should see:
```
✅ MongoDB Connected: cluster0.xxxx.mongodb.net
📦 Database: homebasket
🚀 HomeBasket API running on http://localhost:5000
```

### Step 4 – Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🗄️ MongoDB Compass

### Connect:
1. Install [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Open Compass → New Connection
3. Paste your `MONGODB_URI`
4. Click **Connect**
5. Select database: **homebasket**

### Collections you'll see:
| Collection      | Contents                           |
|-----------------|-------------------------------------|
| `users`         | Registered users with hashed passwords |
| `products`      | Household product catalogue         |
| `shoppinglists` | Shopping lists with item arrays     |
| `transactions`  | Purchase records with item snapshots |

### To verify the app:
1. Register a new user at `/register`
2. Check `users` collection — password stored as bcrypt hash ✅
3. Add products at `/products` — check `products` collection
4. Create a shopping list at `/shopping`
5. Complete checkout — check `transactions` collection

---

## 🔌 REST API Endpoints

### Auth
```
POST   /api/auth/register    – Create account
POST   /api/auth/login       – Sign in (sets HTTP-only cookie)
POST   /api/auth/logout      – Sign out (clears cookie)
GET    /api/auth/me          – Get current user
```

### Products (requires auth)
```
GET    /api/products         – List all products (?search=&category=&favourite=)
POST   /api/products         – Create product
GET    /api/products/:id     – Get single product
PUT    /api/products/:id     – Update product
DELETE /api/products/:id     – Delete product
```

### Shopping Lists (requires auth)
```
GET    /api/shopping-lists   – List all (?status=&from=&to=)
POST   /api/shopping-lists   – Create list
GET    /api/shopping-lists/:id
PUT    /api/shopping-lists/:id
DELETE /api/shopping-lists/:id
```

### Transactions (requires auth)
```
GET    /api/transactions     – List all (?paymentStatus=&paymentMethod=&from=&to=)
POST   /api/transactions     – Record checkout
GET    /api/transactions/:id
PUT    /api/transactions/:id
DELETE /api/transactions/:id
```

### Dashboard (requires auth)
```
GET    /api/dashboard/summary           – Monthly summary
GET    /api/dashboard/monthly-expenses  – 12-month breakdown (?year=)
GET    /api/dashboard/category-expenses – Category totals (?month=&year=)
```

---

## 📄 Sample API Requests

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Demo User","username":"demo","email":"demo@example.com","password":"secret123","confirmPassword":"secret123"}'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"identifier":"demo","password":"secret123"}'
```

### Add Product
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"name":"Basmati Rice","category":"Grains & Pulses","defaultQuantity":5,"unit":"kg","estimatedPricePaise":60000}'
```

---

## 💾 Example MongoDB Documents

### users
```json
{
  "_id": "673a...ObjectId",
  "fullName": "Demo User",
  "username": "demo_user",
  "email": "demo@example.com",
  "passwordHash": "$2b$12$...",
  "createdAt": "2026-10-17T10:00:00.000Z",
  "updatedAt": "2026-10-17T10:00:00.000Z"
}
```

### products
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (ref: users)",
  "name": "Basmati Rice",
  "category": "Grains & Pulses",
  "defaultQuantity": 5,
  "unit": "kg",
  "estimatedPricePaise": 60000,
  "isFavourite": false,
  "notes": ""
}
```

### transactions
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "purchasedItems": [
    { "productName": "Basmati Rice", "quantity": 5, "unit": "kg", "pricePaise": 60000, "category": "Grains & Pulses" }
  ],
  "finalBillAmountPaise": 60000,
  "discountPaise": 0,
  "paymentMethod": "UPI",
  "paymentStatus": "Paid",
  "storeName": "Big Bazaar",
  "purchaseDate": "2026-10-17T00:00:00.000Z"
}
```

---

## 🧪 Running Tests

```bash
cd backend
npm test
```

Tests cover: math utilities, Zod schema validation, and MongoDB connectivity.

---

## 🔒 Security Notes

- Passwords are **never stored in plain text** — bcrypt with 12 rounds
- JWT stored in **HTTP-only cookies** (not accessible via JavaScript)
- All private routes verify JWT and user ownership
- MongoDB credentials never exposed to the frontend
- Zod validates all input on the server

---

## 💰 Currency

All monetary values are stored as **integer paise** (1 INR = 100 paise) to avoid floating point errors. The UI formats all amounts as Indian Rupees (₹).

---

## ☁️ Deployment Guide (GitHub & Vercel) – Single Unified Fullstack Project

HomeBasket is completely unified into a single full-stack Next.js application. Running `npm run dev` inside `frontend` runs BOTH the UI and the Backend API on the same port (`3000`). You do **not** need to run a separate backend server!

### 1. Push to GitHub
```bash
git add .
git commit -m "feat: unified fullstack HomeBasket for single Vercel deployment"
git push -u origin main
```

### 2. Deploy to Vercel (Single Project)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard) ➔ Click **Add New...** ➔ **Project**.
2. Select and **Import** your `HomeBasket` repository.
3. In **Root Directory**, click **Edit** and choose `frontend`.
4. Framework Preset will automatically detect **Next.js**.
5. Under **Environment Variables**, add:
   - `MONGODB_URI`: `mongodb+srv://sivaprakashm5235mca25_db_user:IlGq868TsdO741HC@homebascut.jzh1eir.mongodb.net/`
   - `JWT_SECRET`: `homebasket_super_secret_jwt_key_change_this_before_production_2024`
   - `NODE_ENV`: `production`
6. Click **Deploy**.

> **Done!** Opening your Vercel URL directly loads HomeBasket with full authentication, products catalog, shopping checklists, and expense tracking working out of the box!

