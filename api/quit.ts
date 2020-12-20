import {Response} from 'express'
import {Request} from '../interfaces'

import {getChat, deleteChat} from '../core'

interface QuitParams {
    chatId: string
}
interface QuitResponse {
    chatId: string
}

module.exports.post = (req: Request, res: Response) => {
    const params: QuitParams = req.body;

    const chat = getChat(params.chatId);
    if(chat) {
        const count = chat.quit(req.session.userId, req.session.name);
        if(count === 0) deleteChat(params.chatId);
        let response: QuitResponse = {chatId: params.chatId};
        res.json(response);
    } else {
        res.statusCode = 404;
        res.end('chat not found');
    }

}