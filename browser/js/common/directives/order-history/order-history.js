app.directive('orderHistory', function ($state,OrderFactory,AuthService) {
    return {
        restrict: 'E',
        scope: {},
        templateUrl: 'js/common/directives/order-history/order-history.html',
        link: function (scope) {
            AuthService.getLoggedInUser()
            .then(function(currUser){
                return OrderFactory.fetchUsersOrders(currUser.id)
            })
            .then(function(orders){
                scope.orders=orders;
            })
            
        }
    };

});