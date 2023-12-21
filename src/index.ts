import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import expressWs from 'express-ws';
import { COMMON_CONFIG } from '@config/common';
import { corsMiddleware, errorMiddleware, checkQuery } from '@middleware';
import { initApi } from '@api';
import { initWs } from '@ws';
import '@interfaces/session';

const app = express();
const { app: wsApp } = expressWs(app);

app.use(checkQuery);

app.use(bodyParser.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(session({ secret: COMMON_CONFIG.SESSION_SECRET }));

app.use(corsMiddleware);

initApi(app);
initWs(wsApp);
app.use(errorMiddleware);

app.listen(COMMON_CONFIG.PORT);
