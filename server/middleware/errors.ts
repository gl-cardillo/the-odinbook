import mongoose from "mongoose";
import { validationResult } from "express-validator";
import type { ValidationChain } from "express-validator";
import type {
  ErrorRequestHandler,
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from "express";

// thrown from any handler, turned into a json answer by errorHandler
export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const notFound = (what: string) =>
  new HttpError(404, `${what} not found`);
export const forbidden = (message: string) => new HttpError(403, message);
export const badRequest = (message: string) => new HttpError(400, message);

// runs the checks and answers 400 with the first message if one fails
export const validate = (...chains: ValidationChain[]): RequestHandler[] => [
  ...chains,
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res
        .status(400)
        .json({ message: errors.array()[0].msg, errors: errors.array() });
      return;
    }
    next();
  },
];

// ids in the url must be valid mongo ids before any query runs
export const checkId: RequestHandler = (req, _res, next) => {
  for (const [name, value] of Object.entries(req.params)) {
    if (name.endsWith("id") || name.endsWith("Id")) {
      if (value !== "me" && !mongoose.isValidObjectId(value)) {
        throw badRequest(`Invalid ${name}`);
      }
    }
  }
  next();
};

export const routeNotFound: RequestHandler = (_req, res) => {
  res.status(404).json({ message: "Route not found" });
};

// express 5 sends errors thrown in async handlers here too
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ message: err.message });
    return;
  }
  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({ message: `Invalid ${err.path}` });
    return;
  }
  if (err instanceof mongoose.Error.ValidationError) {
    res.status(400).json({ message: Object.values(err.errors)[0].message });
    return;
  }
  // malformed json body
  if (err?.type === "entity.parse.failed") {
    res.status(400).json({ message: "Invalid JSON" });
    return;
  }
  console.error(err);
  // internal details stay in the server log
  res.status(500).json({ message: "Something went wrong" });
};
