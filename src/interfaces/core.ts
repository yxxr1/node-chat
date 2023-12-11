import { Response } from 'express';

export type ConnectionRecord = {
  id: string;
  res: Response;
  timerId: NodeJS.Timeout;
  userId?: string;
}
export type ConnectionsDictionary = {
  [connectionId: string]: ConnectionRecord;
}

export interface Subscribable {
  connections: ConnectionsDictionary;

  _closeConnection(connectionId: string, data?: any, statusCode?: number): void;
  _broadcast(data: any): void;
  closeUserConnections(userId: string): void;
  subscribe(userId: string, res: Response): void;
}
