import User from "../models/user.js";
import bcrypt from "bcryptjs";
import { body } from "express-validator";
import type { Request, Response } from "express";
import { TEST_ACCOUNT_EMAIL } from "../config/env.js";
import { signToken } from "../middleware/verifyToken.js";
import { badRequest, validate } from "../middleware/errors.js";

const DEFAULT_PROFILE_PIC =
  "https://my-odin-bucket.s3.eu-west-2.amazonaws.com/6cfd21bd1531475c0d00f7cc8de66fcb.png";
const DEFAULT_COVER_PIC =
  "https://my-odin-bucket.s3.eu-west-2.amazonaws.com/9cb0e642e580fca30a47e3eda534d29c.png";

export const nameRule = (field: string, label: string) =>
  body(field, `${label} must be 2 to 15 letters or numbers`)
    .trim()
    .isLength({ min: 2, max: 15 })
    .isAlphanumeric();

export const signup = [
  ...validate(
    nameRule("firstname", "First name"),
    nameRule("lastname", "Last name"),
    body("email", "A valid email is required").trim().isEmail().normalizeEmail(),
    body("password", "Password must be at least 8 characters").isLength({
      min: 8,
    })
  ),
  async (req: Request, res: Response) => {
    const { email, firstname, lastname, password } = req.body;

    if (await User.exists({ email })) {
      throw badRequest("User already exists");
    }

    const user = await User.create({
      email,
      firstname,
      lastname,
      password: await bcrypt.hash(password, 10),
      profilePicUrl: DEFAULT_PROFILE_PIC,
      coverPicUrl: DEFAULT_COVER_PIC,
      notifications: [],
    });

    res.status(201).json({ user, token: signToken(user.id) });
  },
];

export const login = [
  ...validate(body("email").trim().normalizeEmail()),
  async (req: Request, res: Response) => {
    const user = await User.findOne({ email: req.body.email }).select(
      "+password"
    );
    // the guest account logs in without typing its password
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
      throw badRequest("Invalid email or password");
    }

    res.status(200).json({ user, token: signToken(user.id) });
  },
];
