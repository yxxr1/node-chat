import { validationResult, matchedData, body, ValidationChain } from 'express-validator';
import { Request } from 'express';
import { urlAlphabet } from 'nanoid';
import { HttpError } from '@utils/errors';
import { MAX_MESSAGE_LENGTH } from '@const/limits';
import { CONNECTION_METHODS, UI_THEMES } from '@const/settings';

const nameRegexp = /^[a-zA-Zа-яА-Я0-9]{3,12}$/;

export const validateParams = <Params = Record<string, any>>(req: Request): Params => {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    const errors = result.array();
    throw new HttpError(400, errors[0].msg);
  }

  return matchedData(req) as Params;
};

export const getNameChain = (fieldName: string, allowNull = false): ValidationChain =>
  body(fieldName)
    .exists({ values: allowNull ? 'undefined' : 'null' })
    .if((value) => value !== null)
    .isString()
    .matches(nameRegexp);

export const getIdChain = (fieldName: string): ValidationChain =>
  body(fieldName).isString().isLength({ min: 21, max: 21 }).isWhitelisted(urlAlphabet);

export const getSettingsChains = () => [
  body('settings.connectionMethod')
    .matches(`^(${CONNECTION_METHODS.HTTP}|${CONNECTION_METHODS.WS})$`)
    .withMessage(`Available connections methods are '${CONNECTION_METHODS.HTTP}', '${CONNECTION_METHODS.WS}'`)
    .optional(),
  body('settings.theme')
    .matches(`^(${UI_THEMES.LIGHT}|${UI_THEMES.DARK})$`)
    .withMessage(`Available themes are '${UI_THEMES.LIGHT}', '${UI_THEMES.DARK}'`)
    .optional(),
];

const isWhitelisted = (value: string, alphabet: string): boolean => !value.split('').find((char) => !alphabet.includes(char));

export const isId = (value: any): boolean => typeof value === 'string' && value.length === 21 && isWhitelisted(value, urlAlphabet);

export const isValidMessage = (value: any): boolean => {
  if (typeof value === 'string') {
    const trimValue = value.trim();

    return !!trimValue.length && trimValue.length <= MAX_MESSAGE_LENGTH;
  }

  return false;
};
