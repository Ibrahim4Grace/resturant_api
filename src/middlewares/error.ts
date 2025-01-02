import { NextFunction, Request, Response } from "express";

export class HttpError extends Error {
  status_code: number;
  success: boolean = false;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = this.constructor.name;
    this.status_code = statusCode;
  }
}

export class BadRequest extends HttpError {
  constructor(message: string) {
    super(400, message);
  }
}

export class ResourceNotFound extends HttpError {
  constructor(message: string) {
    super(404, message);
  }
}

export class Unauthorized extends HttpError {
  constructor(message: string) {
    super(401, message);
  }
}

export class Forbidden extends HttpError {
  constructor(message: string) {
    super(403, message);
  }
}

export class Conflict extends HttpError {
  constructor(message: string) {
    super(409, message);
  }
}

export class InvalidInput extends HttpError {
  constructor(message: string) {
    super(422, message);
  }
}

export class ServerError extends HttpError {
  constructor(message: string) {
    super(500, message);
  }
}

export const routeNotFound = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const message = `Route not found: ${req.originalUrl}`;
  res.status(404).json({ success: false, status: 404, message });
};

export const errorHandler = (
  err: HttpError,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const { success, status_code, message } = err;
  const cleanedMessage = message.replace(/"/g, "");
  res.status(status_code).json({
    success: success || false,
    status_code,
    message: cleanedMessage,
  });
};
