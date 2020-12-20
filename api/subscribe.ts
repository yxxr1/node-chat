import {Response} from 'express'
import {Request} from '../interfaces'
import {getChat} from '../core'

interface SubscribeParams {
  chatId: string
}

module.exports.post = (req: Request, res: Response) => {
  const params: SubscribeParams = req.body;

  const chat = getChat(params.chatId);
  if(chat) {
    chat.subscribe(req.session.userId, res);
  } else {
    res.statusCode = 404;
    res.end('chat not found');
  }

}
