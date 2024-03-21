const express = require("express");
const adminController = require("../controllers/admin-controller");

const router = express.Router();

// ADMIN AUTHENTICATION
router.post("/login", adminController.AuthenticateAdmin);

module.exports = router;
