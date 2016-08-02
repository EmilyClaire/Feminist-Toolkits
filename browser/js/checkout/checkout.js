app.config(function ($stateProvider) {
    $stateProvider.state('checkout', {
        url: '/checkout/:items/:number/:total',
        controller: 'CheckoutController',
        templateUrl: 'js/checkout/checkout.html'
    });

});

app.controller('CheckoutController', function ($scope,$rootScope,$stateParams,OrderFactory,$state,AuthService,Session,UserFactory) {
	$scope.loggedIn=AuthService.isAuthenticated();
	$scope.items=JSON.parse($stateParams.items);
	$scope.items.number=$stateParams.number;
	$scope.items.total=$stateParams.total;
	$scope.$on('$stateChangeStart', function (event, next, current) {
	    $rootScope.$broadcast('backToShopping');
	});
	$scope.submitOrder=function(shippingAddress,name,email,items){
		if($scope.loggedIn){
			UserFactory.fetchById(Session.user.id)
			.then(function(user){
				console.log(user)
			})
		}
		OrderFactory.placeOrder({shippingAddress:shippingAddress,name:name,email:email,products:$scope.items})
		.then(function(){
			$state.go('confirmation');
		})


	}
});