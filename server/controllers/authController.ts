import User from "../models/user.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { body, validationResult } from "express-validator";
import type { Request, Response } from "express";
import { accessTokenSecret } from "../config/env.js";

export const signin = [
  body("firstname", "First name required").trim().escape(),
  body("lastname", "Last name required").trim().escape(),
  body("email", "Email required").trim().escape().normalizeEmail(),
  body("password", "Password required").trim().escape(),
  async (req: Request, res: Response) => {
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
          "https://my-odin-bucket.s3.eu-west-2.amazonaws.com/6cfd21bd1531475c0d00f7cc8de66fcb.png",
        coverPicUrl:
          "https://my-odin-bucket.s3.eu-west-2.amazonaws.com/9cb0e642e580fca30a47e3eda534d29c.png",
        notifications: [],
      });

      const savedUser = await user.save();
      if (savedUser) {
        //create token
        const token = jwt.sign({ user }, accessTokenSecret());
        return res.status(200).json({ user, token });
      }
    } catch (err) {
      return res.status(500).json({ message: (err as Error).message });
    }
  },
];

export const login = [
  body("email").trim().escape().normalizeEmail(),
  body("password").trim().escape(),
  async (req: Request, res: Response) => {
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
        user.password ?? ""
      );

      if (comparedPassword) {
        const token = jwt.sign({ user }, accessTokenSecret());
        return res.status(200).json({ user, token });
      } else {
        return res.status(400).json({ message: "Password is incorrect" });
      }
    } catch (err) {
      return res.status(500).json({ message: (err as Error).message });
    }
  },
];
