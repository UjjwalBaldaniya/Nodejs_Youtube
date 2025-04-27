import { ApiError } from "../utils/ApiError.js";

const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json(err.toJSON());
  }

  return res.status(500).json({
    statusCode: 500,
    message: "Internal Server Error",
    success: false,
    data: null,
    errors: [err.message || "Something went wrong"],
  });
};

export default errorHandler;
