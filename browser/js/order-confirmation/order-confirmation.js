app.config(function ($stateProvider) {
    $stateProvider.state('confirmation', {
        url: '/confirmation',
        controller: 'ConfirmationController',
        templateUrl: 'js/order-confirmation/order-confirmation.html'
    });

});

app.controller('CheckoutController', function ($scope) {
	console.log('WELL WHOOPDIEDOO')
});