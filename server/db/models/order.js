'use strict';
var Sequelize = require('sequelize');

var db = require('../_db');
var OrderProduct=require('./order-products');

module.exports = db.define('order', {
        date: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
        },
        status: {
            type: Sequelize.STRING,
            defaultValue: 'Not shipped'
        },
        shippingAddress: {
            type: Sequelize.STRING,
            allowNull: false
        }
    },{
        instanceMethods: {
            fetchProducts: function () {
                OrderProduct.findAll({where: {orderId: this.id}})
                .then(function(products){
                    return products;
                })
            }
        }
    });

//EXTRA NOTES:
// Need to connect with session id?

// Orders must belong to a user OR guest session (authenticated vs unauthenticated)
// Orders must contain line items that capture the price, current product ID and quantity
// If a user completes an order, that order should keep the price of the item at the time when they checked out even if the price of the product later changes

// When you add an item to an order it creates a column for price at purchase and number of items, subtotal

      // .then(function(){
      //   return Order.findOne({
      //         where: { shippingAddress: 'the cupboard'},
      //         include: { model: Product}
      //       })
      // }) 