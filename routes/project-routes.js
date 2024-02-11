const express = require("express");
const projectController = require("../controllers/project-controller");

const router = express.Router();

// PROJECT ROUTES

// GET ALL PROJECTS
router.get("/", projectController.GetProjects);

// GET PROJECT BY ID
router.get("/single/:id", projectController.GetProjectByID);

// CREATE NEW PROJECT
router.post("/", projectController.CreateProject);

// UPDATE PROJECT BY ID
router.patch("/:id", projectController.UpdateProject);

// DELETE PROJECT BY ID
router.delete("/:id", projectController.DeleteProject);

module.exports = router;
