import { Express } from 'express';
import { checkSessionMiddleware } from '@middleware';
import { get as userGet, post as userPost } from '@api/user';
import { get as chatsGet, post as chatsPost } from '@api/chats';
import { post as joinPost } from '@api/join';
import { post as quitPost } from '@api/quit';
import { post as subscribePost } from '@api/subscribe';
import { post as publishPost } from '@api/publish';
import { post as authPost } from '@api/auth';


export const initApi = (app: Express) => {
  app.post('/auth', authPost);
  app.post('/user', checkSessionMiddleware, userPost);
  app.get('/user', checkSessionMiddleware, userGet);
  app.post('/chats', checkSessionMiddleware, chatsPost);
  app.get('/chats', checkSessionMiddleware, chatsGet);
  app.post('/join', checkSessionMiddleware, joinPost);
  app.post('/quit', checkSessionMiddleware, quitPost);
  app.post('/subscribe', checkSessionMiddleware, subscribePost);
  app.post('/publish', checkSessionMiddleware, publishPost);
}
