import {Response} from 'express'
import {Request} from '../interfaces'

module.exports = (req: Request, res: Response, next: any) => {
    if(req.session.name !== null) {
        next();
    } else throw Error();
}