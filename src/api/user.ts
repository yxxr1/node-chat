import { RequestHandler } from 'express'
import { User, UserSettings } from '@interfaces/api-types';
import { validateName } from '@utils/validation';
import { CONNECTION_METHODS } from '@const/settings';

type PostInput = {
    name?: User['name'] | null;
    settings?: UserSettings;
};
type PostOutput = User;

export const post: RequestHandler<{}, PostOutput, PostInput> = (req, res) => {
    const { name, settings } = req.body;

    if (validateName(name)) {
        req.session.name = name;
    }

    if (settings) {
        const { connectionMethod } = settings;

        if (connectionMethod === CONNECTION_METHODS.HTTP || connectionMethod === CONNECTION_METHODS.WS) {
            req.session.settings = {
                ...req.session.settings,
                connectionMethod,
            };
        }
    }

    res.json({
        id: req.session.userId as User['id'],
        name: req.session.name as User['name'],
        settings: req.session.settings as UserSettings,
    });
};

type GetOutput = User;

export const get: RequestHandler<{}, GetOutput> = (req, res) => {
    res.json({
        id: req.session.userId as User['id'],
        name: req.session.name as User['name'],
        settings: req.session.settings as UserSettings,
    })
}
