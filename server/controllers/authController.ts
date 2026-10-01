import User from "../models/user.js";
import bcrypt from "bcryptjs";
import { body, validationResult } from "express-validator";
import type { Request, Response } from "express";
import { TEST_ACCOUNT_EMAIL } from "../config/env.js";
import { signToken } from "../middleware/verifyToken.js";

const DEFAULT_PROFILE_PIC =
  "https://my-odin-bucket.s3.eu-west-2.amazonaws.com/6cfd21bd1531475c0d00f7cc8de66fcb.png";
const DEFAULT_COVER_PIC =
  "https://my-odin-bucket.s3.eu-west-2.amazonaws.com/9cb0e642e580fca30a47e3eda534d29c.png";

export const signin = [
  body("firstname", "First name must be 2 to 15 letters or numbers")
    .trim()
    .isLength({ min: 2, max: 15 })
    .isAlphanumeric(),
  body("lastname", "Last name must be 2 to 15 letters or numbers")
    .trim()
    .isLength({ min: 2, max: 15 })
    .isAlphanumeric(),
  body("email", "A valid email is required").trim().isEmail().normalizeEmail(),
  body("password", "Password must be at least 8 characters").isLength({
    min: 8,
  }),
  async (req: Request, res: Response) => {
    const { email, firstname, lastname, password } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ message: errors.array()[0].msg, errors: errors.array() });
    }
    try {
      //if user already exists return
      const userExists = await User.exists({ email });
      if (userExists) {
        return res.status(400).json({ message: "User already exists" });
      }
      // create hashed password for the account
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = new User({
        email,
        firstname,
        lastname,
        password: hashedPassword,
        profilePicUrl: DEFAULT_PROFILE_PIC,
        coverPicUrl: DEFAULT_COVER_PIC,
        notifications: [],
      });

      await user.save();
      return res.status(200).json({ user, token: signToken(user.id) });
    } catch (err) {
      return res.status(500).json({ message: (err as Error).message });
    }
  },
];

export const login = [
  body("email").trim().normalizeEmail(),
  async (req: Request, res: Response) => {
    try {
      const user = await User.findOne({ email: req.body.email }).select(
        "+password"
      );
      // if user is the test account, set the right password
      const password =
        req.body.email === TEST_ACCOUNT_EMAIL
          ? process.env.TEST_PASSWORD
          : req.body.password;

      // same answer for unknown email and wrong password, so emails can't be probed
      const correct =
        user &&
        typeof password === "string" &&
        (await bcrypt.compare(password, user.password ?? ""));
      if (!user || !correct) {
        return res.status(400).json({ message: "Invalid email or password" });
      }

      return res.status(200).json({ user, token: signToken(user.id) });
    } catch (err) {
      return res.status(500).json({ message: (err as Error).message });
    }
  },
];
