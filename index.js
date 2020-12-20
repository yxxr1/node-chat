const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const session = require('express-session')

const app = express();

app.use( bodyParser.json() );
app.use( cookieParser() );
app.use( session({
    secret: '123'
}) );

app.use(require('./middleware/setUser'));
app.use(require('./middleware/cors'));

app.use( express.static( path.join(__dirname, 'public') ) );

require('./api')(app);
require('./errors')(app);

app.listen(8080);
