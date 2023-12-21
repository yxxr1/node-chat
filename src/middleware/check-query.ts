import { RequestHandler } from 'express';

const ALLOWED_CONTENT_TYPES = ['application/json'];

export const checkQuery: RequestHandler = (req, res, next) => {
  const contentType = req.headers['content-type'];

  if (contentType && !ALLOWED_CONTENT_TYPES.includes(contentType)) {
    throw new Error();
  }

  next();
};
