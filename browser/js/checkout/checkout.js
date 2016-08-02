app.config(function ($stateProvider) {
    $stateProvider.state('checkout', {
        url: '/checkout/',
        controller: 'CheckoutController',
        templateUrl: 'js/checkout/checkout.html'
    });

});

app.controller('CheckoutController', function ($scope,$stateParams,OrderFactory,$state,AuthService,Session,UserFactory,$cookieStore,$rootScope) {
	$scope.loggedIn=false;
    AuthService.getLoggedInUser().then(function (user) {
    	if(user){
        	$scope.client = user;
        	$scope.loggedIn=true;
        }
    });
	$scope.cart=$cookieStore.get('cart');
	$scope.submitOrder=function(){
		OrderFactory.placeOrder({shippingAddress:$scope.client.address,name:$scope.client.name,email:$scope.client.email,products:$scope.cart.items})
		.then(function(){
			$state.go('confirmation');
			$rootScope.$broadcast('emptyCart',{});
		})		
	}
});