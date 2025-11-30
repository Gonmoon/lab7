const { DataTypes } = require('sequelize');

module.exports = (sequelize, Sequelize) => {
  const PasswordResetCode = sequelize.define('PasswordResetCode', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    code: {
      type: DataTypes.STRING(6),
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    isUsed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {
    tableName: 'password_reset_codes',
    indexes: [
      {
        fields: ['email', 'code']
      },
      {
        fields: ['expiresAt']
      }
    ]
  });

  // Статический метод для генерации кода
  PasswordResetCode.generateCode = async function(email) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 минут
    
    return this.create({
      email,
      code,
      expiresAt,
    });
  };

  // Статический метод для проверки кода
  PasswordResetCode.validateCode = async function(email, code) {
    return await this.findOne({
      where: {
        email,
        code,
        isUsed: false,
        expiresAt: {
          [Sequelize.Op.gt]: new Date()
        }
      }
    });
  };

  return PasswordResetCode;
};