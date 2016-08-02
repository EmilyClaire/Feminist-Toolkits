app.directive('cart', function ($state, $cookieStore) {
    return {
        restrict: 'E',
        scope: {},
        templateUrl: 'js/common/directives/cart/cart.html',
        link: function (scope) {
            scope.checkingOut=false;
            var cookieStoreItems = $cookieStore.get('items');
            scope.items=[];
            if (cookieStoreItems.length) {
                scope.items = cookieStoreItems;
            } else {
                scope.items.total=0;
                scope.items.number=0;
            }
            // could we just set total and number as properties on the scope, not on items?

            scope.expandCart=true;
            scope.scoldingMessages=["You're not gonna fight the patriarchy like that, now are you?","You may not need men, but you do need tools.","A woman without a man is like a fish without a bicycle, but fish definitely need tools to fight the patriarchy.","We know you hate capitalism, but every feminist needs her toolkit."];
            scope.scoldingMessage=scope.scoldingMessages[(Math.floor(Math.random() * scope.scoldingMessages.length))];

            scope.addToCart=function(item){
                // $cookieStore.remove('items');
                var indexOfItem=scope.items.indexOf(item);
                if(indexOfItem==-1){
                    item.quantity=1;
                    scope.items.push(item);
                }
                else{
                    scope.items[indexOfItem].quantity++;
                }
                scope.items.total+=item.currentPrice;
                scope.items.number++;
                $cookieStore.put('items', scope.items);
                console.log('this is the cookie store!!!! YAY! ', $cookieStore.get('items'));
            }

            scope.$on('addingItemToCart',function(event,data){
                scope.addToCart(data);
            });

            scope.$on('backToShopping',function(){
                scope.checkingOut=false;
            });

            scope.removeFromCart=function(itemToRemove,quantity){
            	for (var i=0; i<scope.items.length; i++){
            		if(scope.items[i].id===itemToRemove.id){
            			if(quantity==='all'||scope.items[i].quantity===1){
                            scope.items.total-=(scope.items[i].currentPrice*scope.items[i].quantity);
            				scope.items.splice(i,1);
                            scope.items.number=0;
            			}
            			else if(quantity==='one'){
                            scope.items.total-=scope.items[i].currentPrice;
            				scope.items[i].quantity--;
                            scope.items.number--;
            			}
            			break;
            		}
            	}
                $cookieStore.put('items', scope.items);
            }
            scope.cartIsEmpty=function(){
            	return scope.items.length===0;
            }
            scope.toggleExpand=function(){
                scope.expandCart=!scope.expandCart;
            }
            scope.toggleCheckout=function(){
                var serialized=JSON.stringify(scope.items);
                $state.go('checkout',{items: serialized,number:scope.items.number,total:scope.items.total});
                scope.checkingOut=true;
            }
        }
    };

});
