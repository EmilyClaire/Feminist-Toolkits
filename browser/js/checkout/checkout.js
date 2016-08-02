app.config(function ($stateProvider) {
    $stateProvider.state('checkout', {
        url: '/checkout/',
        controller: 'CheckoutController',
        templateUrl: 'js/checkout/checkout.html'
    });

});

app.controller('CheckoutController', function ($scope,$rootScope,$stateParams,OrderFactory,$state,AuthService,Session,UserFactory) {
	$scope.loggedIn=false;
    AuthService.getLoggedInUser().then(function (user) {
    	if(user){
        	$scope.client = user;
        	$scope.loggedIn=true;
        }
    });
	$scope.cart=$rootScope.cart;
	$scope.submitOrder=function(){
		OrderFactory.placeOrder({shippingAddress:$scope.client.address,name:$scope.client.name,email:$scope.client.email,products:$scope.items})
		.then(function(){
			$state.go('confirmation');
		})		
	}
});