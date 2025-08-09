import { createClient } from 'redis';
import { nanoid } from 'nanoid';
import { manager, ManagerSubscribeActions } from '@core/manager';
import { Chat, ChatSubscribeActions } from '@core/chat';
import { SyncData } from '@interfaces/sync';
import { isObject } from '@utils/common';

function assertIsSyncData(data: unknown): asserts data is SyncData {
  if (isObject(data) && typeof data.instanceId === 'string' && typeof data.source === 'string' && typeof isObject(data.action)) {
    return;
  }

  throw new Error('not SyncData');
}

export class SyncManager {
  instanceId: string;
  _channelName: string;
  _publisher: ReturnType<typeof createClient>;
  _subscriber: ReturnType<typeof createClient>;

  constructor(url: string, channelName: string) {
    this.instanceId = nanoid();
    this._channelName = channelName;

    this._publisher = createClient({ url });
    this._subscriber = createClient({ url });
    this._publisher.on('error', (err) => console.log('Redis Publisher Error', err));
    this._subscriber.on('error', (err) => console.log('Redis Subscriber Error', err));
  }

  async initSync() {
    await this._publisher.connect();
    await this._subscriber.connect();

    manager.subscribe(null, this._managerHandler.bind(this), '*');
    manager.chats.forEach((chat) => {
      chat.subscribe(null, this._chatHandler.bind(this), '*');
    });

    await this._subscribe(this._subscribeHandler.bind(this));
  }

  _publish(data: SyncData) {
    this._publisher.publish(this._channelName, JSON.stringify(data));
  }
  _subscribe(cb: (data: SyncData) => void) {
    this._subscriber.subscribe(this._channelName, (data: string) => {
      let parsedData;

      try {
        parsedData = JSON.parse(data);
        assertIsSyncData(parsedData);
      } catch {
        console.error('Incorrect sync data');
      }

      if (parsedData.instanceId !== this.instanceId) {
        cb(parsedData);
      }
    });
  }

  _managerHandler(action: ManagerSubscribeActions) {
    if (action.extra?.isSyncAction) {
      return;
    }

    switch (action.type) {
      case 'CHAT_LIST_UPDATED': {
        action.payload.newChats.forEach(({ id }) => {
          manager.getChat(id)?.subscribe(null, this._chatHandler.bind(this), '*');
        });

        this._publish({ source: 'manager', action, instanceId: this.instanceId });
        break;
      }
      case 'CHAT_UPDATED':
        break;
      default: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const exhaustiveCheck: never = action;
      }
    }
  }
  _chatHandler(action: ChatSubscribeActions) {
    if (action.extra?.isSyncAction) {
      return;
    }

    switch (action.type) {
      case 'NEW_MESSAGES':
      case 'CHAT_UPDATED':
        this._publish({ source: 'chat', action, instanceId: this.instanceId });
        break;
      default:
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const exhaustiveCheck: never = action;
    }
  }

  _subscribeHandler(data: SyncData) {
    if (data.source === 'manager') {
      switch (data.action.type) {
        case 'CHAT_LIST_UPDATED':
          data.action.payload.deletedChatsIds.forEach((chatId) => manager.deleteChat(chatId, { isSyncAction: true }));
          data.action.payload.newChats.forEach(({ id }) => {
            const chat = Chat.restoreChat(id);
            chat.subscribe(null, this._chatHandler.bind(this), '*');
            manager.addChat(chat, { isSyncAction: true });
          });
          break;
        case 'CHAT_UPDATED':
          break;
        default:
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const exhaustiveCheck: never = data.action;
      }
    } else if (data.source === 'chat') {
      switch (data.action.type) {
        case 'NEW_MESSAGES':
        case 'CHAT_UPDATED':
          manager.getChat(data.action.payload.chatId)?._broadcast(data.action.payload, data.action.type, { isSyncAction: true });
          break;
        default:
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const exhaustiveCheck: never = data.action;
      }
    }
  }
}
