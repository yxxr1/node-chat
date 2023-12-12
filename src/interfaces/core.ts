export type WatcherCallback = (status: number, data: any) => void;
export type WatcherId = string;
export type UserId = string;

export type ConnectionRecord = {
  id: WatcherId;
  callback: WatcherCallback;
  userId: UserId;
}
export type WatchersDictionary = {
  [watcherId: WatcherId]: ConnectionRecord;
}

export interface Subscribable<Data = any> {
  _watchers: WatchersDictionary;

  _closeWatcher(watcherId: WatcherId, data?: Data, statusCode?: number): void;
  _broadcast(data: Data): void;
  closeUserWatchers(userId: UserId): void;
  subscribe(userId: UserId, callback: WatcherCallback): WatcherId;
  unsubscribe(watcherId: WatcherId): void;
}
