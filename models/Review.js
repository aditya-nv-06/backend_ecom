const {DataTypes} = require("sequelize");
const { sequelize } = require("../config/sequelize");

const Review = sequelize.define(
    'Review',
    {
        id:{
            type:DataTypes.UUID,
            defaultValue:DataTypes.UUIDV4,
            primaryKey:true
        },
        productId:{
            type:DataTypes.UUID,
            allowNull:false
        },
        userId:{
            type:DataTypes.UUID,
            allowNull:true
        },
        rating:{
            type:DataTypes.INTEGER,
            allowNull:false,
            validate:{ min:1 , max:5 },
        },
        comment:{
            type:DataTypes.TEXT,
            allowNull:false
        } 

    });

    Review.associate = (models) => {
        Review.belongsTo(models.Product, { foreignKey: 'productId', as: 'reviewProduct' });

        // This association allows us to easily fetch the user who wrote the review when we query reviews.
        Review.belongsTo(models.User, { foreignKey: 'userId', as: 'reviewUser' });
    };

module.exports = Review;