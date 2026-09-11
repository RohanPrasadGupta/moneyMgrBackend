const CategoryModel = require("../models/categoryModel");

const createCategory = async (req, res) => {
  try {
    const { name, categoryType, currency } = req.body;
    const newCategory = new CategoryModel({
      name,
      categoryType,
      currency: currency || "THB",
    });
    await newCategory.save();
    console.log("[category] saved: ", { id: newCategory._id });
    res.status(201).json({
      message: "Category created successfully",
      category: newCategory,
    });
  } catch (error) {
    console.error("[category] save failed: ", error.message);
    res.status(500).json({ message: "Error creating category", error });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await CategoryModel.find();
    console.log("[category] fetched all categories.");
    res.status(200).json(categories);
  } catch (error) {
    console.error("[category] fetch failed: ", error.message);
    res.status(500).json({ message: "Error fetching categories", error });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await CategoryModel.findByIdAndDelete(id);
    if (!deleted) {
      console.error("[category] not found: ", { id });
      return res.status(404).json({ message: "Category not found" });
    }
    console.log("[category] deleted: ", { id });
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("[category] delete failed: ", error.message);
    res.status(500).json({ message: "Error deleting category", error });
  }
};

const editCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, categoryType, currency } = req.body;
    const updatedCategory = await CategoryModel.findByIdAndUpdate(
      id,
      { name, categoryType, currency: currency || "THB" },
      { new: true }
    );
    if (!updatedCategory) {
      console.error("[category] not found: ", { id });
      return res.status(404).json({ message: "Category not found" });
    }
    console.log("[category] updated: ", { id });
    res.status(200).json({
      message: "Category updated successfully",
      category: updatedCategory,
    });
  } catch (error) {
    console.error("[category] update failed: ", error.message);
    res.status(500).json({ message: "Error updating category", error });
  }
};

module.exports = {
  createCategory,
  getCategories,
  deleteCategory,
  editCategory,
};
