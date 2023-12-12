import { RequestHandler } from 'express';
import { manager } from '@core';
import { HttpError } from '@utils/errors';
import { Message, Chat } from '@interfaces/api-types';

type PostInput = {
    chatId: Chat['id'];
};
type PostOutput = {
    messages: Message[];
};

export const post: RequestHandler<{}, PostOutput, PostInput> = (req, res) => {
    const { chatId } = req.body;

    const chat = manager.getChat(chatId);

    if (chat) {
        const response = chat.join(req.session.userId as string, req.session.name as string);
        res.json(response);
    } else {
        throw new HttpError(404, 'Chat not found');
    }
}
