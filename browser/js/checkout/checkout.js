app.config(function ($stateProvider) {
    $stateProvider.state('checkout', {
        url: '/checkout/:items/:number/:total',
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
	$scope.items=JSON.parse($stateParams.items);
	$scope.items.number=$stateParams.number;
	$scope.items.total=$stateParams.total;
	$scope.$on('$stateChangeStart', function (event, next, current) {
	    $rootScope.$broadcast('backToShopping');
	});
	$scope.submitOrder=function(){
		OrderFactory.placeOrder({shippingAddress:$scope.client.address,name:$scope.client.name,email:$scope.client.email,products:$scope.items})
		.then(function(){
			$state.go('confirmation');
		})		
	}
});