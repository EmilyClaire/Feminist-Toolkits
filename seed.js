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
var Category = db.model('category');
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
            description: 'Wear this when you want to be a fairy',
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
        },
        {
            name: 'Antidote for toxic masculinity',
            description: 'Drink this',
            inventory: 3,
            currentPrice: 1000,
            photoUrl: '/images/antidote.jpg'
        },
        {
            name: 'Care bear onesie',
            description: 'This care bear onesie will take you over the rainbow!',
            inventory: 20,
            currentPrice: 99,
            photoUrl: '/images/carebear-onesie.jpg'
        },
        {
            name: 'Unicorn leggings',
            description: 'No words',
            inventory: 1,
            currentPrice: 50,
            photoUrl: '/images/unicorn-pants.jpg'
        },
        {
            name: 'Sleeping bag bear',
            description: 'Never feel unsafe again',
            inventory: 11,
            currentPrice: 1200,
            photoUrl: '/images/sleeping-bag-bear.jpg'
        },
        {
            name: 'Magic unicorn cake',
            description: 'Order this for any event that calls for some extra magic',
            inventory: 0,
            currentPrice: 110,
            photoUrl: '/images/unicorn-cake.jpg'
        }
    ];

    var creatingProducts = products.map(function (productObj) {
        return Product.create(productObj);
    });

    return Promise.all(creatingProducts);
};

var seedCategories = function () {

    var categories = [
        {
            name: 'Defense tools'
        },
        {
            name: 'Femininity'
        },
        {
            name: 'Edibles'
        },
        {
            name: 'Clothing/other'
        }
    ]

    var creatingCategories = categories.map(function (categoryObj) {
        return Category.create(categoryObj);
    });

    return Promise.all(creatingCategories);

}


var seedReviews = function () {

    var reviews = [
        {
            stars: 5,
            content: 'The size is decent, but the garish colors takes away some of their cuteness. I considered spray painting them all gold, or better yet, two of each a rainbow color since we are going for "rainbows and unicorns."'
        },
        {
            stars: 4,
            content: 'Cute little unicorn figurines. We "hid" them in plain view around the house and everyone had fun finding them (on door frames, window sills, etc). They also made for cute table decorations. Every guest took one home with them, and at this price it was no trouble making sure we had more than enough.'
        },
        {
            stars: 3,
            content: 'I ordered these as cupcake toppers. They were perfect because they were a solid plastic and not that fuzzy plastic that is on some of these figurines. They were the right size for a standard size cupcake and the accent paint was not a problem at all.'
        },
        {
            stars: 5,
            content: 'Dream interpretation and lucid dreaming helped me with uncovering the power of my subconscious mind. It teaches me the causes of dreaming, the meanings of common dreams as well as methods of analyzing my own dreams. The mysterious practice of lucid dreaming is supportive of having a realization about the power of my subconscious mind.'
        },
        {
            stars: 5,
            content: 'This is the best!!!! It works every time and makes all men wear pink and bake fairy cupcakes all day long.'
        },
        {
            stars: 5,
            content: 'This care bear onesie is the best! It is so comfortable, friendly and feminine, I just want to wear it all the time.'
        },
        {
            stars: 4,
            content: 'I love these leggings and originally bought them for my job, I\'m a gymnastics coach. I get compliments on these everywhere I go, they are identical to the picture, soft, shiny, and high waisted, although I will say they may not look right on a shorter woman.'
        },
        {
            stars: 5,
            content: 'I felt so safe and warm in this while camping. Every woman should own one of these.'
        }
    ];

    var creatingReviews = reviews.map(function (reviewObj) {
        return Review.create(reviewObj);
    });

    return Promise.all(creatingReviews);
};

var productArr,
    categoryArr,
    reviewArr;

db.sync({ force: true })
    .then(function () {
        return Promise.all([/*seedUsers(), */seedProducts(), seedCategories(), seedReviews()]);
    })
    .then(function (seedArray) {
        productArr = seedArray[0];
        categoryArr = seedArray[1];
        reviewArr = seedArray[2];
        return Promise.all(reviewArr.map(function (review, i) {
            return review.setProduct(productArr[i]);
        }));
    })
    .then(function () {
        return Promise.all([
            productArr[0].addCategories([categoryArr[0], categoryArr[1]]),
            productArr[1].addCategories([categoryArr[2]]),
            productArr[2].addCategories([categoryArr[1], categoryArr[3]]),
            productArr[3].addCategories([categoryArr[1]]),
            productArr[4].addCategories([categoryArr[1], categoryArr[2]]),
            productArr[5].addCategories([categoryArr[1], categoryArr[3]]),
            productArr[6].addCategories([categoryArr[1], categoryArr[3]]),
            productArr[7].addCategories([categoryArr[0], categoryArr[3]]),
            productArr[8].addCategories([categoryArr[1], categoryArr[2]])
        ]);
    })
    .then(function () {
        console.log(chalk.green('Seed successful!'));
        process.exit(0);
    })
    .catch(function (err) {
        console.error(err);
        process.exit(1);
    });

