const mongoose = require("mongoose");

const dataSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  account: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  note: {
    type: String,
  },
  currency: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["Income", "Expense"],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model("Data", dataSchema);
