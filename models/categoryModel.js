const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  categoryType: {
    type: String,
    required: true,
  },
  currency: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    default: "THB",
  },
});

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
