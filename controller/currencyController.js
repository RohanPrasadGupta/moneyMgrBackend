const CurrencyModel = require("../models/currencyModel");

const createCurrency = async (req, res) => {
  try {
    const { code, name, symbol, isDefault } = req.body;

    if (isDefault) {
      await CurrencyModel.updateMany({}, { isDefault: false });
    }

    const newCurrency = new CurrencyModel({ code, name, symbol, isDefault });
    await newCurrency.save();
    res.status(201).json({
      message: "Currency created successfully",
      currency: newCurrency,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating currency", error });
  }
};

const getCurrencies = async (req, res) => {
  try {
    const currencies = await CurrencyModel.find();
    res.status(200).json(currencies);
  } catch (error) {
    res.status(500).json({ message: "Error fetching currencies", error });
  }
};

const deleteCurrency = async (req, res) => {
  try {
    const { id } = req.params;
    await CurrencyModel.findByIdAndDelete(id);
    res.status(200).json({ message: "Currency deleted successfully" });
  } catch (error) {
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
    res.status(200).json({
      message: "Currency updated successfully",
      currency: updatedCurrency,
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating currency", error });
  }
};

module.exports = {
  createCurrency,
  getCurrencies,
  deleteCurrency,
  editCurrency,
};
