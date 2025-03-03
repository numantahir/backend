const env = process.env.NODE_ENV || 'development';
const config = require('./config.json')[env];


module.exports = {
  gmail: {
    user: config.gmail.user,
    pass: config.gmail.pass
    // clientId: config.gmail.clientId,
    // clientSecret: config.gmail.clientSecret,
    // refreshToken: config.gmail.refreshToken
  }
};