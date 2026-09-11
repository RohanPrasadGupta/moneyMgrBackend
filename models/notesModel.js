const mongoose = require("mongoose");

const notesSchema = new mongoose.Schema({
  date: { type: Date, required: true, default:Date.now},
  content: { type: String, required: true },
  title: { type: String, required: true },
});

module.exports = mongoose.model("Notes", notesSchema);
