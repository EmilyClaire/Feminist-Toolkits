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
    //if resource is User instance, this won't work - it'd be resource.id
    return req.session.passport.user===resource.userId;
}

var ensureAdminOrSameUser=function(req,resource){
    /*NOT MIDDLEWARE. For usage example, see 'router.get('/:id'...' in orders.js*/
    //if resource is User instance, this won't work - it'd be resource.id
    if (req.user) {
        return req.user.id===resource.userId || req.user.isAdmin; }
    else {return false}
}
module.exports={ensureAuthenticated: ensureAuthenticated, ensureAdmin: ensureAdmin, ensureAppropriateUser: ensureAppropriateUser, ensureAdminOrSameUser: ensureAdminOrSameUser}
