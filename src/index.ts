import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { COMMON_CONFIG } from '@config/common';
import { corsMiddleware, errorMiddleware } from '@middleware';
import { initApi } from '@api';
import '@interfaces/session';

const app = express();

app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({ secret: COMMON_CONFIG.SESSION_SECRET }));

app.use(corsMiddleware);

initApi(app);
app.use(errorMiddleware);

app.listen(COMMON_CONFIG.PORT);
