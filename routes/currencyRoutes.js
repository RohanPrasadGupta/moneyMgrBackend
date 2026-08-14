const express = require("express");
const router = express.Router();
const currencyController = require("../controller/currencyController");

router.post("/currency", currencyController.createCurrency);
router.get("/currency", currencyController.getCurrencies);
router.delete("/currency/:id", currencyController.deleteCurrency);
router.put("/currency/:id", currencyController.editCurrency);

module.exports = router;
