const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const dataRoutes = require("./routes/dataRoutes");
const categoryRoutes = require("./routes/categoryRoutes");

const app = express();
app.use(express.json());
app.use(cookieParser());

const allowedOrigins = [
  "http://localhost:3001",
  "http://localhost:3000",
  "https://rpgmoney-mgr.netlify.app",
  "http://rpg-money-mgr-env.eba-zydjgggm.ap-southeast-1.elasticbeanstalk.com",
];

const corsOptions = {
  origin: allowedOrigins,
  methods: "GET, POST, PUT, DELETE, PATCH, HEAD",
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400000, // 1 day
};

app.use(cors(corsOptions));

app.use("/api", dataRoutes);
app.use("/api", categoryRoutes);
app.get("/", (req, res) => {
  res.send("API is running...");
});

module.exports = app;
