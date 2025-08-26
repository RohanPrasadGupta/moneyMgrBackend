const CategoryModel = require("../models/categoryModel");

const createCategory = async (req, res) => {
  try {
    const { name, categoryType } = req.body;
    const newCategory = new CategoryModel({ name, categoryType });
    await newCategory.save();
    res.status(201).json({
      message: "Category created successfully",
      category: newCategory,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating category", error });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await CategoryModel.find();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: "Error fetching categories", error });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await CategoryModel.findByIdAndDelete(id);
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting category", error });
  }
};

const editCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, categoryType } = req.body;
    const updatedCategory = await CategoryModel.findByIdAndUpdate(
      id,
      { name, categoryType },
      { new: true }
    );
    res.status(200).json({
      message: "Category updated successfully",
      category: updatedCategory,
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating category", error });
  }
};

module.exports = {
  createCategory,
  getCategories,
  deleteCategory,
  editCategory,
};
