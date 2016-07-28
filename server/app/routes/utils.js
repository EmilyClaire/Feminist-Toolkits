var ensureAuthenticated = function (req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.status(401).end();
    }
};

var ensureAdmin = function (req, res, next) {
    if (req.user&&req.user.isAdmin) {
           next();
    } else {
        res.status(401).end();
    }
};

//router.param
module.exports={ensureAuthenticated: ensureAuthenticated, ensureAdmin: ensureAuthenticated}