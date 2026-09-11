const CurrencyModel = require("../models/currencyModel");

const createCurrency = async (req, res) => {
  try {
    const { code, name, symbol, isDefault } = req.body;

    if (isDefault) {
      await CurrencyModel.updateMany({}, { isDefault: false });
    }

    const newCurrency = new CurrencyModel({ code, name, symbol, isDefault });
    await newCurrency.save();
    console.log("[currency] saved: ", { id: newCurrency._id, code });
    res.status(201).json({
      message: "Currency created successfully",
      currency: newCurrency,
    });
  } catch (error) {
    console.error("[currency] save failed: ", error.message);
    res.status(500).json({ message: "Error creating currency", error });
  }
};

const getCurrencies = async (req, res) => {
  try {
    const currencies = await CurrencyModel.find();
    console.log("[currency] fetched all currencies.");
    res.status(200).json(currencies);
  } catch (error) {
    console.error("[currency] fetch failed: ", error.message);
    res.status(500).json({ message: "Error fetching currencies", error });
  }
};

const deleteCurrency = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await CurrencyModel.findByIdAndDelete(id);
    if (!deleted) {
      console.error("[currency] not found: ", { id });
      return res.status(404).json({ message: "Currency not found" });
    }
    console.log("[currency] deleted: ", { id });
    res.status(200).json({ message: "Currency deleted successfully" });
  } catch (error) {
    console.error("[currency] delete failed: ", error.message);
    res.status(500).json({ message: "Error deleting currency", error });
  }
};

const editCurrency = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, symbol, isDefault } = req.body;

    if (isDefault) {
      await CurrencyModel.updateMany({ _id: { $ne: id } }, { isDefault: false });
    }

    const updatedCurrency = await CurrencyModel.findByIdAndUpdate(
      id,
      { code, name, symbol, isDefault },
      { new: true }
    );
    if (!updatedCurrency) {
      console.error("[currency] not found: ", { id });
      return res.status(404).json({ message: "Currency not found" });
    }
    console.log("[currency] updated: ", { id });
    res.status(200).json({
      message: "Currency updated successfully",
      currency: updatedCurrency,
    });
  } catch (error) {
    console.error("[currency] update failed: ", error.message);
    res.status(500).json({ message: "Error updating currency", error });
  }
};

module.exports = {
  createCurrency,
  getCurrencies,
  deleteCurrency,
  editCurrency,
};
