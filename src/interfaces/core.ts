export type WatcherCallback<Data> = (data: Data | null) => void;
export type WatcherId = string;
export type UserId = string;

export type ConnectionRecord<Data> = {
  id: WatcherId;
  callback: WatcherCallback<Data>;
  userId: UserId;
};
export type WatchersDictionary<Data> = {
  [watcherId: WatcherId]: ConnectionRecord<Data>;
};

export interface Subscribable<SubscribeData, SubscribeFailureType = never> {
  _watchers: WatchersDictionary<SubscribeData>;

  _callWatcher(watcherId: WatcherId, data?: Partial<SubscribeData> | null): void;
  _broadcast(data: Partial<SubscribeData>): void;
  closeUserWatchers(userId: UserId): void;
  subscribe(userId: UserId, callback: WatcherCallback<SubscribeData>): WatcherId | SubscribeFailureType;
  unsubscribe(watcherId: WatcherId): void;
}
