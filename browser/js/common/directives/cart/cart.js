app.directive('cart', function ($state, $cookieStore) {
    return {
        restrict: 'E',
        scope: {},
        templateUrl: 'js/common/directives/cart/cart.html',
        link: function (scope) {
            scope.checkingOut=function(){
                return $state.is('checkout');
            }
            var cookieStoreItems = $cookieStore.get('cart');
            scope.cart = {};
            if (cookieStoreItems) {
                scope.cart = cookieStoreItems;
            } else {
                scope.cart.items = [];
                scope.cart.total=0;
                scope.cart.numItems=0;
            }


            scope.expandCart=true;
            scope.scoldingMessages=["You're not gonna fight the patriarchy like that, now are you?","You may not need men, but you do need tools.","A woman without a man is like a fish without a bicycle, but fish definitely need tools to fight the patriarchy.","We know you hate capitalism, but every feminist needs her toolkit."];
            scope.scoldingMessage=scope.scoldingMessages[(Math.floor(Math.random() * scope.scoldingMessages.length))];

            scope.addToCart=function(item){
                // Find out if item is already in the saved cart that comes from the cookie.
                // The 'find' method returns the item it looks for from the array or undefined.
                var existingItem = scope.cart.items.find(function (cartItem) {
                    return item.id === Number(cartItem.id);
                });
                if(!existingItem){
                    item.quantity=1;
                    scope.cart.items.push(item);
                } else {
                    existingItem.quantity++;
                }
                scope.cart.total+=item.currentPrice;
                scope.cart.numItems++;
                $cookieStore.put('cart', scope.cart);
            }

            scope.$on('addingItemToCart',function(event,data){
                scope.addToCart(data);
            });
            scope.removeFromCart=function(itemToRemove,quantity){
            	for (var i=0; i<scope.cart.items.length; i++){
            		if(scope.cart.items[i].id===itemToRemove.id){
            			if(quantity==='all'||scope.cart.items[i].quantity===1){
                            scope.cart.total-=(scope.cart.items[i].currentPrice*scope.cart.items[i].quantity);
            				scope.cart.items.splice(i,1);
                            scope.cart.numItems=0;
            			} else if (quantity==='one'){
                            scope.cart.total-=scope.cart.items[i].currentPrice;
            				scope.cart.items[i].quantity--;
                            scope.cart.numItems--;
            			}
            			break;
            		}
            	}
                $cookieStore.put('cart', scope.cart);
            }
            scope.cartIsEmpty=function(){
            	return scope.cart.items.length===0;
            }   
            scope.toggleExpand=function(){
                scope.expandCart=!scope.expandCart;
            }
            scope.toggleCheckout=function(){
                $state.go('checkout');
            }
        }
    };

});
