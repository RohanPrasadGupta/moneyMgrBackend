const express = require('express')
const router = express.Router()
const notesController = require("../controller/notesController")


router.get("/allnotes",notesController.getAllNotes)
router.get("/getNote/:id",notesController.getOneNote)

router.post("/addNote",notesController.createNote)

router.delete("/deleteNote/:id",notesController.deleteNote)

router.put("/updateNote/:id",notesController.updateNote)



module.exports = router;