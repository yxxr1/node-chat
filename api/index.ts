const checkName = require('../middleware/checkName');

module.exports = (app: any) => {
  app.post('/chats', checkName, require('./chats').post)
  app.get('/chats', checkName, require('./chats').get)

  app.post('/join', checkName, require('./join').post)
  app.post('/subscribe', checkName, require('./subscribe').post)
  app.post('/publish', checkName, require('./publish').post)
  app.post('/quit', checkName, require('./quit').post)

  app.post('/username', require('./username').post)
  app.get('/username', require('./username').get)
}
