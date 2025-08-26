const express = require("express");
const router = express.Router();
const dataController = require("../controller/dataController");

router.post("/data", dataController.createData);
router.get("/data", dataController.getAllData);
router.get("/data/:year/:month", dataController.getDataByYearAndMonth);

router.get("/data/:id", dataController.getDataById);
router.put("/data/:id", dataController.updateData);
router.delete("/data/:id", dataController.deleteData);

module.exports = router;
