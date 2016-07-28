'use strict';
var router = require('express').Router();

router.use('/members', require('./members'));

router.use('/products', require('./products'));

// Make sure this is after all of
// the registered routes!
router.use(function (req, res) {
    res.status(404).end();
});

module.exports = router;
