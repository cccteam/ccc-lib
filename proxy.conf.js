var process = require('process');

module.exports = {
  '/api/': {
    target: 'http://127.0.0.1:' + process.env.APP_PORT,
    secure: false,
    logLevel: 'debug',
    changeOrigin: true,
    headers: {
      Connection: 'Keep-Alive',
    },
  },
};
