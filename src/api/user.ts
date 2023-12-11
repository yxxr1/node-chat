import { RequestHandler } from 'express'
import { nanoid } from 'nanoid'
import { HttpError } from '@utils/errors'
import { manager } from '@core';

export const post: RequestHandler = (req, res) => {
    const { name } = req.body;

    if (name === null) {
        if (!req.session.userId) {
            throw new HttpError(403, 'Not authorized');
        }

        manager.closeUserConnections(req.session.userId);
        manager.chats.forEach(chat => {
            if (chat.joinedUsers.includes(req.session.userId as string)) {
                chat.quit(req.session.userId as string, req.session.name as string);
            }
        });

        req.session.destroy(() => {
            res.json({ id: null, name: null });
        });
    } else {
        if (req.session.userId) {
            throw new HttpError(403, 'Already authorized');
        }

        if (!name || !/^[a-zA-Zа-я0-9]{3,12}$/.test(name)) {
            throw new HttpError(403, 'Invalid name');
        }

        const id = nanoid();

        req.session.userId = id;
        req.session.name = name;

        res.json({ id, name });
    }
}

export const get: RequestHandler = (req, res) => {
    res.json({
        id: req.session.userId,
        name: req.session.name,
    })
}
