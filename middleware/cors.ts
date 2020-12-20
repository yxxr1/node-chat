import {Response} from 'express'
import {Request} from '../interfaces'

module.exports = (req: Request, res: Response, next: any) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'content-type');
    next();
}