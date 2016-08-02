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
                scope.orders.forEach(function(order){
                    order.total=calcTotal(order);
                })
            })
            scope.formatDate = function(date){
                  var dateOut = new Date(date);
                  return dateOut;
            };            
            var calcTotal=function(order){
                console.log(order);
                var sum=0;
                var orderProduct;
                for (var i=0; i<order.products.length; i++){
                    orderProduct=order.products[i].order_products;
                    sum+=(orderProduct.priceAtPurchase*orderProduct.quantity);
                }  
                return sum; 
            }
        }

    };

});