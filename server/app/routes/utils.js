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

var ensureAppropriateUser=function(req,resource){
    /*NOT MIDDLEWARE. For usage example, see 'router.get('/:id'...' in orders.js*/
    return req.session.passport.user===resource.userId;
}

module.exports={ensureAuthenticated: ensureAuthenticated, ensureAdmin: ensureAdmin, ensureAppropriateUser: ensureAppropriateUser}