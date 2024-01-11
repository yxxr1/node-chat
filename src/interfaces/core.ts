export type WatcherCallback<Data> = (data: Data) => void;
export type WatcherId = string;
export type UserId = string;
export type WatcherType = 'DEFAULT' | 'UNSUBSCRIBED' | string;
export type SubscribeAction<Type = WatcherType, Payload = Record<string, any>> = { type: Type; payload: Payload };

export type ConnectionRecord<Data> = {
  id: WatcherId;
  callback: WatcherCallback<Data>;
  userId: UserId | null;
  type: WatcherType;
};
export type WatchersDictionary<Data> = {
  [watcherId: WatcherId]: ConnectionRecord<Data>;
};
