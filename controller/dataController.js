const Data = require("../models/dataModel");

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
    const allData = await Data.find();
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
