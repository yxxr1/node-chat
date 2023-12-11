import { ErrorRequestHandler } from 'express'
import { HttpError } from '@utils/errors'

export const errorMiddleware: ErrorRequestHandler = (err, req, res, next) => {
    if (err instanceof HttpError) {
        res.statusCode = err.status;
        res.json({ message: err.message });
    } else {
        res.statusCode = 400;
        res.json({ message: 'Bad Request' });
    }
}
