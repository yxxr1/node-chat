export type WatcherCallback<Data extends SubscribeAction['payload'] = SubscribeAction['payload']> = (data: Data) => void;
export type WatcherId = string;
export type UserId = string;
export type DefaultType = 'DEFAULT';
export type WatcherType = DefaultType | string;
export type SubscribeAction<Type extends WatcherType = WatcherType, Payload extends Record<string, unknown> = Record<string, unknown>> = {
  type: Type;
  payload: Payload;
};
export type CallbackForAction<Actions extends SubscribeAction, ActionType extends SubscribeAction['type']> = WatcherCallback<
  Extract<Actions, { type: ActionType }>['payload']
>;

export type ConnectionRecord = {
  id: WatcherId;
  callback: WatcherCallback;
  onUnsubscribed?: () => void;
  userId: UserId | null;
  type: WatcherType;
};
export type WatchersDictionary = {
  [watcherId: WatcherId]: ConnectionRecord;
};
