import { RequestHandler } from 'express';
import { manager } from '@core';
import { HttpError } from '@utils/errors'

export const post: RequestHandler = (req, res) => {
    const { chatId } = req.body;

    const chat = manager.getChat(chatId);

    if (chat) {
        const count = chat.quit(req.session.userId as string, req.session.name as string);

        if (!count) {
            manager.deleteChat(chatId);
        }

        res.json({ chatId });
    } else {
        throw new HttpError(404, 'Chat not found');
    }

}
