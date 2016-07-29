/*

This seed file is only a placeholder. It should be expanded and altered
to fit the development of your application.

It uses the same file the server uses to establish
the database connection:
--- server/db/index.js

The name of the database used is set in your environment files:
--- server/env/*

This seed file has a safety check to see if you already have users
in the database. If you are developing multiple applications with the
fsg scaffolding, keep in mind that fsg always uses the same database
name in the environment files.

*/

var chalk = require('chalk');
var db = require('./server/db');
var User = db.model('user');
var Product = db.model('product');
// var Category = db.category('category');
var Promise = require('sequelize').Promise;

var seedUsers = function () {

    var users = [
        {
            email: 'testing@fsa.com',
            password: 'password'
        },
        {
            email: 'obama@gmail.com',
            password: 'potus'
        }
    ];

    var creatingUsers = users.map(function (userObj) {
        return User.create(userObj);
    });

    return Promise.all(creatingUsers);

};

var seedProducts = function () {

    var products = [
        {
            name: 'Robot Unicorn',
            description: 'An essential tool for any delicate flower',
            inventory: 20,
            currentPrice: 10.50,
            photoUrl: '/images/robot-unicorn.png'
        },
        {
            name: 'Baking kit',
            description: 'Eat the bears, don\'t feed them',
            inventory: 190,
            currentPrice: 15.00,
            photoUrl: '/images/cupcake-tools.jpg'
        },
        {
            name: 'Skirt',
            description: 'Don\'t be a bear, be a fairy',
            inventory: 107,
            currentPrice: 30.00,
            photoUrl: '/images/skirt.jpg'
        },
        {
            name: 'Dreams',
            description: 'If you can dream it, you can do it',
            inventory: 5,
            currentPrice: 600,
            photoUrl: '/images/dreams.jpg'
        }

    ];

    var creatingProducts = products.map(function (productObj) {
        return Product.create(productObj);
    });

    return Promise.all(creatingProducts);
};

db.sync({ force: true })
    .then(function () {
        return Promise.all([/*seedUsers(), */seedProducts()]);
    })
    .then(function () {
        console.log(chalk.green('Seed successful!'));
        process.exit(0);
    })
    .catch(function (err) {
        console.error(err);
        process.exit(1);
    });

