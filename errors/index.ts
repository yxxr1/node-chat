import {Response} from 'express'
import {Request} from '../interfaces'

module.exports = (app: any) => {
    app.use((err: Error, req: Request, res: Response, next: any) => {
        res.statusCode = 400;
        res.end('bad request');
    });
}