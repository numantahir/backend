const Sequelize = require("sequelize");
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.json')[env];
const supabase = require('../config/supabase');

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    dialect: config.dialect,
    port: config.port,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const db = {};
db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.supabase = supabase;

module.exports = db;