module.exports = (sequelize, DataTypes) => {
  const Recipient = sequelize.define('Recipient', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'recipient_id'
    },
    full_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "ФИО не может быть пустым"
        },
        len: {
          args: [2, 255],
          msg: "ФИО должно содержать от 2 до 255 символов"
        }
      }
    },
    street: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Улица не может быть пустой"
        }
      }
    },
    house: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Дом не может быть пустым"
        }
      }
    },
    apartment: {
      type: DataTypes.STRING(10),
      allowNull: true,
      validate: {
        isApartmentValid(value) {
          if (value && !/^\d+[a-zA-Zа-яА-Я]?$/.test(value)) {
            throw new Error('Номер квартиры должен содержать цифры и опционально букву');
          }
        }
      }
    }
  }, {
    tableName: 'recipients',
    timestamps: false
  });

  return Recipient;
};