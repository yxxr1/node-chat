import {Response} from 'express'
import {Request} from '../interfaces'

interface SetNameParams {
    name: string
}
interface GetNameResponse {
    name: string | null,
    id: string
}

module.exports.post = (req: Request, res: Response) => {
    const params: SetNameParams = req.body;
    if(params.name.length < 3 || params.name.length > 12 || !/[a-zA-Zа-я0-9]/.test(params.name)){
        throw new Error();
    }

    if(req.session.name){
        res.statusCode = 403;
        res.end('forbidden');
    } else {
        req.session.name = params.name;
        const response: GetNameResponse = {name: params.name, id: req.session.userId}
        res.json(response);
    }

}

module.exports.get = (req: Request, res: Response) => {
    let response: GetNameResponse = {name: req.session.name, id: req.session.userId}
    res.json(response)
}