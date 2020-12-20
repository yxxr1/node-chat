import {Response} from 'express'
import {Request} from '../interfaces'

module.exports = (req: Request, res: Response, next: any) => {
    if(!req.session.userId){
        req.session.userId = Math.random().toString().slice(2);
        req.session.name = null;
    }
    next();
}