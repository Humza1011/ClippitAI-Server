const express = require("express");
const userController = require("../controllers/user-controller");
const { createJWT, verifyJWT } = require("../middleware/jwt");

const router = express.Router();

// USER ROUTES

// GET ALL USERS
router.get("/", userController.GetUsers);

// GET USER BY ID
router.get("/single/:id", userController.GetUserByID);

// CREATE NEW USER
router.post("/", userController.CreateUser);

// UPDATE USER BY ID
router.patch("/:id", userController.UpdateUser);

// DELETE USER BY ID
router.delete("/:id", userController.DeleteUser);

// REGISTER USER
router.post("/register", userController.RegisterUser, createJWT);

// LOGIN USER
router.post("/login", userController.LoginUser, createJWT);

module.exports = router;
