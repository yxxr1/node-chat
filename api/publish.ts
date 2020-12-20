import {Response} from 'express'
import {Request} from '../interfaces'

import {getChat} from '../core'

interface PublishParams {
  chatId: string,
  message: string
}

module.exports.post = (req: Request, res: Response) => {
  const params: PublishParams = req.body;

  const chat = getChat(params.chatId);
  if (chat) {
    chat.publish(params.message, req.session.userId, req.session.name, res);
  } else {
    res.statusCode = 404;
    res.end('chat not found');
  }
}
