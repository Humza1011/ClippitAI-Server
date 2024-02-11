const Project = require("../models/project");

//        ********** FUNCTIONS ***********

// GET ALL PROJECTS
const GetProjects = async (req, res, next) => {
  console.log("Get all projects");
  try {
    const project = await Project.find();
    return res.status(200).send(project);
  } catch (err) {
    next(err);
  }
};

// GET SINGLE PROJECT
const GetProjectByID = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    return res.status(200).send(project);
  } catch (err) {
    next(err);
  }
};

// CREATE NEW PROJECT
const CreateProject = async (req, res, next) => {
  const project = new Project(req.body);
  try {
    await project.save();
    return res.status(200).json(project);
  } catch (err) {
    next(err);
  }
};

// UPDATE PROJECT
const UpdateProject = async (req, res, next) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    return res.status(200).json(project);
  } catch (err) {
    next(err);
  }
};

// DELETE PROJECT
const DeleteProject = async (req, res, next) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    return res.status(200).json(project);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  GetProjects,
  GetProjectByID,
  CreateProject,
  UpdateProject,
  DeleteProject,
};
