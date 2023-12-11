import { RequestHandler } from 'express'
import { HttpError } from '@utils/errors';

export const checkSessionMiddleware: RequestHandler = (req, res, next) => {
    if (!req.session.userId) {
        throw new HttpError(401, 'Unauthorized');
    }

    next();
};

