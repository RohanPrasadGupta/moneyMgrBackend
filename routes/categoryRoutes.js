const express = require("express");
const router = express.Router();
const categoryController = require("../controller/categoryController");

router.post("/category", categoryController.createCategory);
router.get("/category", categoryController.getCategories);
router.delete("/category/:id", categoryController.deleteCategory);
router.put("/category/:id", categoryController.editCategory);

module.exports = router;
