const app = require("./app");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const http = require("http");

dotenv.config({ path: "./config.env" });

const user = process.env.USER_NAME;
const password = process.env.PASSWORD;

const MONGODB_URI = `mongodb+srv://${user}:${password}@moneymgrdb.yqaumak.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Create HTTP server
const server = http.createServer(app);

const port = process.env.PORT || 5000;

server.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
