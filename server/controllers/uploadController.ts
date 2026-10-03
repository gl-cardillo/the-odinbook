import { body } from "express-validator";
import type { Request, Response } from "express";
import Upload from "../models/upload.js";
import {
  createUploadForm,
  deleteFile,
  fileUrl,
  IMAGE_TYPES,
  keyFromUrl,
  MAX_UPLOAD_BYTES,
} from "../config/s3.js";
import { currentUserId } from "../middleware/verifyToken.js";
import { badRequest, validate } from "../middleware/errors.js";

// an upload not used by a post or a picture within this time is deleted
const UNUSED_UPLOAD_MS = 60 * 60 * 1000;

const deleteUnusedUploads = async (userId: string) => {
  const stale = await Upload.find({
    userId,
    used: false,
    createdAt: { $lt: new Date(Date.now() - UNUSED_UPLOAD_MS) },
  });
  stale.forEach((upload) => deleteFile(fileUrl(upload.key)));
  await Upload.deleteMany({ _id: { $in: stale.map((upload) => upload._id) } });
};

// POST /uploads, a short lived form to send one image straight to the bucket
export const createUpload = [
  ...validate(
    body(
      "type",
      "Insert a valid image format (bmp, gif, jpeg, png, tiff, webp)"
    ).isIn(IMAGE_TYPES)
  ),
  async (req: Request, res: Response) => {
    const userId = currentUserId(req);
    // clean up after the uploader instead of a scheduled job
    await deleteUnusedUploads(userId);

    const { url, fields, key } = await createUploadForm(req.body.type);
    await Upload.create({ key, userId });

    res.status(201).json({
      url,
      fields,
      fileUrl: fileUrl(key),
      maxBytes: MAX_UPLOAD_BYTES,
    });
  },
];

// a picture url is accepted only if the same user uploaded it and it is not
// used yet, so nobody can point their post at someone else's files
export const claimUpload = async (userId: string, url: unknown) => {
  const key = keyFromUrl(url);
  const upload =
    key &&
    (await Upload.findOneAndUpdate(
      { key, userId, used: false },
      { used: true }
    ));
  if (!upload) {
    throw badRequest("Invalid picture url");
  }
  return fileUrl(upload.key);
};

// the file is gone, so is its record
export const forgetUpload = async (url?: string | null) => {
  const key = keyFromUrl(url);
  if (key) await Upload.deleteOne({ key });
};
