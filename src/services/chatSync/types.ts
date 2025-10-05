import type { ChatSubscribeActions, ManagerSubscribeActions } from '@services/chat';

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
