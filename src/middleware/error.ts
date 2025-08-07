import { ErrorRequestHandler } from 'express';
import { HttpError } from '@utils/errors';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorMiddleware: ErrorRequestHandler = (err, req, res, next) => {
  if (err instanceof HttpError) {
    res.statusCode = err.status;
    res.json({ message: err.message });
  } else if (err.name == 'PayloadTooLargeError') {
    res.statusCode = 413;
    res.json({ message: 'Payload Too Large' });
  } else {
    console.error(err);
    res.statusCode = 500;
    res.json({ message: 'Internal server error' });
  }
};
