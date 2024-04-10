import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import mongoSession from 'connect-mongodb-session';
import expressWs from 'express-ws';
import { COMMON_CONFIG } from '@config/common';
import { corsMiddleware, errorMiddleware, checkQuery } from '@middleware';
import { initApi } from '@api';
import { initWs } from '@ws';
import '@interfaces/session';

const MongoDBStore = mongoSession(session);
const store = new MongoDBStore(
  {
    uri: COMMON_CONFIG.MONGO_URL,
    databaseName: COMMON_CONFIG.MONGO_DB_NAME,
    collection: 'userSessions',
  },
  (err) => {
    if (err) {
      console.error('Error connection to MongoDB: ', err);
      process.exit(1);
    }
  },
);

const app = express();
const { app: wsApp } = expressWs(app);

app.use(checkQuery);

app.use(bodyParser.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(session({ secret: COMMON_CONFIG.SESSION_SECRET, saveUninitialized: false, resave: false, store }));

app.use(corsMiddleware);

initApi(app);
initWs(wsApp);
app.use(errorMiddleware);

app.listen(COMMON_CONFIG.PORT, () => {
  console.log('Server started');
});
