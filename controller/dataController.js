const { createClient } = require("redis");
const dotenv = require("dotenv");
const Data = require("../models/dataModel");

dotenv.config({ path: "./config.env" });

const redis_url = process.env.REDIS_URL;
const CACHE_KEY = "allData";
const CACHE_EXPIRY = 3600 * 4; // 4 hours

let redisClient;

async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({ url: redis_url });
    redisClient.on("error", (err) => console.error("Redis Client Error:", err));
    await redisClient.connect();
  }
  return redisClient;
}

async function clearCache(key = CACHE_KEY) {
  const client = await getRedisClient();
  const exists = await client.exists(key);
  if (exists) await client.del(key);
}

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

exports.createData = async (req, res) => {
  try {
    const newData = new Data(req.body);
    await newData.save();
    await clearCache();

    res.status(201).json({ message: "success", data: newData });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAllData = async (req, res) => {
  try {
    const client = await getRedisClient();
    const cached = await client.get(CACHE_KEY);

    if (cached) {
      return res.status(200).json({
        message: "success (cached)",
        data: JSON.parse(cached),
      });
    }

    const allData = await Data.find().sort({ date: -1 });
    await client.setEx(CACHE_KEY, CACHE_EXPIRY, JSON.stringify(allData));

    res.status(200).json({ message: "success", data: allData });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getDataByYearAndMonth = async (req, res) => {
  try {
    let { year, month } = req.params;

    // Convert month to number if text
    month = isNaN(month) ? monthNames.indexOf(month) + 1 : parseInt(month, 10);
    if (month < 1 || month > 12)
      return res.status(400).json({ message: "Invalid month" });

    const startDate = new Date(
      `${year}-${month.toString().padStart(2, "0")}-01T00:00:00.000Z`
    );
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const data = await Data.find({
      date: { $gte: startDate, $lt: endDate },
    }).sort({ date: -1 });

    res.status(200).json({ message: "success", data });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getDataById = async (req, res) => {
  try {
    const data = await Data.findById(req.params.id);
    if (!data) return res.status(404).json({ message: "Data not found" });

    res.status(200).json({ message: "success", data });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateData = async (req, res) => {
  try {
    const data = await Data.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!data) return res.status(404).json({ message: "Data not found" });

    await clearCache();

    res.status(200).json({ message: "success", data });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteData = async (req, res) => {
  try {
    const data = await Data.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ message: "Data not found" });

    await clearCache();

    res.status(200).json({ message: "success", data });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
