'use strict';

window.app = angular.module('FullstackGeneratedApp', ['fsaPreBuilt', 'ui.router', 'ui.bootstrap', 'ngAnimate']);

app.config(function ($urlRouterProvider, $locationProvider) {
    // This turns off hashbang urls (/#about) and changes it to something normal (/about)
    $locationProvider.html5Mode(true);
    // If we go to a URL that ui-router doesn't have registered, go to the "/" url.
    $urlRouterProvider.otherwise('/');
    // Trigger page refresh when accessing an OAuth route
    $urlRouterProvider.when('/auth/:provider', function () {
        window.location.reload();
    });
});

// This app.run is for controlling access to specific states.
app.run(function ($rootScope, AuthService, $state) {

    // The given state requires an authenticated user.
    var destinationStateRequiresAuth = function destinationStateRequiresAuth(state) {
        return state.data && state.data.authenticate;
    };

    // $stateChangeStart is an event fired
    // whenever the process of changing a state begins.
    $rootScope.$on('$stateChangeStart', function (event, toState, toParams) {

        if (!destinationStateRequiresAuth(toState)) {
            // The destination state does not require authentication
            // Short circuit with return.
            return;
        }

        if (AuthService.isAuthenticated()) {
            // The user is authenticated.
            // Short circuit with return.
            return;
        }

        // Cancel navigating to new state.
        event.preventDefault();

        AuthService.getLoggedInUser().then(function (user) {
            // If a user is retrieved, then renavigate to the destination
            // (the second time, AuthService.isAuthenticated() will work)
            // otherwise, if no user is logged in, go to "login" state.
            if (user) {
                $state.go(toState.name, toParams);
            } else {
                $state.go('login');
            }
        });
    });
});

app.config(function ($stateProvider) {

    // Register our *about* state.
    $stateProvider.state('about', {
        url: '/about',
        controller: 'AboutController',
        templateUrl: 'js/about/about.html'
    });
});

app.controller('AboutController', function ($scope, FullstackPics) {

    // Images of beautiful Fullstack people.
    $scope.images = _.shuffle(FullstackPics);
});
app.config(function ($stateProvider) {
    $stateProvider.state('checkout', {
        url: '/checkout/:items/:number/:total',
        controller: 'CheckoutController',
        templateUrl: 'js/checkout/checkout.html'
    });
});

app.controller('CheckoutController', function ($scope, $rootScope, $stateParams) {
    $scope.items = JSON.parse($stateParams.items);
    $scope.items.number = $stateParams.number;
    $scope.items.total = $stateParams.total;
    $scope.items.ids = $scope.items.map(function (item) {
        return item.id;
    });
    console.log($scope.items.ids);
    $scope.$on('$stateChangeStart', function (event, next, current) {
        $rootScope.$broadcast('backToShopping');
    });
    $scope.submitOrder = function (shippingAddress, name, email) {
        console.log(shippingAddress, name, email);
        /*NEEDS TO BE CONNECTED WITH ROUTES*/
    };
});
app.config(function ($stateProvider) {
    $stateProvider.state('docs', {
        url: '/docs',
        templateUrl: 'js/docs/docs.html'
    });
});

(function () {

    'use strict';

    // Hope you didn't forget Angular! Duh-doy.

    if (!window.angular) throw new Error('I can\'t find Angular!');

    var app = angular.module('fsaPreBuilt', []);

    app.factory('Socket', function () {
        if (!window.io) throw new Error('socket.io not found!');
        return window.io(window.location.origin);
    });

    // AUTH_EVENTS is used throughout our app to
    // broadcast and listen from and to the $rootScope
    // for important events about authentication flow.
    app.constant('AUTH_EVENTS', {
        loginSuccess: 'auth-login-success',
        loginFailed: 'auth-login-failed',
        logoutSuccess: 'auth-logout-success',
        sessionTimeout: 'auth-session-timeout',
        notAuthenticated: 'auth-not-authenticated',
        notAuthorized: 'auth-not-authorized'
    });

    app.factory('AuthInterceptor', function ($rootScope, $q, AUTH_EVENTS) {
        var statusDict = {
            401: AUTH_EVENTS.notAuthenticated,
            403: AUTH_EVENTS.notAuthorized,
            419: AUTH_EVENTS.sessionTimeout,
            440: AUTH_EVENTS.sessionTimeout
        };
        return {
            responseError: function responseError(response) {
                $rootScope.$broadcast(statusDict[response.status], response);
                return $q.reject(response);
            }
        };
    });

    app.config(function ($httpProvider) {
        $httpProvider.interceptors.push(['$injector', function ($injector) {
            return $injector.get('AuthInterceptor');
        }]);
    });

    app.service('AuthService', function ($http, Session, $rootScope, AUTH_EVENTS, $q) {

        function onSuccessfulLogin(response) {
            var data = response.data;
            Session.create(data.id, data.user);
            $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
            return data.user;
        }

        // Uses the session factory to see if an
        // authenticated user is currently registered.
        this.isAuthenticated = function () {
            return !!Session.user;
        };

        //Uses the session factory to see if the user is an admin
        this.isAdmin = function () {
            return Session.user.isAdmin;
        };

        this.getLoggedInUser = function (fromServer) {

            // If an authenticated session exists, we
            // return the user attached to that session
            // with a promise. This ensures that we can
            // always interface with this method asynchronously.

            // Optionally, if true is given as the fromServer parameter,
            // then this cached value will not be used.

            if (this.isAuthenticated() && fromServer !== true) {
                return $q.when(Session.user);
            }

            // Make request GET /session.
            // If it returns a user, call onSuccessfulLogin with the response.
            // If it returns a 401 response, we catch it and instead resolve to null.
            return $http.get('/session').then(onSuccessfulLogin).catch(function () {
                return null;
            });
        };

        this.login = function (credentials) {
            return $http.post('/login', credentials).then(onSuccessfulLogin).catch(function () {
                return $q.reject({ message: 'Invalid login credentials.' });
            });
        };

        this.logout = function () {
            return $http.get('/logout').then(function () {
                Session.destroy();
                $rootScope.$broadcast(AUTH_EVENTS.logoutSuccess);
            });
        };
    });

    app.service('Session', function ($rootScope, AUTH_EVENTS) {

        var self = this;

        $rootScope.$on(AUTH_EVENTS.notAuthenticated, function () {
            self.destroy();
        });

        $rootScope.$on(AUTH_EVENTS.sessionTimeout, function () {
            self.destroy();
        });

        this.id = null;
        this.user = null;

        this.create = function (sessionId, user) {
            this.id = sessionId;
            this.user = user;
        };

        this.destroy = function () {
            this.id = null;
            this.user = null;
        };
    });
})();

app.config(function ($stateProvider) {
    $stateProvider.state('home', {
        url: '/',
        templateUrl: 'js/home/home.html'
    });
});
app.config(function ($stateProvider) {

    $stateProvider.state('login', {
        url: '/login',
        templateUrl: 'js/login/login.html',
        controller: 'LoginCtrl'
    });
});

app.controller('LoginCtrl', function ($scope, AuthService, $state) {

    $scope.login = {};
    $scope.error = null;

    $scope.sendLogin = function (loginInfo) {

        $scope.error = null;

        AuthService.login(loginInfo).then(function () {
            $state.go('home');
        }).catch(function () {
            $scope.error = 'Invalid login credentials.';
        });
    };
});
app.config(function ($stateProvider) {

    $stateProvider.state('membersOnly', {
        url: '/members-area',
        template: '<img ng-repeat="item in stash" width="300" ng-src="{{ item }}" />',
        controller: function controller($scope, SecretStash) {
            SecretStash.getStash().then(function (stash) {
                $scope.stash = stash;
            });
        },
        // The following data.authenticate is read by an event listener
        // that controls access to this state. Refer to app.js.
        data: {
            authenticate: true
        }
    });
});

app.factory('SecretStash', function ($http) {

    var getStash = function getStash() {
        return $http.get('/api/members/secret-stash').then(function (response) {
            return response.data;
        });
    };

    return {
        getStash: getStash
    };
});
app.config(function ($stateProvider) {

    $stateProvider.state('product', {
        url: '/products/:productId',
        controller: 'ProductController',
        templateUrl: 'js/products/product.html',
        resolve: {
            theProduct: function theProduct(ProductsFactory, $stateParams) {
                return ProductsFactory.fetchById($stateParams.productId);
            }
        }
    });
});

app.controller('ProductController', function ($scope, theProduct, $rootScope) {

    $scope.product = theProduct.product;
    $scope.categories = theProduct.categories;

    $scope.addItem = function () {
        $rootScope.$broadcast('addingItemToCart', theProduct.product);
    };
});

app.config(function ($stateProvider) {

    $stateProvider.state('products', {
        url: '/products',
        controller: 'ProductsController',
        templateUrl: 'js/products/products.html'
    });

    $stateProvider.state('productsByCategory', {
        url: '/products/categories/:categoryId',
        controller: 'ProductsController',
        templateUrl: 'js/products/products.html'
    });
});

app.controller('ProductsController', function ($scope, ProductsFactory, CategoryFactory, $state, $stateParams) {

    if ($stateParams.categoryId) {
        ProductsFactory.fetchAll($stateParams.categoryId).then(function (products) {
            $scope.products = products;
        });
    } else {
        ProductsFactory.fetchAll().then(function (products) {
            $scope.products = products;
        });
    }

    CategoryFactory.fetchAll().then(function (categories) {
        $scope.selectedCategory = categories.filter(function (category) {
            return category.id === Number($stateParams.categoryId);
        })[0];
        $scope.categories = categories;
    });

    $scope.onSelectCategory = function () {
        $state.go('productsByCategory', { categoryId: $scope.selectedCategory.id });
    };
});

app.config(function ($stateProvider) {

    $stateProvider.state('reviews', {
        url: '/products/:productId/reviews',
        controller: 'ReviewsController',
        templateUrl: '/js/reviews/reviews.html',
        resolve: {
            reviews: function reviews(ReviewsFactory, $stateParams) {
                return ReviewsFactory.fetchAll($stateParams.productId);
            }
        }
    });
});

app.controller('ReviewsController', function ($scope, reviews) {

    $scope.reviews = reviews;
    console.log('THIS IS SCOPE.REVIEWS ', $scope.reviews);
});

app.factory('FullstackPics', function () {
    return ['https://pbs.twimg.com/media/B7gBXulCAAAXQcE.jpg:large', 'https://fbcdn-sphotos-c-a.akamaihd.net/hphotos-ak-xap1/t31.0-8/10862451_10205622990359241_8027168843312841137_o.jpg', 'https://pbs.twimg.com/media/B-LKUshIgAEy9SK.jpg', 'https://pbs.twimg.com/media/B79-X7oCMAAkw7y.jpg', 'https://pbs.twimg.com/media/B-Uj9COIIAIFAh0.jpg:large', 'https://pbs.twimg.com/media/B6yIyFiCEAAql12.jpg:large', 'https://pbs.twimg.com/media/CE-T75lWAAAmqqJ.jpg:large', 'https://pbs.twimg.com/media/CEvZAg-VAAAk932.jpg:large', 'https://pbs.twimg.com/media/CEgNMeOXIAIfDhK.jpg:large', 'https://pbs.twimg.com/media/CEQyIDNWgAAu60B.jpg:large', 'https://pbs.twimg.com/media/CCF3T5QW8AE2lGJ.jpg:large', 'https://pbs.twimg.com/media/CAeVw5SWoAAALsj.jpg:large', 'https://pbs.twimg.com/media/CAaJIP7UkAAlIGs.jpg:large', 'https://pbs.twimg.com/media/CAQOw9lWEAAY9Fl.jpg:large', 'https://pbs.twimg.com/media/B-OQbVrCMAANwIM.jpg:large', 'https://pbs.twimg.com/media/B9b_erwCYAAwRcJ.png:large', 'https://pbs.twimg.com/media/B5PTdvnCcAEAl4x.jpg:large', 'https://pbs.twimg.com/media/B4qwC0iCYAAlPGh.jpg:large', 'https://pbs.twimg.com/media/B2b33vRIUAA9o1D.jpg:large', 'https://pbs.twimg.com/media/BwpIwr1IUAAvO2_.jpg:large', 'https://pbs.twimg.com/media/BsSseANCYAEOhLw.jpg:large', 'https://pbs.twimg.com/media/CJ4vLfuUwAAda4L.jpg:large', 'https://pbs.twimg.com/media/CI7wzjEVEAAOPpS.jpg:large', 'https://pbs.twimg.com/media/CIdHvT2UsAAnnHV.jpg:large', 'https://pbs.twimg.com/media/CGCiP_YWYAAo75V.jpg:large', 'https://pbs.twimg.com/media/CIS4JPIWIAI37qu.jpg:large'];
});

app.factory('RandomGreetings', function () {

    var getRandomFromArray = function getRandomFromArray(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    };

    var greetings = ['Hello, world!', 'At long last, I live!', 'Hello, simple human.', 'What a beautiful day!', 'I\'m like any other project, except that I am yours. :)', 'This empty string is for Lindsay Levine.', 'こんにちは、ユーザー様。', 'Welcome. To. WEBSITE.', ':D', 'Yes, I think we\'ve met before.', 'Gimme 3 mins... I just grabbed this really dope frittata', 'If Cooper could offer only one piece of advice, it would be to nevSQUIRREL!'];

    return {
        greetings: greetings,
        getRandomGreeting: function getRandomGreeting() {
            return getRandomFromArray(greetings);
        }
    };
});

'use strict';

app.factory('CategoryFactory', function ($http) {

    var CategoryFactory = {};

    function getData(response) {
        return response.data;
    }

    CategoryFactory.fetchAll = function () {
        return $http.get('/api/categories').then(getData);
    };

    return CategoryFactory;
});

'use strict';

app.factory('ProductsFactory', function ($http) {

    var ProductsFactory = {};

    function getData(response) {
        return response.data;
    }

    ProductsFactory.fetchAll = function (categoryId) {

        var queryParams = {};

        if (categoryId) {
            queryParams.categoryId = categoryId;
        }

        return $http.get('/api/products', {
            params: queryParams
        }).then(getData);
    };

    ProductsFactory.fetchById = function (id) {
        return $http.get('/api/products/' + id).then(getData);
    };

    ProductsFactory.create = function (data) {
        return $http.post('/products', data).then(getData).then(function (newProduct) {
            var product = newProduct;
            return product;
        });
    };

    return ProductsFactory;
});

'use strict';

app.factory('ReviewsFactory', function ($http) {

    var ReviewsFactory = {};

    function getData(response) {
        return response.data;
    }

    ReviewsFactory.fetchAll = function (productId) {
        return $http.get('/api/products/' + productId + '/reviews').then(getData);
    };

    return ReviewsFactory;
});

app.directive('cart', function ($state) {
    return {
        restrict: 'E',
        scope: {},
        templateUrl: 'js/common/directives/cart/cart.html',
        link: function link(scope) {
            scope.checkingOut = false;
            scope.items = [];
            scope.items.total = 0;
            scope.items.number = 0;
            scope.expandCart = true;
            scope.scoldingMessages = ["You're not gonna fight the patriarchy like that, now are you?", "You may not need men, but you do need tools.", "A woman without a man is like a fish without a bicycle, but fish definitely need tools to fight the patriarchy.", "We know you hate capitalism, but every feminist needs her toolkit."];
            scope.scoldingMessage = scope.scoldingMessages[Math.floor(Math.random() * scope.scoldingMessages.length)];

            scope.addToCart = function (item) {
                var indexOfItem = scope.items.indexOf(item);
                if (indexOfItem == -1) {
                    item.quantity = 1;
                    scope.items.push(item);
                } else {
                    scope.items[indexOfItem].quantity++;
                }
                scope.items.total += item.currentPrice;
                scope.items.number++;
            };
            scope.$on('addingItemToCart', function (event, data) {
                scope.addToCart(data);
            });
            scope.$on('backToShopping', function () {
                scope.checkingOut = false;
            });
            scope.removeFromCart = function (itemToRemove, quantity) {
                for (var i = 0; i < scope.items.length; i++) {
                    if (scope.items[i].id === itemToRemove.id) {
                        if (quantity === 'all' || scope.items[i].quantity === 1) {
                            scope.items.total -= scope.items[i].currentPrice * scope.items[i].quantity;
                            scope.items.splice(i, 1);
                            scope.items.number = 0;
                        } else if (quantity === 'one') {
                            scope.items.total -= scope.items[i].currentPrice;
                            scope.items[i].quantity--;
                            scope.items.number--;
                        }
                        break;
                    }
                }
            };
            scope.cartIsEmpty = function () {
                return scope.items.length === 0;
            };
            scope.toggleExpand = function () {
                scope.expandCart = !scope.expandCart;
            };
            scope.toggleCheckout = function () {
                var serialized = JSON.stringify(scope.items);
                console.log(scope.items);
                $state.go('checkout', { items: serialized, number: scope.items.number, total: scope.items.total });
                scope.checkingOut = true;
            };
        }
    };
});
app.directive('fullstackLogo', function () {
    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/fullstack-logo/fullstack-logo.html'
    };
});
app.directive('navbar', function ($rootScope, AuthService, AUTH_EVENTS, $state) {

    return {
        restrict: 'E',
        scope: {},
        templateUrl: 'js/common/directives/navbar/navbar.html',
        link: function link(scope) {

            scope.items = [{ label: 'Home', state: 'home' }, { label: 'About', state: 'about' }, { label: 'Products', state: 'products' }, { label: 'Members Only', state: 'membersOnly', auth: true }];

            scope.user = null;

            scope.isLoggedIn = function () {
                return AuthService.isAuthenticated();
            };

            scope.logout = function () {
                AuthService.logout().then(function () {
                    $state.go('home');
                });
            };

            var setUser = function setUser() {
                AuthService.getLoggedInUser().then(function (user) {
                    scope.user = user;
                });
            };

            var removeUser = function removeUser() {
                scope.user = null;
            };

            setUser();

            $rootScope.$on(AUTH_EVENTS.loginSuccess, setUser);
            $rootScope.$on(AUTH_EVENTS.logoutSuccess, removeUser);
            $rootScope.$on(AUTH_EVENTS.sessionTimeout, removeUser);
        }

    };
});

app.directive('randoGreeting', function (RandomGreetings) {

    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/rando-greeting/rando-greeting.html',
        link: function link(scope) {
            scope.greeting = RandomGreetings.getRandomGreeting();
        }
    };
});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFib3V0L2Fib3V0LmpzIiwiY2hlY2tvdXQvY2hlY2tvdXQuanMiLCJkb2NzL2RvY3MuanMiLCJmc2EvZnNhLXByZS1idWlsdC5qcyIsImhvbWUvaG9tZS5qcyIsImxvZ2luL2xvZ2luLmpzIiwibWVtYmVycy1vbmx5L21lbWJlcnMtb25seS5qcyIsInByb2R1Y3RzL3Byb2R1Y3QuanMiLCJwcm9kdWN0cy9wcm9kdWN0cy5qcyIsInJldmlld3MvcmV2aWV3cy5qcyIsImNvbW1vbi9mYWN0b3JpZXMvRnVsbHN0YWNrUGljcy5qcyIsImNvbW1vbi9mYWN0b3JpZXMvUmFuZG9tR3JlZXRpbmdzLmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9jYXRlZ29yeS1mYWN0b3J5LmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9wcm9kdWN0cy1mYWN0b3J5LmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9yZXZpZXdzLWZhY3RvcnkuanMiLCJjb21tb24vZGlyZWN0aXZlcy9jYXJ0L2NhcnQuanMiLCJjb21tb24vZGlyZWN0aXZlcy9mdWxsc3RhY2stbG9nby9mdWxsc3RhY2stbG9nby5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuanMiLCJjb21tb24vZGlyZWN0aXZlcy9yYW5kby1ncmVldGluZy9yYW5kby1ncmVldGluZy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUFDQSxPQUFBLEdBQUEsR0FBQSxRQUFBLE1BQUEsQ0FBQSx1QkFBQSxFQUFBLENBQUEsYUFBQSxFQUFBLFdBQUEsRUFBQSxjQUFBLEVBQUEsV0FBQSxDQUFBLENBQUE7O0FBRUEsSUFBQSxNQUFBLENBQUEsVUFBQSxrQkFBQSxFQUFBLGlCQUFBLEVBQUE7QUFDQTtBQUNBLHNCQUFBLFNBQUEsQ0FBQSxJQUFBO0FBQ0E7QUFDQSx1QkFBQSxTQUFBLENBQUEsR0FBQTtBQUNBO0FBQ0EsdUJBQUEsSUFBQSxDQUFBLGlCQUFBLEVBQUEsWUFBQTtBQUNBLGVBQUEsUUFBQSxD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QUFBOztBQUVBLFlBQUEsVUFBQSxFQUFBO0FBQ0Esd0JBQUEsVUFBQSxHQUFBLFVBQUE7QUFDQTs7QUFFQSxlQUFBLE1BQUEsR0FBQSxDQUFBLGVBQUEsRUFBQTtBQUNBLG9CQUFBO0FBREEsU0FBQSxFQUdBLElBSEEsQ0FHQSxPQUhBLENBQUE7QUFJQSxLQVpBOztBQWNBLG9CQUFBLFNBQUEsR0FBQSxVQUFBLEVBQUEsRUFBQTtBQUNBLGVBQUEsTUFBQSxHQUFBLENBQUEsbUJBQUEsRUFBQSxFQUNBLElBREEsQ0FDQSxPQURBLENBQUE7QUFFQSxLQUhBOztBQUtBLG9CQUFBLE1BQUEsR0FBQSxVQUFBLElBQUEsRUFBQTtBQUNBLGVBQUEsTUFBQSxJQUFBLENBQUEsV0FBQSxFQUFBLElBQUEsRUFDQSxJQURBLENBQ0EsT0FEQSxFQUVBLElBRkEsQ0FFQSxVQUFBLFVBQUEsRUFBQTtBQUNBLGdCQUFBLFVBQUEsVUFBQTtBQUNBLG1CQUFBLE9BQUE7QUFDQSxTQUxBLENBQUE7QUFNQSxLQVBBOztBQVNBLFdBQUEsZUFBQTtBQUVBLENBdENBOztBQ0ZBOztBQUVBLElBQUEsT0FBQSxDQUFBLGdCQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUE7O0FBRUEsUUFBQSxpQkFBQSxFQUFBOztBQUVBLGFBQUEsT0FBQSxDQUFBLFFBQUEsRUFBQTtBQUNBLGVBQUEsU0FBQSxJQUFBO0FBQ0E7O0FBRUEsbUJBQUEsUUFBQSxHQUFBLFVBQUEsU0FBQSxFQUFBO0FBQ0EsZUFBQSxNQUFBLEdBQUEsQ0FBQSxtQkFBQSxTQUFBLEdBQUEsVUFBQSxFQUNBLElBREEsQ0FDQSxPQURBLENBQUE7QUFFQSxLQUhBOztBQUtBLFdBQUEsY0FBQTtBQUVBLENBZkE7O0FDRkEsSUFBQSxTQUFBLENBQUEsTUFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBO0FBQ0EsV0FBQTtBQUNBLGtCQUFBLEdBREE7QUFFQSxlQUFBLEVBRkE7QUFHQSxxQkFBQSxxQ0FIQTtBQUlBLGNBQUEsY0FBQSxLQUFBLEVBQUE7QUFDQSxrQkFBQSxXQUFBLEdBQUEsS0FBQTtBQUNBLGtCQUFBLEtBQUEsR0FBQSxFQUFBO0FBQ0Esa0JBQUEsS0FBQSxDQUFBLEtBQUEsR0FBQSxDQUFBO0FBQ0Esa0JBQUEsS0FBQSxDQUFBLE1BQUEsR0FBQSxDQUFBO0FBQ0Esa0JBQUEsVUFBQSxHQUFBLElBQUE7QUFDQSxrQkFBQSxnQkFBQSxHQUFBLENBQUEsK0RBQUEsRUFBQSw4Q0FBQSxFQUFBLGlIQUFBLEVBQUEsb0VBQUEsQ0FBQTtBQUNBLGtCQUFBLGVBQUEsR0FBQSxNQUFBLGdCQUFBLENBQUEsS0FBQSxLQUFBLENBQUEsS0FBQSxNQUFBLEtBQUEsTUFBQSxnQkFBQSxDQUFBLE1BQUEsQ0FBQSxDQUFBOztBQUVBLGtCQUFBLFNBQUEsR0FBQSxVQUFBLElBQUEsRUFBQTtBQUNBLG9CQUFBLGNBQUEsTUFBQSxLQUFBLENBQUEsT0FBQSxDQUFBLElBQUEsQ0FBQTtBQUNBLG9CQUFBLGVBQUEsQ0FBQSxDQUFBLEVBQUE7QUFDQSx5QkFBQSxRQUFBLEdBQUEsQ0FBQTtBQUNBLDBCQUFBLEtBQUEsQ0FBQSxJQUFBLENBQUEsSUFBQTtBQUNBLGlCQUhBLE1BSUE7QUFDQSwwQkFBQSxLQUFBLENBQUEsV0FBQSxFQUFBLFFBQUE7QUFDQTtBQUNBLHNCQUFBLEtBQUEsQ0FBQSxLQUFBLElBQUEsS0FBQSxZQUFBO0FBQ0Esc0JBQUEsS0FBQSxDQUFBLE1BQUE7QUFDQSxhQVhBO0FBWUEsa0JBQUEsR0FBQSxDQUFBLGtCQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUEsSUFBQSxFQUFBO0FBQ0Esc0JBQUEsU0FBQSxDQUFBLElBQUE7QUFDQSxhQUZBO0FBR0Esa0JBQUEsR0FBQSxDQUFBLGdCQUFBLEVBQUEsWUFBQTtBQUNBLHNCQUFBLFdBQUEsR0FBQSxLQUFBO0FBQ0EsYUFGQTtBQUdBLGtCQUFBLGNBQUEsR0FBQSxVQUFBLFlBQUEsRUFBQSxRQUFBLEVBQUE7QUFDQSxxQkFBQSxJQUFBLElBQUEsQ0FBQSxFQUFBLElBQUEsTUFBQSxLQUFBLENBQUEsTUFBQSxFQUFBLEdBQUEsRUFBQTtBQUNBLHdCQUFBLE1BQUEsS0FBQSxDQUFBLENBQUEsRUFBQSxFQUFBLEtBQUEsYUFBQSxFQUFBLEVBQUE7QUFDQSw0QkFBQSxhQUFBLEtBQUEsSUFBQSxNQUFBLEtBQUEsQ0FBQSxDQUFBLEVBQUEsUUFBQSxLQUFBLENBQUEsRUFBQTtBQUNBLGtDQUFBLEtBQUEsQ0FBQSxLQUFBLElBQUEsTUFBQSxLQUFBLENBQUEsQ0FBQSxFQUFBLFlBQUEsR0FBQSxNQUFBLEtBQUEsQ0FBQSxDQUFBLEVBQUEsUUFBQTtBQUNBLGtDQUFBLEtBQUEsQ0FBQSxNQUFBLENBQUEsQ0FBQSxFQUFBLENBQUE7QUFDQSxrQ0FBQSxLQUFBLENBQUEsTUFBQSxHQUFBLENBQUE7QUFDQSx5QkFKQSxNQUtBLElBQUEsYUFBQSxLQUFBLEVBQUE7QUFDQSxrQ0FBQSxLQUFBLENBQUEsS0FBQSxJQUFBLE1BQUEsS0FBQSxDQUFBLENBQUEsRUFBQSxZQUFBO0FBQ0Esa0NBQUEsS0FBQSxDQUFBLENBQUEsRUFBQSxRQUFBO0FBQ0Esa0NBQUEsS0FBQSxDQUFBLE1BQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBaEJBO0FBaUJBLGtCQUFBLFdBQUEsR0FBQSxZQUFBO0FBQ0EsdUJBQUEsTUFBQSxLQUFBLENBQUEsTUFBQSxLQUFBLENBQUE7QUFDQSxhQUZBO0FBR0Esa0JBQUEsWUFBQSxHQUFBLFlBQUE7QUFDQSxzQkFBQSxVQUFBLEdBQUEsQ0FBQSxNQUFBLFVBQUE7QUFDQSxhQUZBO0FBR0Esa0JBQUEsY0FBQSxHQUFBLFlBQUE7QUFDQSxvQkFBQSxhQUFBLEtBQUEsU0FBQSxDQUFBLE1BQUEsS0FBQSxDQUFBO0FBQ0Esd0JBQUEsR0FBQSxDQUFBLE1BQUEsS0FBQTtBQUNBLHVCQUFBLEVBQUEsQ0FBQSxVQUFBLEVBQUEsRUFBQSxPQUFBLFVBQUEsRUFBQSxRQUFBLE1BQUEsS0FBQSxDQUFBLE1BQUEsRUFBQSxPQUFBLE1BQUEsS0FBQSxDQUFBLEtBQUEsRUFBQTtBQUNBLHNCQUFBLFdBQUEsR0FBQSxJQUFBO0FBQ0EsYUFMQTtBQU1BO0FBNURBLEtBQUE7QUErREEsQ0FoRUE7QUNBQSxJQUFBLFNBQUEsQ0FBQSxlQUFBLEVBQUEsWUFBQTtBQUNBLFdBQUE7QUFDQSxrQkFBQSxHQURBO0FBRUEscUJBQUE7QUFGQSxLQUFBO0FBSUEsQ0FMQTtBQ0FBLElBQUEsU0FBQSxDQUFBLFFBQUEsRUFBQSxVQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUEsV0FBQSxFQUFBLE1BQUEsRUFBQTs7QUFFQSxXQUFBO0FBQ0Esa0JBQUEsR0FEQTtBQUVBLGVBQUEsRUFGQTtBQUdBLHFCQUFBLHlDQUhBO0FBSUEsY0FBQSxjQUFBLEtBQUEsRUFBQTs7QUFFQSxrQkFBQSxLQUFBLEdBQUEsQ0FDQSxFQUFBLE9BQUEsTUFBQSxFQUFBLE9BQUEsTUFBQSxFQURBLEVBRUEsRUFBQSxPQUFBLE9BQUEsRUFBQSxPQUFBLE9BQUEsRUFGQSxFQUdBLEVBQUEsT0FBQSxVQUFBLEVBQUEsT0FBQSxVQUFBLEVBSEEsRUFJQSxFQUFBLE9BQUEsY0FBQSxFQUFBLE9BQUEsYUFBQSxFQUFBLE1BQUEsSUFBQSxFQUpBLENBQUE7O0FBT0Esa0JBQUEsSUFBQSxHQUFBLElBQUE7O0FBRUEsa0JBQUEsVUFBQSxHQUFBLFlBQUE7QUFDQSx1QkFBQSxZQUFBLGVBQUEsRUFBQTtBQUNBLGFBRkE7O0FBSUEsa0JBQUEsTUFBQSxHQUFBLFlBQUE7QUFDQSw0QkFBQSxNQUFBLEdBQUEsSUFBQSxDQUFBLFlBQUE7QUFDQSwyQkFBQSxFQUFBLENBQUEsTUFBQTtBQUNBLGlCQUZBO0FBR0EsYUFKQTs7QUFNQSxnQkFBQSxVQUFBLFNBQUEsT0FBQSxHQUFBO0FBQ0EsNEJBQUEsZUFBQSxHQUFBLElBQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTtBQUNBLDBCQUFBLElBQUEsR0FBQSxJQUFBO0FBQ0EsaUJBRkE7QUFHQSxhQUpBOztBQU1BLGdCQUFBLGFBQUEsU0FBQSxVQUFBLEdBQUE7QUFDQSxzQkFBQSxJQUFBLEdBQUEsSUFBQTtBQUNBLGFBRkE7O0FBSUE7O0FBRUEsdUJBQUEsR0FBQSxDQUFBLFlBQUEsWUFBQSxFQUFBLE9BQUE7QUFDQSx1QkFBQSxHQUFBLENBQUEsWUFBQSxhQUFBLEVBQUEsVUFBQTtBQUNBLHVCQUFBLEdBQUEsQ0FBQSxZQUFBLGNBQUEsRUFBQSxVQUFBO0FBRUE7O0FBekNBLEtBQUE7QUE2Q0EsQ0EvQ0E7O0FDQUEsSUFBQSxTQUFBLENBQUEsZUFBQSxFQUFBLFVBQUEsZUFBQSxFQUFBOztBQUVBLFdBQUE7QUFDQSxrQkFBQSxHQURBO0FBRUEscUJBQUEseURBRkE7QUFHQSxjQUFBLGNBQUEsS0FBQSxFQUFBO0FBQ0Esa0JBQUEsUUFBQSxHQUFBLGdCQUFBLGlCQUFBLEVBQUE7QUFDQTtBQUxBLEtBQUE7QUFRQSxDQVZBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG53aW5kb3cuYXBwID0gYW5ndWxhci5tb2R1bGUoJ0Z1bGxzdGFja0dlbmVyYXRlZEFwcCcsIFsnZnNhUHJlQnVpbHQnLCAndWkucm91dGVyJywgJ3VpLmJvb3RzdHJhcCcsICduZ0FuaW1hdGUnXSk7XG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCR1cmxSb3V0ZXJQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIpIHtcbiAgICAvLyBUaGlzIHR1cm5zIG9mZiBoYXNoYmFuZyB1cmxzICgvI2Fib3V0KSBhbmQgY2hhbmdlcyBpdCB0byBzb21ldGhpbmcgbm9ybWFsICgvYWJvdXQpXG4gICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xuICAgIC8vIElmIHdlIGdvIHRvIGEgVVJMIHRoYXQgdWktcm91dGVyIGRvZXNuJ3QgaGF2ZSByZWdpc3RlcmVkLCBnbyB0byB0aGUgXCIvXCIgdXJsLlxuICAgICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoJy8nKTtcbiAgICAvLyBUcmlnZ2VyIHBhZ2UgcmVmcmVzaCB3aGVuIGFjY2Vzc2luZyBhbiBPQXV0aCByb3V0ZVxuICAgICR1cmxSb3V0ZXJQcm92aWRlci53aGVuKCcvYXV0aC86cHJvdmlkZXInLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcbiAgICB9KTtcbn0pO1xuXG4vLyBUaGlzIGFwcC5ydW4gaXMgZm9yIGNvbnRyb2xsaW5nIGFjY2VzcyB0byBzcGVjaWZpYyBzdGF0ZXMuXG5hcHAucnVuKGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBdXRoU2VydmljZSwgJHN0YXRlKSB7XG5cbiAgICAvLyBUaGUgZ2l2ZW4gc3RhdGUgcmVxdWlyZXMgYW4gYXV0aGVudGljYXRlZCB1c2VyLlxuICAgIHZhciBkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoID0gZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgICAgIHJldHVybiBzdGF0ZS5kYXRhICYmIHN0YXRlLmRhdGEuYXV0aGVudGljYXRlO1xuICAgIH07XG5cbiAgICAvLyAkc3RhdGVDaGFuZ2VTdGFydCBpcyBhbiBldmVudCBmaXJlZFxuICAgIC8vIHdoZW5ldmVyIHRoZSBwcm9jZXNzIG9mIGNoYW5naW5nIGEgc3RhdGUgYmVnaW5zLlxuICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uIChldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMpIHtcblxuICAgICAgICBpZiAoIWRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGgodG9TdGF0ZSkpIHtcbiAgICAgICAgICAgIC8vIFRoZSBkZXN0aW5hdGlvbiBzdGF0ZSBkb2VzIG5vdCByZXF1aXJlIGF1dGhlbnRpY2F0aW9uXG4gICAgICAgICAgICAvLyBTaG9ydCBjaXJjdWl0IHdpdGggcmV0dXJuLlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpKSB7XG4gICAgICAgICAgICAvLyBUaGUgdXNlciBpcyBhdXRoZW50aWNhdGVkLlxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENhbmNlbCBuYXZpZ2F0aW5nIHRvIG5ldyBzdGF0ZS5cbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgICAgICAvLyBJZiBhIHVzZXIgaXMgcmV0cmlldmVkLCB0aGVuIHJlbmF2aWdhdGUgdG8gdGhlIGRlc3RpbmF0aW9uXG4gICAgICAgICAgICAvLyAodGhlIHNlY29uZCB0aW1lLCBBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSB3aWxsIHdvcmspXG4gICAgICAgICAgICAvLyBvdGhlcndpc2UsIGlmIG5vIHVzZXIgaXMgbG9nZ2VkIGluLCBnbyB0byBcImxvZ2luXCIgc3RhdGUuXG4gICAgICAgICAgICBpZiAodXNlcikge1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbyh0b1N0YXRlLm5hbWUsIHRvUGFyYW1zKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdsb2dpbicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgIH0pO1xuXG59KTtcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAvLyBSZWdpc3RlciBvdXIgKmFib3V0KiBzdGF0ZS5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYWJvdXQnLCB7XG4gICAgICAgIHVybDogJy9hYm91dCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdBYm91dENvbnRyb2xsZXInLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2Fib3V0L2Fib3V0Lmh0bWwnXG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuY29udHJvbGxlcignQWJvdXRDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgRnVsbHN0YWNrUGljcykge1xuXG4gICAgLy8gSW1hZ2VzIG9mIGJlYXV0aWZ1bCBGdWxsc3RhY2sgcGVvcGxlLlxuICAgICRzY29wZS5pbWFnZXMgPSBfLnNodWZmbGUoRnVsbHN0YWNrUGljcyk7XG5cbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NoZWNrb3V0Jywge1xuICAgICAgICB1cmw6ICcvY2hlY2tvdXQvOml0ZW1zLzpudW1iZXIvOnRvdGFsJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0NoZWNrb3V0Q29udHJvbGxlcicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY2hlY2tvdXQvY2hlY2tvdXQuaHRtbCdcbiAgICB9KTtcblxufSk7XG5cbmFwcC5jb250cm9sbGVyKCdDaGVja291dENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCRyb290U2NvcGUsJHN0YXRlUGFyYW1zKSB7XG5cdCRzY29wZS5pdGVtcz1KU09OLnBhcnNlKCRzdGF0ZVBhcmFtcy5pdGVtcyk7XG5cdCRzY29wZS5pdGVtcy5udW1iZXI9JHN0YXRlUGFyYW1zLm51bWJlcjtcblx0JHNjb3BlLml0ZW1zLnRvdGFsPSRzdGF0ZVBhcmFtcy50b3RhbDtcblx0JHNjb3BlLml0ZW1zLmlkcz0kc2NvcGUuaXRlbXMubWFwKGZ1bmN0aW9uKGl0ZW0pe1xuXHRcdHJldHVybiBpdGVtLmlkO1xuXHR9KVxuXHRjb25zb2xlLmxvZygkc2NvcGUuaXRlbXMuaWRzKTtcblx0JHNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3RhcnQnLCBmdW5jdGlvbiAoZXZlbnQsIG5leHQsIGN1cnJlbnQpIHtcblx0ICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnYmFja1RvU2hvcHBpbmcnKTtcblx0fSk7XG5cdCRzY29wZS5zdWJtaXRPcmRlcj1mdW5jdGlvbihzaGlwcGluZ0FkZHJlc3MsbmFtZSxlbWFpbCl7XG5cdFx0Y29uc29sZS5sb2coc2hpcHBpbmdBZGRyZXNzLG5hbWUsZW1haWwpO1xuXHRcdC8qTkVFRFMgVE8gQkUgQ09OTkVDVEVEIFdJVEggUk9VVEVTKi9cblx0fVxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnZG9jcycsIHtcbiAgICAgICAgdXJsOiAnL2RvY3MnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2RvY3MvZG9jcy5odG1sJ1xuICAgIH0pO1xufSk7XG4iLCIoZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLy8gSG9wZSB5b3UgZGlkbid0IGZvcmdldCBBbmd1bGFyISBEdWgtZG95LlxuICAgIGlmICghd2luZG93LmFuZ3VsYXIpIHRocm93IG5ldyBFcnJvcignSSBjYW5cXCd0IGZpbmQgQW5ndWxhciEnKTtcblxuICAgIHZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnZnNhUHJlQnVpbHQnLCBbXSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnU29ja2V0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXdpbmRvdy5pbykgdGhyb3cgbmV3IEVycm9yKCdzb2NrZXQuaW8gbm90IGZvdW5kIScpO1xuICAgICAgICByZXR1cm4gd2luZG93LmlvKHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4pO1xuICAgIH0pO1xuXG4gICAgLy8gQVVUSF9FVkVOVFMgaXMgdXNlZCB0aHJvdWdob3V0IG91ciBhcHAgdG9cbiAgICAvLyBicm9hZGNhc3QgYW5kIGxpc3RlbiBmcm9tIGFuZCB0byB0aGUgJHJvb3RTY29wZVxuICAgIC8vIGZvciBpbXBvcnRhbnQgZXZlbnRzIGFib3V0IGF1dGhlbnRpY2F0aW9uIGZsb3cuXG4gICAgYXBwLmNvbnN0YW50KCdBVVRIX0VWRU5UUycsIHtcbiAgICAgICAgbG9naW5TdWNjZXNzOiAnYXV0aC1sb2dpbi1zdWNjZXNzJyxcbiAgICAgICAgbG9naW5GYWlsZWQ6ICdhdXRoLWxvZ2luLWZhaWxlZCcsXG4gICAgICAgIGxvZ291dFN1Y2Nlc3M6ICdhdXRoLWxvZ291dC1zdWNjZXNzJyxcbiAgICAgICAgc2Vzc2lvblRpbWVvdXQ6ICdhdXRoLXNlc3Npb24tdGltZW91dCcsXG4gICAgICAgIG5vdEF1dGhlbnRpY2F0ZWQ6ICdhdXRoLW5vdC1hdXRoZW50aWNhdGVkJyxcbiAgICAgICAgbm90QXV0aG9yaXplZDogJ2F1dGgtbm90LWF1dGhvcml6ZWQnXG4gICAgfSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnQXV0aEludGVyY2VwdG9yJywgZnVuY3Rpb24gKCRyb290U2NvcGUsICRxLCBBVVRIX0VWRU5UUykge1xuICAgICAgICB2YXIgc3RhdHVzRGljdCA9IHtcbiAgICAgICAgICAgIDQwMTogQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZCxcbiAgICAgICAgICAgIDQwMzogQVVUSF9FVkVOVFMubm90QXV0aG9yaXplZCxcbiAgICAgICAgICAgIDQxOTogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsXG4gICAgICAgICAgICA0NDA6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXNwb25zZUVycm9yOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3Qoc3RhdHVzRGljdFtyZXNwb25zZS5zdGF0dXNdLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdChyZXNwb25zZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9KTtcblxuICAgIGFwcC5jb25maWcoZnVuY3Rpb24gKCRodHRwUHJvdmlkZXIpIHtcbiAgICAgICAgJGh0dHBQcm92aWRlci5pbnRlcmNlcHRvcnMucHVzaChbXG4gICAgICAgICAgICAnJGluamVjdG9yJyxcbiAgICAgICAgICAgIGZ1bmN0aW9uICgkaW5qZWN0b3IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGluamVjdG9yLmdldCgnQXV0aEludGVyY2VwdG9yJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIF0pO1xuICAgIH0pO1xuXG4gICAgYXBwLnNlcnZpY2UoJ0F1dGhTZXJ2aWNlJywgZnVuY3Rpb24gKCRodHRwLCBTZXNzaW9uLCAkcm9vdFNjb3BlLCBBVVRIX0VWRU5UUywgJHEpIHtcblxuICAgICAgICBmdW5jdGlvbiBvblN1Y2Nlc3NmdWxMb2dpbihyZXNwb25zZSkge1xuICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgU2Vzc2lvbi5jcmVhdGUoZGF0YS5pZCwgZGF0YS51c2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MpO1xuICAgICAgICAgICAgcmV0dXJuIGRhdGEudXNlcjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFVzZXMgdGhlIHNlc3Npb24gZmFjdG9yeSB0byBzZWUgaWYgYW5cbiAgICAgICAgLy8gYXV0aGVudGljYXRlZCB1c2VyIGlzIGN1cnJlbnRseSByZWdpc3RlcmVkLlxuICAgICAgICB0aGlzLmlzQXV0aGVudGljYXRlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAhIVNlc3Npb24udXNlcjtcbiAgICAgICAgfTtcblxuICAgICAgICAvL1VzZXMgdGhlIHNlc3Npb24gZmFjdG9yeSB0byBzZWUgaWYgdGhlIHVzZXIgaXMgYW4gYWRtaW5cbiAgICAgICAgdGhpcy5pc0FkbWluID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIFNlc3Npb24udXNlci5pc0FkbWluO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0TG9nZ2VkSW5Vc2VyID0gZnVuY3Rpb24gKGZyb21TZXJ2ZXIpIHtcblxuICAgICAgICAgICAgLy8gSWYgYW4gYXV0aGVudGljYXRlZCBzZXNzaW9uIGV4aXN0cywgd2VcbiAgICAgICAgICAgIC8vIHJldHVybiB0aGUgdXNlciBhdHRhY2hlZCB0byB0aGF0IHNlc3Npb25cbiAgICAgICAgICAgIC8vIHdpdGggYSBwcm9taXNlLiBUaGlzIGVuc3VyZXMgdGhhdCB3ZSBjYW5cbiAgICAgICAgICAgIC8vIGFsd2F5cyBpbnRlcmZhY2Ugd2l0aCB0aGlzIG1ldGhvZCBhc3luY2hyb25vdXNseS5cblxuICAgICAgICAgICAgLy8gT3B0aW9uYWxseSwgaWYgdHJ1ZSBpcyBnaXZlbiBhcyB0aGUgZnJvbVNlcnZlciBwYXJhbWV0ZXIsXG4gICAgICAgICAgICAvLyB0aGVuIHRoaXMgY2FjaGVkIHZhbHVlIHdpbGwgbm90IGJlIHVzZWQuXG5cbiAgICAgICAgICAgIGlmICh0aGlzLmlzQXV0aGVudGljYXRlZCgpICYmIGZyb21TZXJ2ZXIgIT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEud2hlbihTZXNzaW9uLnVzZXIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBNYWtlIHJlcXVlc3QgR0VUIC9zZXNzaW9uLlxuICAgICAgICAgICAgLy8gSWYgaXQgcmV0dXJucyBhIHVzZXIsIGNhbGwgb25TdWNjZXNzZnVsTG9naW4gd2l0aCB0aGUgcmVzcG9uc2UuXG4gICAgICAgICAgICAvLyBJZiBpdCByZXR1cm5zIGEgNDAxIHJlc3BvbnNlLCB3ZSBjYXRjaCBpdCBhbmQgaW5zdGVhZCByZXNvbHZlIHRvIG51bGwuXG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvc2Vzc2lvbicpLnRoZW4ob25TdWNjZXNzZnVsTG9naW4pLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sb2dpbiA9IGZ1bmN0aW9uIChjcmVkZW50aWFscykge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9sb2dpbicsIGNyZWRlbnRpYWxzKVxuICAgICAgICAgICAgICAgIC50aGVuKG9uU3VjY2Vzc2Z1bExvZ2luKVxuICAgICAgICAgICAgICAgIC5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QoeyBtZXNzYWdlOiAnSW52YWxpZCBsb2dpbiBjcmVkZW50aWFscy4nIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2xvZ291dCcpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIFNlc3Npb24uZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5sb2dvdXRTdWNjZXNzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgfSk7XG5cbiAgICBhcHAuc2VydmljZSgnU2Vzc2lvbicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBVVRIX0VWRU5UUykge1xuXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLmRlc3Ryb3koKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuZGVzdHJveSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcblxuICAgICAgICB0aGlzLmNyZWF0ZSA9IGZ1bmN0aW9uIChzZXNzaW9uSWQsIHVzZXIpIHtcbiAgICAgICAgICAgIHRoaXMuaWQgPSBzZXNzaW9uSWQ7XG4gICAgICAgICAgICB0aGlzLnVzZXIgPSB1c2VyO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcbiAgICAgICAgfTtcblxuICAgIH0pO1xuXG59KSgpO1xuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnaG9tZScsIHtcbiAgICAgICAgdXJsOiAnLycsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvaG9tZS9ob21lLmh0bWwnXG4gICAgfSk7XG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2xvZ2luJywge1xuICAgICAgICB1cmw6ICcvbG9naW4nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2xvZ2luL2xvZ2luLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnTG9naW5DdHJsJ1xuICAgIH0pO1xuXG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0xvZ2luQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsIEF1dGhTZXJ2aWNlLCAkc3RhdGUpIHtcblxuICAgICRzY29wZS5sb2dpbiA9IHt9O1xuICAgICRzY29wZS5lcnJvciA9IG51bGw7XG5cbiAgICAkc2NvcGUuc2VuZExvZ2luID0gZnVuY3Rpb24gKGxvZ2luSW5mbykge1xuXG4gICAgICAgICRzY29wZS5lcnJvciA9IG51bGw7XG5cbiAgICAgICAgQXV0aFNlcnZpY2UubG9naW4obG9naW5JbmZvKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzdGF0ZS5nbygnaG9tZScpO1xuICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuZXJyb3IgPSAnSW52YWxpZCBsb2dpbiBjcmVkZW50aWFscy4nO1xuICAgICAgICB9KTtcblxuICAgIH07XG5cbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnbWVtYmVyc09ubHknLCB7XG4gICAgICAgIHVybDogJy9tZW1iZXJzLWFyZWEnLFxuICAgICAgICB0ZW1wbGF0ZTogJzxpbWcgbmctcmVwZWF0PVwiaXRlbSBpbiBzdGFzaFwiIHdpZHRoPVwiMzAwXCIgbmctc3JjPVwie3sgaXRlbSB9fVwiIC8+JyxcbiAgICAgICAgY29udHJvbGxlcjogZnVuY3Rpb24gKCRzY29wZSwgU2VjcmV0U3Rhc2gpIHtcbiAgICAgICAgICAgIFNlY3JldFN0YXNoLmdldFN0YXNoKCkudGhlbihmdW5jdGlvbiAoc3Rhc2gpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuc3Rhc2ggPSBzdGFzaDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICAvLyBUaGUgZm9sbG93aW5nIGRhdGEuYXV0aGVudGljYXRlIGlzIHJlYWQgYnkgYW4gZXZlbnQgbGlzdGVuZXJcbiAgICAgICAgLy8gdGhhdCBjb250cm9scyBhY2Nlc3MgdG8gdGhpcyBzdGF0ZS4gUmVmZXIgdG8gYXBwLmpzLlxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBhdXRoZW50aWNhdGU6IHRydWVcbiAgICAgICAgfVxuICAgIH0pO1xuXG59KTtcblxuYXBwLmZhY3RvcnkoJ1NlY3JldFN0YXNoJywgZnVuY3Rpb24gKCRodHRwKSB7XG5cbiAgICB2YXIgZ2V0U3Rhc2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvbWVtYmVycy9zZWNyZXQtc3Rhc2gnKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBnZXRTdGFzaDogZ2V0U3Rhc2hcbiAgICB9O1xuXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdwcm9kdWN0Jywge1xuICAgICAgdXJsOiAnL3Byb2R1Y3RzLzpwcm9kdWN0SWQnLFxuICAgICAgY29udHJvbGxlcjogJ1Byb2R1Y3RDb250cm9sbGVyJyxcbiAgICAgIHRlbXBsYXRlVXJsOiAnanMvcHJvZHVjdHMvcHJvZHVjdC5odG1sJyxcbiAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgdGhlUHJvZHVjdDogZnVuY3Rpb24gKFByb2R1Y3RzRmFjdG9yeSwgJHN0YXRlUGFyYW1zKSB7XG4gICAgICAgICAgcmV0dXJuIFByb2R1Y3RzRmFjdG9yeS5mZXRjaEJ5SWQoJHN0YXRlUGFyYW1zLnByb2R1Y3RJZCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgfSk7XG5cbn0pO1xuXG5hcHAuY29udHJvbGxlcignUHJvZHVjdENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCB0aGVQcm9kdWN0LCAkcm9vdFNjb3BlKSB7XG5cbiAgJHNjb3BlLnByb2R1Y3QgPSB0aGVQcm9kdWN0LnByb2R1Y3Q7XG4gICRzY29wZS5jYXRlZ29yaWVzID0gdGhlUHJvZHVjdC5jYXRlZ29yaWVzO1xuXG4gICRzY29wZS5hZGRJdGVtPWZ1bmN0aW9uKCl7XG4gICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdhZGRpbmdJdGVtVG9DYXJ0Jyx0aGVQcm9kdWN0LnByb2R1Y3QpO1xuICB9XG5cbn0pO1xuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdwcm9kdWN0cycsIHtcbiAgICAgICAgdXJsOiAnL3Byb2R1Y3RzJyxcbiAgICAgICAgY29udHJvbGxlcjogJ1Byb2R1Y3RzQ29udHJvbGxlcicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvcHJvZHVjdHMvcHJvZHVjdHMuaHRtbCdcbiAgICB9KTtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdwcm9kdWN0c0J5Q2F0ZWdvcnknLCB7XG4gICAgICAgIHVybDogJy9wcm9kdWN0cy9jYXRlZ29yaWVzLzpjYXRlZ29yeUlkJyxcbiAgICAgICAgY29udHJvbGxlcjogJ1Byb2R1Y3RzQ29udHJvbGxlcicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvcHJvZHVjdHMvcHJvZHVjdHMuaHRtbCdcbiAgICB9KTtcbn0pO1xuXG5hcHAuY29udHJvbGxlcignUHJvZHVjdHNDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgUHJvZHVjdHNGYWN0b3J5LCBDYXRlZ29yeUZhY3RvcnksICRzdGF0ZSwgJHN0YXRlUGFyYW1zKSB7XG5cbiAgICBpZiAoJHN0YXRlUGFyYW1zLmNhdGVnb3J5SWQpIHtcbiAgICAgICAgUHJvZHVjdHNGYWN0b3J5LmZldGNoQWxsKCRzdGF0ZVBhcmFtcy5jYXRlZ29yeUlkKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAocHJvZHVjdHMpIHtcbiAgICAgICAgICAgICRzY29wZS5wcm9kdWN0cyA9IHByb2R1Y3RzO1xuICAgICAgICB9KVxuICAgIH0gZWxzZSB7XG4gICAgICAgIFByb2R1Y3RzRmFjdG9yeS5mZXRjaEFsbCgpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uIChwcm9kdWN0cykge1xuICAgICAgICAgICAgJHNjb3BlLnByb2R1Y3RzID0gcHJvZHVjdHM7XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgQ2F0ZWdvcnlGYWN0b3J5LmZldGNoQWxsKClcbiAgICAudGhlbihmdW5jdGlvbiAoY2F0ZWdvcmllcykge1xuICAgICAgICAkc2NvcGUuc2VsZWN0ZWRDYXRlZ29yeSA9IGNhdGVnb3JpZXMuZmlsdGVyKGZ1bmN0aW9uIChjYXRlZ29yeSkge1xuICAgICAgICAgICAgcmV0dXJuIGNhdGVnb3J5LmlkID09PSBOdW1iZXIoJHN0YXRlUGFyYW1zLmNhdGVnb3J5SWQpO1xuICAgICAgICB9KVswXTtcbiAgICAgICAgJHNjb3BlLmNhdGVnb3JpZXMgPSBjYXRlZ29yaWVzO1xuICAgIH0pO1xuXG4gICAgJHNjb3BlLm9uU2VsZWN0Q2F0ZWdvcnkgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICRzdGF0ZS5nbygncHJvZHVjdHNCeUNhdGVnb3J5JywgeyBjYXRlZ29yeUlkOiAkc2NvcGUuc2VsZWN0ZWRDYXRlZ29yeS5pZCB9KTtcbiAgICB9O1xuXG59KTtcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3Jldmlld3MnLCB7XG4gICAgICB1cmw6ICcvcHJvZHVjdHMvOnByb2R1Y3RJZC9yZXZpZXdzJyxcbiAgICAgIGNvbnRyb2xsZXI6ICdSZXZpZXdzQ29udHJvbGxlcicsXG4gICAgICB0ZW1wbGF0ZVVybDogJy9qcy9yZXZpZXdzL3Jldmlld3MuaHRtbCcsXG4gICAgICByZXNvbHZlOiB7XG4gICAgICAgIHJldmlld3M6IGZ1bmN0aW9uIChSZXZpZXdzRmFjdG9yeSwgJHN0YXRlUGFyYW1zKSB7XG4gICAgICAgICAgcmV0dXJuIFJldmlld3NGYWN0b3J5LmZldGNoQWxsKCRzdGF0ZVBhcmFtcy5wcm9kdWN0SWQpO1xuICAgICAgICB9XG4gICAgICB9XG4gIH0pO1xuXG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ1Jldmlld3NDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgcmV2aWV3cykge1xuXG4gICRzY29wZS5yZXZpZXdzID0gcmV2aWV3cztcbiAgY29uc29sZS5sb2coJ1RISVMgSVMgU0NPUEUuUkVWSUVXUyAnLCAkc2NvcGUucmV2aWV3cyk7XG59KTtcbiIsImFwcC5mYWN0b3J5KCdGdWxsc3RhY2tQaWNzJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBbXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjdnQlh1bENBQUFYUWNFLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL2ZiY2RuLXNwaG90b3MtYy1hLmFrYW1haWhkLm5ldC9ocGhvdG9zLWFrLXhhcDEvdDMxLjAtOC8xMDg2MjQ1MV8xMDIwNTYyMjk5MDM1OTI0MV84MDI3MTY4ODQzMzEyODQxMTM3X28uanBnJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CLUxLVXNoSWdBRXk5U0suanBnJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNzktWDdvQ01BQWt3N3kuanBnJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CLVVqOUNPSUlBSUZBaDAuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNnlJeUZpQ0VBQXFsMTIuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRS1UNzVsV0FBQW1xcUouanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRXZaQWctVkFBQWs5MzIuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRWdOTWVPWElBSWZEaEsuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRVF5SUROV2dBQXU2MEIuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQ0YzVDVRVzhBRTJsR0ouanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQWVWdzVTV29BQUFMc2ouanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQWFKSVA3VWtBQWxJR3MuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQVFPdzlsV0VBQVk5RmwuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CLU9RYlZyQ01BQU53SU0uanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9COWJfZXJ3Q1lBQXdSY0oucG5nOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNVBUZHZuQ2NBRUFsNHguanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNHF3QzBpQ1lBQWxQR2guanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CMmIzM3ZSSVVBQTlvMUQuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9Cd3BJd3IxSVVBQXZPMl8uanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9Cc1NzZUFOQ1lBRU9oTHcuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSjR2TGZ1VXdBQWRhNEwuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSTd3empFVkVBQU9QcFMuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSWRIdlQyVXNBQW5uSFYuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DR0NpUF9ZV1lBQW83NVYuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSVM0SlBJV0lBSTM3cXUuanBnOmxhcmdlJ1xuICAgIF07XG59KTtcbiIsImFwcC5mYWN0b3J5KCdSYW5kb21HcmVldGluZ3MnLCBmdW5jdGlvbiAoKSB7XG5cbiAgICB2YXIgZ2V0UmFuZG9tRnJvbUFycmF5ID0gZnVuY3Rpb24gKGFycikge1xuICAgICAgICByZXR1cm4gYXJyW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGFyci5sZW5ndGgpXTtcbiAgICB9O1xuXG4gICAgdmFyIGdyZWV0aW5ncyA9IFtcbiAgICAgICAgJ0hlbGxvLCB3b3JsZCEnLFxuICAgICAgICAnQXQgbG9uZyBsYXN0LCBJIGxpdmUhJyxcbiAgICAgICAgJ0hlbGxvLCBzaW1wbGUgaHVtYW4uJyxcbiAgICAgICAgJ1doYXQgYSBiZWF1dGlmdWwgZGF5IScsXG4gICAgICAgICdJXFwnbSBsaWtlIGFueSBvdGhlciBwcm9qZWN0LCBleGNlcHQgdGhhdCBJIGFtIHlvdXJzLiA6KScsXG4gICAgICAgICdUaGlzIGVtcHR5IHN0cmluZyBpcyBmb3IgTGluZHNheSBMZXZpbmUuJyxcbiAgICAgICAgJ+OBk+OCk+OBq+OBoeOBr+OAgeODpuODvOOCtuODvOanmOOAgicsXG4gICAgICAgICdXZWxjb21lLiBUby4gV0VCU0lURS4nLFxuICAgICAgICAnOkQnLFxuICAgICAgICAnWWVzLCBJIHRoaW5rIHdlXFwndmUgbWV0IGJlZm9yZS4nLFxuICAgICAgICAnR2ltbWUgMyBtaW5zLi4uIEkganVzdCBncmFiYmVkIHRoaXMgcmVhbGx5IGRvcGUgZnJpdHRhdGEnLFxuICAgICAgICAnSWYgQ29vcGVyIGNvdWxkIG9mZmVyIG9ubHkgb25lIHBpZWNlIG9mIGFkdmljZSwgaXQgd291bGQgYmUgdG8gbmV2U1FVSVJSRUwhJyxcbiAgICBdO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ3JlZXRpbmdzOiBncmVldGluZ3MsXG4gICAgICAgIGdldFJhbmRvbUdyZWV0aW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0UmFuZG9tRnJvbUFycmF5KGdyZWV0aW5ncyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG59KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmZhY3RvcnkoJ0NhdGVnb3J5RmFjdG9yeScsIGZ1bmN0aW9uICgkaHR0cCkge1xuXG4gIHZhciBDYXRlZ29yeUZhY3RvcnkgPSB7fTtcblxuICBmdW5jdGlvbiBnZXREYXRhIChyZXNwb25zZSkge1xuICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICB9XG5cbiAgQ2F0ZWdvcnlGYWN0b3J5LmZldGNoQWxsID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvY2F0ZWdvcmllcycpXG4gICAgLnRoZW4oZ2V0RGF0YSk7XG4gIH07XG5cbiAgcmV0dXJuIENhdGVnb3J5RmFjdG9yeTtcblxufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbmFwcC5mYWN0b3J5KCdQcm9kdWN0c0ZhY3RvcnknLCBmdW5jdGlvbiAoJGh0dHApIHtcblxuICB2YXIgUHJvZHVjdHNGYWN0b3J5ID0ge307XG5cbiAgZnVuY3Rpb24gZ2V0RGF0YSAocmVzcG9uc2UpIHtcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgfVxuXG4gIFByb2R1Y3RzRmFjdG9yeS5mZXRjaEFsbCA9IGZ1bmN0aW9uIChjYXRlZ29yeUlkKSB7XG5cbiAgICB2YXIgcXVlcnlQYXJhbXMgPSB7fTtcblxuICAgIGlmIChjYXRlZ29yeUlkKSB7XG4gICAgICBxdWVyeVBhcmFtcy5jYXRlZ29yeUlkID0gY2F0ZWdvcnlJZDtcbiAgICB9XG5cbiAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL3Byb2R1Y3RzJywge1xuICAgICAgcGFyYW1zOiBxdWVyeVBhcmFtc1xuICAgIH0pXG4gICAgLnRoZW4oZ2V0RGF0YSk7XG4gIH07XG5cbiAgUHJvZHVjdHNGYWN0b3J5LmZldGNoQnlJZCA9IGZ1bmN0aW9uIChpZCkge1xuICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvcHJvZHVjdHMvJyArIGlkKVxuICAgIC50aGVuKGdldERhdGEpO1xuICB9O1xuXG4gIFByb2R1Y3RzRmFjdG9yeS5jcmVhdGUgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9wcm9kdWN0cycsIGRhdGEpXG4gICAgICAudGhlbihnZXREYXRhKVxuICAgICAgLnRoZW4oZnVuY3Rpb24gKG5ld1Byb2R1Y3QpIHtcbiAgICAgICAgdmFyIHByb2R1Y3QgPSBuZXdQcm9kdWN0O1xuICAgICAgICByZXR1cm4gcHJvZHVjdDtcbiAgICAgIH0pO1xuICB9O1xuXG4gIHJldHVybiBQcm9kdWN0c0ZhY3Rvcnk7XG5cbn0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuZmFjdG9yeSgnUmV2aWV3c0ZhY3RvcnknLCBmdW5jdGlvbiAoJGh0dHApIHtcblxuICB2YXIgUmV2aWV3c0ZhY3RvcnkgPSB7fTtcblxuICBmdW5jdGlvbiBnZXREYXRhIChyZXNwb25zZSkge1xuICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICB9XG5cbiAgUmV2aWV3c0ZhY3RvcnkuZmV0Y2hBbGwgPSBmdW5jdGlvbiAocHJvZHVjdElkKSB7XG4gICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9wcm9kdWN0cy8nICsgcHJvZHVjdElkICsgJy9yZXZpZXdzJylcbiAgICAudGhlbihnZXREYXRhKTtcbiAgfTtcblxuICByZXR1cm4gUmV2aWV3c0ZhY3Rvcnk7XG5cbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgnY2FydCcsIGZ1bmN0aW9uICgkc3RhdGUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICBzY29wZToge30sXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvY2FydC9jYXJ0Lmh0bWwnLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUpIHtcbiAgICAgICAgICAgIHNjb3BlLmNoZWNraW5nT3V0PWZhbHNlO1xuICAgICAgICAgICAgc2NvcGUuaXRlbXM9W107XG4gICAgICAgIFx0c2NvcGUuaXRlbXMudG90YWw9MDtcbiAgICAgICAgICAgIHNjb3BlLml0ZW1zLm51bWJlcj0wO1xuICAgICAgICAgICAgc2NvcGUuZXhwYW5kQ2FydD10cnVlO1xuICAgICAgICAgICAgc2NvcGUuc2NvbGRpbmdNZXNzYWdlcz1bXCJZb3UncmUgbm90IGdvbm5hIGZpZ2h0IHRoZSBwYXRyaWFyY2h5IGxpa2UgdGhhdCwgbm93IGFyZSB5b3U/XCIsXCJZb3UgbWF5IG5vdCBuZWVkIG1lbiwgYnV0IHlvdSBkbyBuZWVkIHRvb2xzLlwiLFwiQSB3b21hbiB3aXRob3V0IGEgbWFuIGlzIGxpa2UgYSBmaXNoIHdpdGhvdXQgYSBiaWN5Y2xlLCBidXQgZmlzaCBkZWZpbml0ZWx5IG5lZWQgdG9vbHMgdG8gZmlnaHQgdGhlIHBhdHJpYXJjaHkuXCIsXCJXZSBrbm93IHlvdSBoYXRlIGNhcGl0YWxpc20sIGJ1dCBldmVyeSBmZW1pbmlzdCBuZWVkcyBoZXIgdG9vbGtpdC5cIl07XG4gICAgICAgICAgICBzY29wZS5zY29sZGluZ01lc3NhZ2U9c2NvcGUuc2NvbGRpbmdNZXNzYWdlc1soTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogc2NvcGUuc2NvbGRpbmdNZXNzYWdlcy5sZW5ndGgpKV07XG5cbiAgICAgICAgICAgIHNjb3BlLmFkZFRvQ2FydD1mdW5jdGlvbihpdGVtKXtcbiAgICAgICAgICAgICAgICB2YXIgaW5kZXhPZkl0ZW09c2NvcGUuaXRlbXMuaW5kZXhPZihpdGVtKTtcbiAgICAgICAgICAgICAgICBpZihpbmRleE9mSXRlbT09LTEpe1xuICAgICAgICAgICAgICAgICAgICBpdGVtLnF1YW50aXR5PTE7XG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLml0ZW1zLnB1c2goaXRlbSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLml0ZW1zW2luZGV4T2ZJdGVtXS5xdWFudGl0eSsrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzY29wZS5pdGVtcy50b3RhbCs9aXRlbS5jdXJyZW50UHJpY2U7XG4gICAgICAgICAgICAgICAgc2NvcGUuaXRlbXMubnVtYmVyKys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzY29wZS4kb24oJ2FkZGluZ0l0ZW1Ub0NhcnQnLGZ1bmN0aW9uKGV2ZW50LGRhdGEpe1xuICAgICAgICAgICAgICAgIHNjb3BlLmFkZFRvQ2FydChkYXRhKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICBzY29wZS4kb24oJ2JhY2tUb1Nob3BwaW5nJyxmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIHNjb3BlLmNoZWNraW5nT3V0PWZhbHNlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBzY29wZS5yZW1vdmVGcm9tQ2FydD1mdW5jdGlvbihpdGVtVG9SZW1vdmUscXVhbnRpdHkpe1xuICAgICAgICAgICAgXHRmb3IgKHZhciBpPTA7IGk8c2NvcGUuaXRlbXMubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgXHRcdGlmKHNjb3BlLml0ZW1zW2ldLmlkPT09aXRlbVRvUmVtb3ZlLmlkKXtcbiAgICAgICAgICAgIFx0XHRcdGlmKHF1YW50aXR5PT09J2FsbCd8fHNjb3BlLml0ZW1zW2ldLnF1YW50aXR5PT09MSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGUuaXRlbXMudG90YWwtPShzY29wZS5pdGVtc1tpXS5jdXJyZW50UHJpY2Uqc2NvcGUuaXRlbXNbaV0ucXVhbnRpdHkpO1xuICAgICAgICAgICAgXHRcdFx0XHRzY29wZS5pdGVtcy5zcGxpY2UoaSwxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY29wZS5pdGVtcy5udW1iZXI9MDtcbiAgICAgICAgICAgIFx0XHRcdH1cbiAgICAgICAgICAgIFx0XHRcdGVsc2UgaWYocXVhbnRpdHk9PT0nb25lJyl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGUuaXRlbXMudG90YWwtPXNjb3BlLml0ZW1zW2ldLmN1cnJlbnRQcmljZTtcbiAgICAgICAgICAgIFx0XHRcdFx0c2NvcGUuaXRlbXNbaV0ucXVhbnRpdHktLTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY29wZS5pdGVtcy5udW1iZXItLTtcbiAgICAgICAgICAgIFx0XHRcdH1cbiAgICAgICAgICAgIFx0XHRcdGJyZWFrO1xuICAgICAgICAgICAgXHRcdH1cbiAgICAgICAgICAgIFx0fVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2NvcGUuY2FydElzRW1wdHk9ZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIFx0cmV0dXJuIHNjb3BlLml0ZW1zLmxlbmd0aD09PTA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzY29wZS50b2dnbGVFeHBhbmQ9ZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICBzY29wZS5leHBhbmRDYXJ0PSFzY29wZS5leHBhbmRDYXJ0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2NvcGUudG9nZ2xlQ2hlY2tvdXQ9ZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICB2YXIgc2VyaWFsaXplZD1KU09OLnN0cmluZ2lmeShzY29wZS5pdGVtcyk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coc2NvcGUuaXRlbXMpO1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnY2hlY2tvdXQnLHtpdGVtczogc2VyaWFsaXplZCxudW1iZXI6c2NvcGUuaXRlbXMubnVtYmVyLHRvdGFsOnNjb3BlLml0ZW1zLnRvdGFsfSk7XG4gICAgICAgICAgICAgICAgc2NvcGUuY2hlY2tpbmdPdXQ9dHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbn0pOyIsImFwcC5kaXJlY3RpdmUoJ2Z1bGxzdGFja0xvZ28nLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9mdWxsc3RhY2stbG9nby9mdWxsc3RhY2stbG9nby5odG1sJ1xuICAgIH07XG59KTsiLCJhcHAuZGlyZWN0aXZlKCduYXZiYXInLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgQXV0aFNlcnZpY2UsIEFVVEhfRVZFTlRTLCAkc3RhdGUpIHtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9uYXZiYXIvbmF2YmFyLmh0bWwnLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUpIHtcblxuICAgICAgICAgICAgc2NvcGUuaXRlbXMgPSBbXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ0hvbWUnLCBzdGF0ZTogJ2hvbWUnIH0sXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ0Fib3V0Jywgc3RhdGU6ICdhYm91dCcgfSxcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnUHJvZHVjdHMnLCBzdGF0ZTogJ3Byb2R1Y3RzJyB9LFxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdNZW1iZXJzIE9ubHknLCBzdGF0ZTogJ21lbWJlcnNPbmx5JywgYXV0aDogdHJ1ZSB9XG4gICAgICAgICAgICBdO1xuXG4gICAgICAgICAgICBzY29wZS51c2VyID0gbnVsbDtcblxuICAgICAgICAgICAgc2NvcGUuaXNMb2dnZWRJbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzY29wZS5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgQXV0aFNlcnZpY2UubG9nb3V0KCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdob21lJyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB2YXIgc2V0VXNlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLnVzZXIgPSB1c2VyO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIHJlbW92ZVVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgc2NvcGUudXNlciA9IG51bGw7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzZXRVc2VyKCk7XG5cbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLmxvZ2luU3VjY2Vzcywgc2V0VXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5sb2dvdXRTdWNjZXNzLCByZW1vdmVVc2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LCByZW1vdmVVc2VyKTtcblxuICAgICAgICB9XG5cbiAgICB9O1xuXG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ3JhbmRvR3JlZXRpbmcnLCBmdW5jdGlvbiAoUmFuZG9tR3JlZXRpbmdzKSB7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL3JhbmRvLWdyZWV0aW5nL3JhbmRvLWdyZWV0aW5nLmh0bWwnLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUpIHtcbiAgICAgICAgICAgIHNjb3BlLmdyZWV0aW5nID0gUmFuZG9tR3JlZXRpbmdzLmdldFJhbmRvbUdyZWV0aW5nKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG59KTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
>>>>>>> master
