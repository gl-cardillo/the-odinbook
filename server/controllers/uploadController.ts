import { body } from "express-validator";
import type { Request, Response } from "express";
import { generateUploadURL, IMAGE_TYPES } from "../config/s3.js";
import { validate } from "../middleware/errors.js";

// POST /uploads, a short lived url to upload one image straight to the bucket
export const createUpload = [
  ...validate(
    body(
      "type",
      "Insert a valid image format (bmp, gif, jpeg, png, tiff, webp)"
    ).isIn(IMAGE_TYPES)
  ),
  async (req: Request, res: Response) => {
    const uploadUrl = await generateUploadURL(req.body.type);
    // where the image can be read once uploaded
    const fileUrl = uploadUrl.split("?")[0];
    res.status(201).json({ uploadUrl, fileUrl });
  },
];
