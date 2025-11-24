module.exports = (sequelize, DataTypes) => {
  const Subscription = sequelize.define('Subscription', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'subscription_id'
    },
    recipient_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'recipients',
        key: 'recipient_id'
      }
    },
    publication_index: {
      type: DataTypes.STRING(10),
      allowNull: false,
      references: {
        model: 'publications',
        key: 'publication_index'
      }
    },
    duration_months: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isIn: {
          args: [[1, 3, 6]],
          msg: "Срок подписки должен быть 1, 3 или 6 месяцев"
        }
      }
    },
    start_month: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: {
          args: [1],
          msg: "Месяц должен быть от 1 до 12"
        },
        max: {
          args: [12],
          msg: "Месяц должен быть от 1 до 12"
        }
      }
    },
    start_year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: {
          args: [2000],
          msg: "Год должен быть не ранее 2000"
        },
        max: {
          args: [2100],
          msg: "Год должен быть не позднее 2100"
        }
      }
    }
  }, {
    tableName: 'subscriptions',
    timestamps: false,
    indexes: [
      {
        fields: ['recipient_id']
      },
      {
        fields: ['publication_index']
      },
      {
        fields: ['start_year', 'start_month']
      }
    ]
  });

  return Subscription;
};