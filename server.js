const app = require("./app");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const http = require("http");
const Currency = require("./models/currencyModel");

dotenv.config({ path: "./config.env" });

const user = process.env.USER_NAME;
const password = process.env.PASSWORD;

const MONGODB_URI = `mongodb+srv://${user}:${password}@moneymgrdb.yqaumak.mongodb.net/moneyMgr?retryWrites=true&w=majority&appName=Cluster0`;
mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log("MongoDB connected");

    const currencyCount = await Currency.countDocuments();
    if (currencyCount === 0) {
      await Currency.insertMany([
        { code: "THB", name: "Thai Baht", symbol: "฿", isDefault: true },
        { code: "NPR", name: "Nepalese Rupee", symbol: "₨", isDefault: false },
      ]);
      console.log("Seeded default currencies: THB, NPR");
    }
  })
  .catch((err) => console.error("MongoDB connection error:", err));

// Create HTTP server
const server = http.createServer(app);

const port = process.env.PORT || 5000;

server.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
