export type WatcherCallback<Data extends SubscribeAction = SubscribeAction> = (data: Data) => void;
export type WatcherId = string;
export type UserId = string;
export type DefaultType = 'DEFAULT';
export type ActionType = DefaultType | string;
export type WildcardSubscribeType = '*';
export type SubscribeAction<Type extends ActionType = ActionType, Payload extends Record<string, unknown> = Record<string, unknown>> = {
  type: Type;
  payload: Payload;
};
export type CallbackForAction<
  Actions extends SubscribeAction,
  ActionType extends SubscribeAction['type'] | WildcardSubscribeType,
> = WatcherCallback<ActionType extends WildcardSubscribeType ? Actions : Extract<Actions, { type: ActionType }>>;

export type ConnectionRecord = {
  id: WatcherId;
  callback: WatcherCallback;
  onUnsubscribed?: () => void;
  userId: UserId | null;
  type: ActionType | WildcardSubscribeType;
};
export type WatchersDictionary = {
  [watcherId: WatcherId]: ConnectionRecord;
};
