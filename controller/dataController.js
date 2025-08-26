const Data = require("../models/dataModel");

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
    res.status(201).json({
      message: "success",
      data: newData,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

exports.getAllData = async (req, res) => {
  try {
    const allData = await Data.find().sort({ date: -1 });
    res.status(200).json({
      message: "success",
      data: allData,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

exports.getDataByYearAndMonth = async (req, res) => {
  let { year, month } = req.params;
  if (isNaN(month)) {
    month = monthNames.indexOf(month) + 1;
  } else {
    month = parseInt(month, 10);
  }
  if (month < 1 || month > 12) {
    return res.status(400).json({ message: "Invalid month" });
  }
  // Start and end dates for the month
  const startDate = new Date(
    `${year}-${month.toString().padStart(2, "0")}-01T00:00:00.000Z`
  );
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);

  try {
    const data = await Data.find({
      date: {
        $gte: startDate,
        $lt: endDate,
      },
    }).sort({ date: -1 });
    res.status(200).json({
      message: "success",
      data: data,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

exports.getDataById = async (req, res) => {
  try {
    const data = await Data.findById(req.params.id);
    if (!data) {
      return res.status(404).json({
        message: "Data not found",
      });
    }
    res.status(200).json({
      message: "success",
      data: data,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

exports.updateData = async (req, res) => {
  try {
    const data = await Data.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!data) {
      return res.status(404).json({
        message: "Data not found",
      });
    }
    res.status(200).json({
      message: "success",
      data: data,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

exports.deleteData = async (req, res) => {
  try {
    const data = await Data.findByIdAndDelete(req.params.id);
    if (!data) {
      return res.status(404).json({
        message: "Data not found",
      });
    }
    res.status(200).json({
      message: "success",
      data: data,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};
