const User = require("../models/user");
const bcrypt = require("bcrypt");

//        ********** FUNCTIONS ***********

// GET ALL USERS
const GetUsers = async (req, res, next) => {
  console.log("Get all users");
  try {
    const user = await User.find();
    return res.status(200).send(user);
  } catch (err) {
    next(err);
  }
};

// GET SINGLE USER
const GetUserByID = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    return res.status(200).send(user);
  } catch (err) {
    next(err);
  }
};

// CREATE NEW USER
const CreateUser = async (req, res, next) => {
  const user = new User(req.body);
  try {
    await user.save();
    return res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

// UPDATE USER
const UpdateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    return res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

// DELETE USER
const DeleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    return res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

// REGISTER USER ON SIGNUP
const RegisterUser = async (req, res, next) => {
  console.log("Register User");
  const { name, email, password } = req.body;

  console.log(req.body);
  try {
    // Check if the user with the same email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "User with this email already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();
    req.user = newUser;
    next();
  } catch (error) {
    next(err);
  }
};

// LOGIN USER
const LoginUser = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    req.user = user;
    next();
  } catch (error) {
    next(err);
  }
};

module.exports = {
  GetUsers,
  GetUserByID,
  CreateUser,
  UpdateUser,
  DeleteUser,
  RegisterUser,
  LoginUser,
};
