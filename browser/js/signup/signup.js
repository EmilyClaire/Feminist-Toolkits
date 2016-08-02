app.config(function ($stateProvider) {

    $stateProvider.state('signup', {
        url: '/signup',
        templateUrl: 'js/signup/signup.html',
        controller: 'SignupCtrl'
    });

});

app.controller('SignupCtrl', function ($scope, $http) {
// AuthService, $state,
    $scope.login = {};
    $scope.error = null;

    $scope.submitNewUser = function (loginInfo) {
        $scope.error = null;
        if(!$scope.signupForm.$valid) {
            throw new Error('Validation error.')
        }
        $http.post('/api/users', loginInfo)
        .then(function (user) {
            if(user) {AuthService.login(loginInfo)}
            else {throw new Error('Unable to create account.')}
        }).then(function () {
            $state.go('home');
        }).catch(function () {
            $scope.error = 'Unable to complete login.';
        });

        // AuthService.login(loginInfo).then(function () {
        //     $state.go('home');
        // }).catch(function () {
        //     $scope.error = 'Invalid login credentials.';
        // });

    };

});
