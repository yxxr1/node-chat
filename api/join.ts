import {Response} from 'express'
import {Request} from '../interfaces'

import {getChat} from '../core'

interface JoinParams {
    chatId: string
}

module.exports.post = (req: Request, res: Response) => {
    const params: JoinParams = req.body;

    const chat = getChat(params.chatId);
    if(chat) {
        chat.join(req.session.userId, req.session.name, res);
    } else {
        res.statusCode = 404;
        res.end('chat not found');
    }

}