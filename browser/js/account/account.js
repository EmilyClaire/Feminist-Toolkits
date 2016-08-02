app.config(function ($stateProvider) {
    $stateProvider.state('account', {
        url: '/account',
        templateUrl: 'js/account/account.html',
        controller: 'AccountController'
    });
});


app.controller('AccountController', function ($scope) {
	console.log('cogito ergo sum')
});
