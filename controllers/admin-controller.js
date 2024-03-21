const AuthenticateAdmin = (req, res, next) => {
  const { email, password } = req.body;
  if (email === "team@clipit.ai" && password == "clipit123") {
    res.status(200).send({ user: { name: "Admin", email: "team@clipit.ai" } });
  } else {
    res.status(401).send({ message: "Invalid Credentials" });
  }
};

module.exports = {
  AuthenticateAdmin,
};
