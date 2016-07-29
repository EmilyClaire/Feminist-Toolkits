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
var Review = db.model('review');
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


var seedReviews = function () {

    var reviews = [
        {
            stars: 5,
            content: 'The size is decent, but the garish colors takes away some of their cuteness. I considered spray painting them all gold, or better yet, two of each a rainbow color since we are going for "rainbows and unicorns."',
            productId: 1
        },
        {
            stars: 4,
            content: 'Cute little unicorn figurines. We "hid" them in plain view around the house and everyone had fun finding them (on door frames, window sills, etc). They also made for cute table decorations. Every guest took one home with them, and at this price it was no trouble making sure we had more than enough.',
            productId: 2
        },
        {
            stars: 3,
            content: 'I ordered these as cupcake toppers. They were perfect because they were a solid plastic and not that fuzzy plastic that is on some of these figurines. They were the right size for a standard size cupcake and the accent paint was not a problem at all.',
            productId: 3
        }
    ];

    var creatingReviews = reviews.map(function (reviewObj) {
        return Review.create(reviewObj);
    });

    return Promise.all(creatingReviews);
};



db.sync({ force: true })
    .then(function () {
        return Promise.all([/*seedUsers(), */seedProducts(), seedReviews()]);
    })
    .then(function () {
        console.log(chalk.green('Seed successful!'));
        process.exit(0);
    })
    .catch(function (err) {
        console.error(err);
        process.exit(1);
    });

