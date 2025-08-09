import { ChatSubscribeActions, ManagerSubscribeActions } from '@core';

export type SyncData = (
  | {
      source: 'manager';
      action: ManagerSubscribeActions;
    }
  | {
      source: 'chat';
      action: ChatSubscribeActions;
    }
) & {
  instanceId: string;
};
