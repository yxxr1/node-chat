import { RequestHandler } from 'express'
import { nanoid } from 'nanoid'
import { HttpError } from '@utils/errors'
import { manager } from '@core';
import { User } from '@interfaces/api-types';

type PostInput = {
    name: User['name'] | null;
};
type PostOutput = User | {
    id: null;
    name: null;
};

export const post: RequestHandler<{}, PostOutput, PostInput> = (req, res) => {
    const { name } = req.body;

    if (name === null) {
        if (!req.session.userId) {
            throw new HttpError(403, 'Not authorized');
        }

        manager.closeUserWatchers(req.session.userId);
        manager.chats.forEach(chat => {
            if (chat.isJoined(req.session.userId as string)) {
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

type GetOutput = User;

export const get: RequestHandler<{}, GetOutput> = (req, res) => {
    res.json({
        id: req.session.userId as string,
        name: req.session.name as string,
    })
}
