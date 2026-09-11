const { createClient } = require("redis");
const dotenv = require("dotenv");
const Notes = require("../models/notesModel");

dotenv.config({ path: "./config.env" });

exports.createNote = async (req, res) => {
  try {
    const newNote = new Notes(req.body);
    await newNote.save();
    console.log("[notes] saved: ", { id: newNote._id });
    res.status(201).json({
      message: "success",
      data: newNote,
    });
  } catch (error) {
    console.error("[notes] save failed: ", error.message);
    res.status(400).json({
      message: "Failed to get Notes.",
      errMsg: error.message,
    });
  }
};

exports.getAllNotes = async (req, res) => {
  try {
    const allNotes = await Notes.find().sort({ date: -1 });
    console.log("[notes] fetched all Notes.");
    res.status(200).json({
      message: "success",
      data: allNotes,
    });
  } catch (error) {
    console.error("[notes] fetch all failed: ", error.message);
    res.status(400).json({
      message: "Failed to get Notes",
      errMsg: error.message,
    });
  }
};

exports.getOneNote = async (req, res) => {
  try {
    const note = await Notes.findById(req.params.id);
    if (!note) {
      console.error("[notes] not found: ", { id: req.params.id });
      return res.status(404).json({
        message: "Failed to get Notes",
      });
    }

    console.log("[notes] note fetched: ", {id: req.params.id});
    res.status(200).json({
      message: "success",
      data: note,
    });

  } catch (error) {
    console.error("[notes] fetch failed: ", error.message);
    res.status(400).json({
      message: "Failed to get Notes",
      errMsg: error.message,
    });
  }
};


exports.deleteNote = async (req, res) => {
    try {
      const note = await Notes.findByIdAndDelete(req.params.id);
      if (!note) {
        console.error("[notes] not found: ", { id: req.params.id });
        return res.status(404).json({
          message: "Failed to get Notes",
        });
      }
  
      console.log("[notes] note deleted: ", {id: req.params.id});
      res.status(200).json({
        message: "note deleted successfully",
      });
  
    } catch (error) {
      console.error("[notes] note deletion failed: ", error.message);
      res.status(400).json({
        message: "Failed to delete Note",
        errMsg: error.message,
      });
    }
  };


  exports.updateNote = async(req,res) =>{
    try{
        const note = await Notes.findByIdAndUpdate(req.params.id, req.body, {new: true});
        if(!note){
            console.error("[notes] not found: ", { id: req.params.id });
            return res.status(404).json({
                message: "Failed to get Notes",
            });
        }
        console.log("[notes] note updated: ", {id: req.params.id});
        res.status(200).json({
            message: "success",
            data: note,
        });
  } catch (error) {
    console.error("[notes] note update failed: ", error.message);
    res.status(400).json({
      message: "Failed to update Note",
      errMsg: error.message,
    });
  }
};