import { validationResult, matchedData, body, query, header, ValidationChain } from 'express-validator';
import { Request } from 'express';
import { urlAlphabet } from 'nanoid';
import { HttpError } from '@/utils/errors';
import { MAX_MESSAGE_LENGTH } from '@/const/limits';
import { CONNECTION_METHODS, UI_THEMES } from '@/const/settings';
import { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } from '@/const/limits';

const nameRegexp = /^[a-zA-Zа-яА-Я0-9]{3,12}$/;

export const validateParams = <Params = Record<string, unknown>>(req: Request): Params => {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    const errors = result.array();
    throw new HttpError(400, errors[0].msg);
  }

  return matchedData(req) as Params;
};

export const getNameChain = (fieldName: string): ValidationChain => body(fieldName).isString().matches(nameRegexp);

export const getPasswordChain = () =>
  body('password')
    .isString()
    .trim()
    .isLength({ min: MIN_PASSWORD_LENGTH, max: MAX_PASSWORD_LENGTH })
    .withMessage(`Password length ${MIN_PASSWORD_LENGTH}-${MAX_PASSWORD_LENGTH}`);

export const getIdChain = (fieldName: string, type: 'body' | 'query' | 'header' = 'body'): ValidationChain =>
  ({ body, query, header })[type](fieldName).isString().isLength({ min: 21, max: 21 }).isWhitelisted(urlAlphabet);

export const getSettingsChains = () => {
  const getMatch = (options: Record<string, string>) => Object.values(options).join('|');
  const getMessage = (options: Record<string, string>) =>
    Object.values(options)
      .map((value) => `'${value}'`)
      .join(', ');

  return [
    body('settings.connectionMethod')
      .matches(`^(${getMatch(CONNECTION_METHODS)})$`)
      .withMessage(`Available connections methods are ${getMessage(CONNECTION_METHODS)}`)
      .optional(),
    body('settings.theme')
      .matches(`^(${getMatch(UI_THEMES)})$`)
      .withMessage(`Available themes are ${getMessage(UI_THEMES)}`)
      .optional(),
    body('settings.isNotificationsEnabled').isBoolean().optional(),
    body('settings.isShowNotificationMessageText').isBoolean().optional(),
  ];
};

const isWhitelisted = (value: string, alphabet: string): boolean => !value.split('').find((char) => !alphabet.includes(char));

export const isId = (value: string | unknown): boolean =>
  typeof value === 'string' && value.length === 21 && isWhitelisted(value, urlAlphabet);

export const isValidMessage = (value: string | unknown): boolean => {
  if (typeof value === 'string') {
    const trimValue = value.trim();

    return !!trimValue.length && trimValue.length <= MAX_MESSAGE_LENGTH;
  }

  return false;
};

export const getTokenData = (req: Request) => {
  if (!req.tokenData) {
    throw new Error('invalid session');
  }

  return req.tokenData;
};
