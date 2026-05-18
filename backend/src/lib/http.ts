import type {NextFunction, Request, RequestHandler, Response} from 'express';

export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const asyncHandler = (
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown> | unknown,
): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};

export const sendError = (
  res: Response,
  statusCode: number,
  code: string,
  error: string,
  details?: unknown,
) => {
  return res.status(statusCode).json({
    success: false,
    error,
    code,
    ...(details === undefined ? {} : {details}),
  });
};

export const sendSuccess = <T extends Record<string, unknown>>(res: Response, payload: T) => {
  return res.status(200).json({
    success: true,
    ...payload,
  });
};
