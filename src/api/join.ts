import { RequestHandler } from 'express'
import { manager } from '@core'
import { HttpError } from '@utils/errors'

interface JoinParams {
    chatId: string
}

export const post: RequestHandler = (req, res) => {
    const { chatId }: JoinParams = req.body;

    const chat = manager.getChat(chatId);

    if (chat) {
        chat.join(req.session.userId as string, req.session.name as string, res);
    } else {
        throw new HttpError(404, 'Chat not found');
    }
}
