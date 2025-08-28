const mongoose = require("mongoose");
const XLSX = require("xlsx");

// === CONFIG ===
const excelFile = "Money Manager_8-26-25.xls";

// Read workbook
const workbook = XLSX.readFile(excelFile);
console.log("Sheets:", workbook.SheetNames);

const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: true });
console.log("Parsed rows (raw):", jsonData);

// Convert Excel serial date to JS Date
function excelSerialToJSDate(serial) {
  if (typeof serial !== "number") return null; // Not a number
  const dateObj = XLSX.SSF.parse_date_code(serial);
  if (!dateObj) return null;
  return new Date(
    dateObj.y,
    dateObj.m - 1,
    dateObj.d,
    dateObj.H,
    dateObj.M,
    Math.floor(dateObj.S)
  );
}

// Map data with converted date and validation
const parsedData = jsonData
  .map((row) => {
    const date = excelSerialToJSDate(row.Date);
    const amount = Number(row.Amount);
    const type = row["Income/Expense"]?.trim();

    if (!date || isNaN(amount) || !["Income", "Expense"].includes(type)) {
      console.warn("Skipping invalid row:", row);
      return null; // Skip invalid rows
    }

    return {
      date,
      account: String(row.Account),
      category: String(row.Category),
      note: row.Note ? String(row.Note) : "",
      currency: String(row.Currency),
      type,
      amount,
    };
  })
  .filter(Boolean); // Remove nulls

console.log("Parsed rows (converted & valid):", parsedData);

// === Mongoose Schema ===
const dataSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  account: { type: String, required: true },
  category: { type: String, required: true },
  note: { type: String },
  currency: { type: String, required: true },
  type: { type: String, enum: ["Income", "Expense"], required: true },
  amount: { type: Number, required: true },
});

const DataModel = mongoose.model("Data", dataSchema);

// === Main Function ===
async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect(``, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    if (parsedData.length === 0) {
      console.log("⚠️ No valid rows to insert.");
    } else {
      // Insert into MongoDB
      const inserted = await DataModel.insertMany(parsedData);
      console.log(`✅ Inserted ${inserted.length} records into MongoDB`);
    }

    mongoose.connection.close();
  } catch (err) {
    console.error("❌ Error:", err);
    mongoose.connection.close();
  }
}

main();
