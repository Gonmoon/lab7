const { Sequelize } = require('sequelize');
const config = require('../config/config.json');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  }
);

const db = {
  Sequelize,
  sequelize,
  Publication: require('./publication')(sequelize, Sequelize),
  Recipient: require('./recipient')(sequelize, Sequelize),
  Subscription: require('./subscription')(sequelize, Sequelize),
  User: require('./user')(sequelize, Sequelize),
  PasswordResetCode: require('./passwordResetCode')(sequelize, Sequelize),
};

// Определение связей между существующими моделями
db.Recipient.hasMany(db.Subscription, {
  foreignKey: 'recipient_id',
  as: 'subscriptions'
});
db.Subscription.belongsTo(db.Recipient, {
  foreignKey: 'recipient_id',
  as: 'recipient'
});

db.Publication.hasMany(db.Subscription, {
  foreignKey: 'publication_index',
  as: 'subscriptions'
});
db.Subscription.belongsTo(db.Publication, {
  foreignKey: 'publication_index',
  as: 'publication'
});

// Связи для аутентификации
db.User.hasMany(db.PasswordResetCode, {
  foreignKey: 'email',
  sourceKey: 'email',
  as: 'resetCodes'
});
db.PasswordResetCode.belongsTo(db.User, {
  foreignKey: 'email',
  targetKey: 'email',
  as: 'user'
});

module.exports = db;
