import type { Chat as ChatType } from '@/model/chats';

export type WatcherCallback<Data extends SubscribeAction = SubscribeAction> = (data: Data) => void;
export type WatcherId = string;
export type UserId = string;
export type WildcardSubscribeType = '*';
export type SubscribeAction<Type extends string = string, Payload extends Record<string, unknown> = Record<string, unknown>> = {
  type: Type;
  payload: Payload;
  extra?: Record<string, unknown>;
};
export type CallbackForAction<
  Actions extends SubscribeAction,
  ActionType extends SubscribeAction['type'] | WildcardSubscribeType,
> = WatcherCallback<ActionType extends WildcardSubscribeType ? Actions : Extract<Actions, { type: ActionType }>>;
export type PayloadForAction<Actions extends SubscribeAction, ActionType extends SubscribeAction['type']> = Extract<
  Actions,
  { type: ActionType }
>['payload'];

export type ConnectionRecord<Meta extends Record<string, string>> = {
  id: WatcherId;
  type: string | WildcardSubscribeType;
  callback: WatcherCallback;
  meta?: Meta;
  onUnsubscribed?: () => void;
};
export type WatchersDictionary<Meta extends Record<string, string>> = {
  [watcherId: WatcherId]: ConnectionRecord<Meta>;
};

export type WatcherMeta = {
  userId: string;
  sessionId: string;
};

export type ChatEntity = Pick<ChatType, 'id' | 'name' | 'messages'> & {
  joinedCount: number | null;
};
