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
            photoUrl: '/images/robot-unicorn.jpg'
        },
        {
            name: 'Baking kit',
            description: 'Bake amazing things',
            inventory: 190,
            currentPrice: 15.00,
            photoUrl: '/images/robot-unicorn.jpg'
        },
        {
            name: 'Skirt',
            description: '“I hate to hear you talk about all women as if they were fine ladies instead of rational creatures. None of us want to be in calm waters all our lives.” ― Jane Austen, Persuasion',
            inventory: 107,
            currentPrice: 30.00,
            photoUrl: '/images/skirt.jpg'
        },
        {
            name: 'Pastel pants',
            description: 'An essential tool for any delicate flower',
            inventory: 30,
            currentPrice: 20.50,
            photoUrl: '/images/robot-unicorn.jpg'
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

