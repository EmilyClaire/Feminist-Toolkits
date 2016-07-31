app.directive('cart', function () {
    return {
        restrict: 'E',
        scope: {},
        templateUrl: 'js/common/directives/cart/cart.html',
        link: function (scope) {
        	scope.items=[]
            scope.total=0;
            scope.addToCart=function(item){
                var indexOfItem=scope.items.indexOf(item);
                if(indexOfItem==-1){
                    item.quantity=1;
                    scope.items.push(item);
                }
                else{
                    scope.items[indexOfItem].quantity++;
                }
                scope.total+=item.currentPrice;
            }
            scope.$on('addingItemToCart',function(event,data){
                scope.addToCart(data);
            })
            scope.removeFromCart=function(itemToRemove,quantity){
            	for (var i=0; i<scope.items.length; i++){
            		if(scope.items[i].id===itemToRemove.id){
            			if(quantity==='all'||scope.items[i].quantity===1){
                            scope.total-=(scope.items[i].currentPrice*scope.items[i].quantity);
            				scope.items.splice(i,1);
            			}
            			else if(quantity==='one'){
                            scope.total-=scope.items[i].currentPrice;
            				scope.items[i].quantity--;
            			}
            			break;
            		}
            	}
            }
            scope.cartIsEmpty=function(){
            	return scope.items.length===0;
            }
        }
    };

});