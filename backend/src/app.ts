import express from 'express';
import cors from 'cors';
import {ZodError} from 'zod';
import validatePhotoRouter from './routes/validatePhoto';
import avatarRouter from './routes/avatar';
import garmentRouter from './routes/garment';
import tryonRouter from './routes/tryon';
import {ApiError, sendError} from './lib/http';

export const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json({limit: '20mb'}));
  app.use(express.urlencoded({extended: true, limit: '20mb'}));

  app.get('/health', (_req: express.Request, res: express.Response) => {
    res.status(200).json({success: true, status: 'ok'});
  });

  app.use('/api', validatePhotoRouter);
  app.use('/api', avatarRouter);
  app.use('/api', garmentRouter);
  app.use('/api', tryonRouter);

  app.use((_req: express.Request, res: express.Response) => {
    return sendError(res, 404, 'not_found', 'Route not found');
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (error instanceof ApiError) {
      return sendError(res, error.statusCode, error.code, error.message, error.details);
    }

    if (error instanceof ZodError) {
      return sendError(res, 400, 'validation_error', 'Invalid request body', error.flatten());
    }

    console.error(error);
    return sendError(res, 500, 'internal_error', 'Something went wrong');
  });

  return app;
};
