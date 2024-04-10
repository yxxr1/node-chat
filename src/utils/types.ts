/* eslint-disable */

export type ParametersExceptFirst<T extends (...args: any) => any> = T extends (arg0: any, ...args: infer P) => any ? P : never;
