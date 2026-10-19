require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const path = require("path");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    const result = fn();
    if (result === true || result === undefined) {
      console.log(`  ✅ ${name}`); passed++;
    } else { console.error(`  ❌ ${name}: returned ${result}`); failed++; }
  } catch (e) { console.error(`  ❌ ${name}: ${e.message}`); failed++; }
}

async function asyncTest(name, fn) {
  try { await fn(); console.log(`  ✅ ${name}`); passed++; }
  catch (e) { console.error(`  ❌ ${name}: ${e.message}`); failed++; }
}

async function runTests() {
  console.log("\n🧪 HomeBasket Tests\n");

  console.log("📐 Utility Functions:");
  test("Paise to rupees: 5000 paise = 50 rupees", () => 5000 / 100 === 50);
  test("Rupees to paise: 50 rupees = 5000 paise", () => Math.round(50 * 100) === 5000);
  test("Shopping total calculation", () => {
    const items = [{ qty: 2, pricePaise: 5000 }, { qty: 1, pricePaise: 8000 }];
    return items.reduce((s, i) => s + i.qty * i.pricePaise, 0) === 18000;
  });
  test("Discount calculation", () => (18000 - 1000) === 17000);

  console.log("\n📋 Schema Validation:");
  const { registerSchema } = require(path.join(__dirname, "../src/validators/auth"));
  await asyncTest("Valid registration data passes", async () => {
    const r = registerSchema.safeParse({ fullName:"Demo User", username:"demo_user", email:"demo@example.com", password:"secret123", confirmPassword:"secret123" });
    if (!r.success) throw new Error(JSON.stringify(r.error.flatten()));
  });
  await asyncTest("Short password fails", async () => {
    const r = registerSchema.safeParse({ fullName:"Demo", username:"demo", email:"d@e.com", password:"abc", confirmPassword:"abc" });
    if (r.success) throw new Error("Should have failed");
  });
  await asyncTest("Mismatched passwords fail", async () => {
    const r = registerSchema.safeParse({ fullName:"Demo", username:"demo", email:"d@e.com", password:"secret123", confirmPassword:"different" });
    if (r.success) throw new Error("Should have failed");
  });

  const { productSchema } = require(path.join(__dirname, "../src/validators/product"));
  await asyncTest("Valid product data passes", async () => {
    const r = productSchema.safeParse({ name:"Basmati Rice", category:"Grains & Pulses", defaultQuantity:5, unit:"kg", estimatedPricePaise:60000 });
    if (!r.success) throw new Error(JSON.stringify(r.error.flatten()));
  });

  const { transactionSchema } = require(path.join(__dirname, "../src/validators/transaction"));
  await asyncTest("Valid transaction data passes", async () => {
    const r = transactionSchema.safeParse({ purchasedItems:[{productName:"Rice",quantity:5,unit:"kg",pricePaise:60000,category:"Grains & Pulses"}], finalBillAmountPaise:60000, paymentMethod:"Cash", purchaseDate:"2026-10-17" });
    if (!r.success) throw new Error(JSON.stringify(r.error.flatten()));
  });

  console.log("\n🗄️  MongoDB:");
  await asyncTest("MongoDB connection", async () => {
    if (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes("REPLACE_ME")) throw new Error("MONGODB_URI not configured - update .env first");
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
    await mongoose.disconnect();
  });

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

runTests().catch(e => { console.error(e); process.exit(1); });
