module.exports = (sequelize, DataTypes) => {
  const Publication = sequelize.define('Publication', {
    index: {
      type: DataTypes.STRING(10),
      primaryKey: true,
      allowNull: false,
      field: 'publication_index'
    },
    type: {
      type: DataTypes.ENUM('газета', 'журнал'),
      allowNull: false,
      field: 'publication_type',
      validate: {
        isIn: {
          args: [['газета', 'журнал']],
          msg: "Тип издания должен быть 'газета' или 'журнал'"
        }
      }
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'publication_title',
      validate: {
        notEmpty: {
          msg: "Название издания не может быть пустым"
        },
        len: {
          args: [1, 255],
          msg: "Название издания должно содержать от 1 до 255 символов"
        }
      }
    },
    monthly_cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: {
          msg: "Стоимость должна быть числом"
        },
        min: {
          args: [0],
          msg: "Стоимость не может быть отрицательной"
        }
      }
    }
  }, {
    tableName: 'publications',
    timestamps: false
  });

  return Publication;
};