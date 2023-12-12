type WatcherCallback = (status: number, data: any) => void;
type WatcherId = string;

export type ConnectionRecord = {
  id: string;
  callback: WatcherCallback;
  userId: string;
}
export type WatchersDictionary = {
  [watcherId: WatcherId]: ConnectionRecord;
}

export interface Subscribable {
  _watchers: WatchersDictionary;

  _closeWatcher(watcherId: string, data?: any, statusCode?: number): void;
  _broadcast(data: any): void;
  closeUserWatchers(userId: string): void;
  subscribe(userId: string, callback: WatcherCallback): WatcherId;
  unsubscribe(watcherId: WatcherId): void;
}
