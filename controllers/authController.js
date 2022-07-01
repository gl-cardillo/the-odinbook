const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const { body, validationResult } = require("express-validator");

exports.signin = [
  body("firstname", "First name required").trim().escape(),
  body("lastname", "Last name required").trim().escape(),
  body("email", "Email required").trim().escape().normalizeEmail(),
  body("password", "Password required").trim().escape(),
  async (req, res, next) => {
    const { email, firstname, lastname, password } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({ errors: errors.array() });
    }
    try {
      //if user already exists return
      const userExists = await User.find({ email });
      if (userExists.length > 0) {
        return res.status(400).json({ message: "User already exists" });
      }
      // create hashed password for the account
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = new User({
        email,
        firstname,
        lastname,
        fullname: `${firstname} ${lastname}`,
        password: hashedPassword,
        profilePicUrl:
          "https://myawsbucket-gl-cardi.s3.eu-west-2.amazonaws.com/6cfd21bd1531475c0d00f7cc8de66fcb",
        coverPicUrl:
          "https://myawsbucket-gl-cardi.s3.eu-west-2.amazonaws.com/9cb0e642e580fca30a47e3eda534d29c",
        notifications: []
      });

      const savedUser = await user.save();
      if (savedUser) {
        //create token
        const token = jwt.sign({ user }, process.env.ACCESS_TOKEN_SECRET);
        return res.status(200).json({ user, token });
      }
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },
];

exports.login = [
  body("email").trim().escape().normalizeEmail(),
  body("password").trim().escape(),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({ errors: errors.array() });
    }
    try {
      const user = await User.findOne({ email: req.body.email });
      // if user is the test account, set the right password
      if (req.body.email === "test-account@example.com") {
        req.body.password = process.env.TEST_PASSWORD;
      }
      if (!user) return res.status(404).json({ message: "User not found" });
      // compare the password and create token
      const comparedPassword = await bcrypt.compare(
        req.body.password,
        user.password
      );

      if (comparedPassword) {
        const token = jwt.sign({ user }, process.env.ACCESS_TOKEN_SECRET);
        return res.status(200).json({ user, token });
      } else {
        console.log(console.log(req.body.password));
        return res.status(400).json({ message: "Password is incorrect" });
      }
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },
];
