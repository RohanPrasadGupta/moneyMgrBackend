const { createClient } = require("redis");
const dotenv = require("dotenv");
const Data = require("../models/dataModel");

dotenv.config({ path: "./config.env" });

const redis_url = process.env.REDIS_URL;
const CACHE_KEY = "allData";
const CACHE_FINANCIAL_YEAR_KEY = "financial_year";
const CACHE_FINANCIAL_YEAR_ALL_KEY = "financialYearAll";
const CACHE_FINANCIAL_DATA_YEAR_KEY = "financialDatayear";
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

// Clear cache for all key groups by default
async function clearCache(key = "ALL") {
  const client = await getRedisClient();
  try {
    await client.flushDb();
  } catch (err) {
    console.error("Failed to clear cache:", err);
  }
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
    console.log("[data] saved: ", { id: newData._id });
    res.status(201).json({ message: "success", data: newData });
  } catch (error) {
    console.error("[data] save failed: ", error.message);
    res.status(400).json({ message: error.message });
  }
};

exports.getAllData = async (req, res) => {
  try {
    // const client = await getRedisClient();
    // const cached = await client.get(CACHE_KEY);

    // if (cached) {
    //   return res.status(200).json({
    //     message: "success (cached)",
    //     data: JSON.parse(cached),
    //   });
    // }

    const allData = await Data.find().sort({ date: -1 });
    // await client.setEx(CACHE_KEY, CACHE_EXPIRY, JSON.stringify(allData));
    console.log("[data] fetched all data.");
    res.status(200).json({ message: "success", data: allData });
  } catch (error) {
    console.error("[data] fetch all failed: ", error.message);
    res.status(400).json({ message: error.message });
  }
};

exports.getYearlyFinancialData = async (req, res) => {
  try {
    let { year } = req.params;

    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${parseInt(year, 10) + 1}-01-01T00:00:00.000Z`);
    const client = await getRedisClient();
    const cached = await client.get(`${CACHE_FINANCIAL_DATA_YEAR_KEY}:${year}`);

    if (cached) {
      console.log("[data] yearly financial (cached): ", { year });
      return res.status(200).json({
        message: "success (cached)",
        data: JSON.parse(cached),
      });
    }

    const data = await Data.find({
      date: { $gte: startDate, $lt: endDate },
    }).sort({ date: -1 });

    const monthlyDataArray = {
      IncomeArray: Array(12).fill(0),
      ExpensesArray: Array(12).fill(0),
    };

    data.forEach((item) => {
      const monthIndex = item.date.getMonth(); // 0–11

      if (item.type === "Income") {
        monthlyDataArray.IncomeArray[monthIndex] += item.amount;
      } else if (item.type === "Expense") {
        monthlyDataArray.ExpensesArray[monthIndex] += item.amount;
      }
    });

    await client.setEx(
      `${CACHE_FINANCIAL_DATA_YEAR_KEY}:${year}`,
      CACHE_EXPIRY,
      JSON.stringify({ IncomeArray:monthlyDataArray.IncomeArray, ExpensesArray:monthlyDataArray.ExpensesArray })
    );

    console.log("[data] yearly financial fetched: ", { year });
    res.status(200).json({
      message: "success",
      data: monthlyDataArray,
    });
  } catch (error) {
    console.error("[data] yearly financial failed: ", error.message);
    res.status(400).json({ message: error.message });
  }
};

exports.getAllFinancialDataTypes = async (req, res) => {
  try {
    const client = await getRedisClient();
    const cached = await client.get(CACHE_FINANCIAL_YEAR_ALL_KEY);

    if (cached) {
      console.log("[data] all financial types (cached).");
      return res.status(200).json({
        message: "success (cached)",
        data: JSON.parse(cached),
      });
    } else {
      const data = await Data.find().sort({ date: -1 });  // Sort by date in descending order

      const incomeTypes = {};
      const expenseTypes = {};

      data.forEach((item) => {
        if (item.type === "Income") {
          if (incomeTypes[item.category]) {
            incomeTypes[item.category] += item.amount;
          } else {
            incomeTypes[item.category] = item.amount;
          }
        } else if (item.type === "Expense") {
          if (expenseTypes[item.category]) {
            expenseTypes[item.category] += item.amount;
          } else {
            expenseTypes[item.category] = item.amount;
          }
        }
      });

      await client.setEx(
        CACHE_FINANCIAL_YEAR_ALL_KEY,
        CACHE_EXPIRY,
        JSON.stringify({ incomeTypes, expenseTypes })
      );

      console.log("[data] all financial types fetched.");
      res.status(200).json({
        message: "success",
        data: { incomeTypes, expenseTypes },
      });
    }
  } catch (error) {
    console.error("[data] all financial types failed: ", error.message);
    res.status(400).json({ message: error.message });
  }
};

exports.getMonthlyFinancialDataType = async (req, res) => {
  try {
    let { year, month } = req.params;
    // Convert month to number if text
    month = isNaN(month) ? monthNames.indexOf(month) + 1 : parseInt(month, 10);

    if (month < 1 || month > 12) {
      console.error("[data] invalid month: ", { month });
      return res.status(400).json({ message: "Invalid month" });
    }

    const startDate = new Date(
      `${year}-${month.toString().padStart(2, "0")}-01T00:00:00.000Z`
    );
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const client = await getRedisClient();
    const cached = await client.get(
      `${CACHE_FINANCIAL_YEAR_KEY}:${year}:${month}`
    );

    if (cached) {
      console.log("[data] monthly financial types (cached): ", { year, month });
      return res.status(200).json({
        message: "success (cached)",
        data: JSON.parse(cached),
      });
    }

    const data = await Data.find({
      date: { $gte: startDate, $lt: endDate },
    }).sort({ date: -1 });

    const incomeTypes = {};
    const expenseTypes = {};

    data.forEach((item) => {
      if (item.type === "Income") {
        if (!incomeTypes[item.category]) {
          incomeTypes[item.category] = 0;
        }
        incomeTypes[item.category] += item.amount;
      }
      if (item.type === "Expense") {
        if (!expenseTypes[item.category]) {
          expenseTypes[item.category] = 0;
        }
        expenseTypes[item.category] += item.amount;
      }
    });

    await client.setEx(
      `${CACHE_FINANCIAL_YEAR_KEY}:${year}:${month}`,
      CACHE_EXPIRY,
      JSON.stringify({ incomeTypes, expenseTypes })
    );

    console.log("[data] monthly financial types fetched: ", { year, month });
    res.status(200).json({ message: "success", incomeTypes, expenseTypes });
  } catch (error) {
    console.error("[data] monthly financial types failed: ", error.message);
    res.status(400).json({ message: error.message });
  }
};

exports.getYearlyFinancialDataType = async (req, res) => {
  try {
    let { year } = req.params;
    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${parseInt(year, 10) + 1}-01-01T00:00:00.000Z`);
    const client = await getRedisClient();
    const cached = await client.get(`${CACHE_FINANCIAL_YEAR_KEY}:${year}`);

    if (cached) {
      console.log("[data] yearly financial types (cached): ", { year });
      return res.status(200).json({
        message: "success (cached)",
        data: JSON.parse(cached),
      });
    }

    const data = await Data.find({
      date: { $gte: startDate, $lt: endDate },
    }).sort({ date: -1 });

    const incomeTypes = {};
    const expenseTypes = {};

    data.forEach((item) => {
      if (item.type === "Income") {
        if (!incomeTypes[item.category]) {
          incomeTypes[item.category] = 0;
        }
        incomeTypes[item.category] += item.amount;
      }
      if (item.type === "Expense") {
        if (!expenseTypes[item.category]) {
          expenseTypes[item.category] = 0;
        }
        expenseTypes[item.category] += item.amount;
      }
    });

    await client.setEx(
      `${CACHE_FINANCIAL_YEAR_KEY}:${year}`,
      CACHE_EXPIRY,
      JSON.stringify({ incomeTypes, expenseTypes })
    );

    console.log("[data] yearly financial types fetched: ", { year });
    res.status(200).json({ message: "success", incomeTypes, expenseTypes });
  } catch (error) {
    console.error("[data] yearly financial types failed: ", error.message);
    res.status(400).json({ message: error.message });
  }
};

exports.getDataByYearAndMonth = async (req, res) => {
  try {
    let { year, month } = req.params;

    // Convert month to number if text
    month = isNaN(month) ? monthNames.indexOf(month) + 1 : parseInt(month, 10);

    if (month < 1 || month > 12) {
      console.error("[data] invalid month: ", { month });
      return res.status(400).json({ message: "Invalid month" });
    }

    const startDate = new Date(
      `${year}-${month.toString().padStart(2, "0")}-01T00:00:00.000Z`
    );
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const client = await getRedisClient();
    const cached = await client.get(`${CACHE_KEY}:${year}:${month}`);

    if (cached) {
      console.log("[data] by year/month (cached): ", { year, month });
      return res.status(200).json({
        message: "success (cached)",
        data: JSON.parse(cached),
      });
    }

    const data = await Data.find({
      date: { $gte: startDate, $lt: endDate },
    }).sort({ date: -1 });

    await client.setEx(
      `${CACHE_KEY}:${year}:${month}`,
      CACHE_EXPIRY,
      JSON.stringify(data)
    );

    console.log("[data] by year/month fetched: ", { year, month });
    res.status(200).json({ message: "success", data });
  } catch (error) {
    console.error("[data] by year/month failed: ", error.message);
    res.status(400).json({ message: error.message });
  }
};

exports.getDataById = async (req, res) => {
  try {
    const data = await Data.findById(req.params.id);
    if (!data) {
      console.error("[data] not found: ", { id: req.params.id });
      return res.status(404).json({ message: "Data not found" });
    }

    console.log("[data] fetched: ", { id: req.params.id });
    res.status(200).json({ message: "success", data });
  } catch (error) {
    console.error("[data] fetch by id failed: ", error.message);
    res.status(400).json({ message: error.message });
  }
};

exports.updateData = async (req, res) => {
  try {
    const data = await Data.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!data) {
      console.error("[data] not found: ", { id: req.params.id });
      return res.status(404).json({ message: "Data not found" });
    }

    await clearCache();
    console.log("[data] updated: ", { id: req.params.id });
    res.status(200).json({ message: "success", data });
  } catch (error) {
    console.error("[data] update failed: ", error.message);
    res.status(400).json({ message: error.message });
  }
};

exports.deleteData = async (req, res) => {
  try {
    const data = await Data.findByIdAndDelete(req.params.id);
    if (!data) {
      console.error("[data] not found: ", { id: req.params.id });
      return res.status(404).json({ message: "Data not found" });
    }

    await clearCache();
    console.log("[data] deleted: ", { id: req.params.id });
    res.status(200).json({ message: "success", data });
  } catch (error) {
    console.error("[data] delete failed: ", error.message);
    res.status(400).json({ message: error.message });
  }
};


exports.getReportData = async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;
    if (!startDate || !endDate) {
      console.error("[data] report missing dates.");
      return res
        .status(400)
        .json({ message: "startDate and endDate are required" });
    }

    const filter = {
      date: { $gte: new Date(startDate), $lt: new Date(endDate) },
    };

    if (category) {
      filter.category = category;
    }

    const data = await Data.find(filter).sort({ date: -1 });
    console.log("[data] report fetched: ", { startDate, endDate, category });
    res.status(200).json({ message: "success", data });
  } catch (error) {
    console.error("[data] report failed: ", error.message);
    res.status(400).json({ message: error.message });
  }
};