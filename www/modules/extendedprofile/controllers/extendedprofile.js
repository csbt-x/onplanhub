App.requires.push('intlpnIonic');

App.factory('ExtendedProfile', function($rootScope, $http, Url, Application, Push, $session) {

    var factory = {};

    factory.value_id = null;

    factory.findAll = function() {

        if(!this.value_id) return;

        return $http({
            method: 'GET',
            url: Url.get("extendedprofile/mobile_view/find", {value_id: this.value_id}),
            cache: false,
            responseType:'json'
        });
    };

    factory.post = function (form) {

        if (!this.value_id) return;
        
        var device_uid = null;
        	  try {
        if(!Application.is_webview) {
            device_uid = $session.getDeviceUid();
	        }
	    } catch(e) {
	        device_uid = null;
	    }
	   
	   	

        var url = Url.get("extendedprofile/mobile_view/post", {value_id: this.value_id});
        var data = {form: form, device_uid: device_uid};
		
		$rootScope.$broadcast("RefreshRoles");
        return $http.post(url, data);
    };
    
    factory.login = function (form) {

        if (!this.value_id) return;

        var url = Url.get("extendedprofile/mobile_view/loginas", {value_id: this.value_id,customer_id: this.customer_id,key:this.key});
        var data = {form: form};

        return $http.post(url, data);
    };

    return factory;
});


App.config(function($stateProvider) {

    $stateProvider.state('extendedprofile-view', {
    	cache:false,
        url: BASE_PATH+"/extendedprofile/mobile_view/index/value_id/:value_id",
        controller: 'ExtendedprofileViewController',
        templateUrl: "modules/extendedprofile/templates/l1/view.html",
    });
    
    $stateProvider.state('extendedprofile-view-login', {
    	cache:false,
        url: BASE_PATH+"/extendedprofile/mobile_view/index/value_id/:value_id/customer_id/:customer_id/key/:key",
        controller: 'ExtendedprofileViewController',
        templateUrl: "modules/extendedprofile/templates/l1/view.html",
    });


}).controller('ExtendedprofileViewController', function($cordovaCamera, $cordovaGeolocation,AUTH_EVENTS, $http, $ionicHistory, $ionicActionSheet,$ionicModal, $location, $rootScope, $scope, $stateParams, $timeout, $translate, Application, Dialog,$window,Picture, ExtendedProfile, Customer, GoogleMaps) {

    $scope.$on("connectionStateChange", function(event, args) {
        if(args.isOnline == true) {
            $scope.loadContent();
        }
    });
    $scope.is_loading = true;
    $scope.is_logged_in = Customer.isLoggedIn();
    $scope.can_take_pictures = !Application.is_webview;
    $scope.value_id = ExtendedProfile.value_id = $stateParams.value_id;
    $scope.formData = {};
    $scope.preview_src = {};
    $scope.geolocation = {};
    
     $rootScope.$on(AUTH_EVENTS.loginSuccess, function() {
                $scope.is_logged_in = true;
               $scope.loadContent();
            });
    if(!$scope.is_logged_in) {

           
			Customer.loginModal($scope, function() {
	            $scope.is_logged_in = Customer.isLoggedIn();
	            $scope.loadContent(true);
        	});
            // $ionicModal.fromTemplateUrl('templates/customer/account/l1/login.html', {
            //     scope: $scope,
            //     animation: 'slide-in-up'
            // }).then(function(modal) {
            //     Customer.modal = modal;
            //     Customer.modal.show();
            //      $scope.is_loading = false;
            // });
        }
    
    if($stateParams.key){
    	$rootScope.profileBackend = true;
    	$scope.is_loading = true;
    	ExtendedProfile.key = $stateParams.key;
    	ExtendedProfile.customer_id = $stateParams.customer_id;
    	Customer.logout();
    	ExtendedProfile.login().success(function(data) {

    		$window.localStorage.setItem("sb-auth-token", data.token);

            Customer.saveCredentials(data.token);
            //Customer.customer = data;
            Customer.id = data.customer_id;
            Customer.can_access_locked_features = data.can_access_locked_features;
        	Customer.is_logged_in = true;
        	Customer.can_connect_with_facebook = false;
            //Customer.logout();
            $rootScope.isLoggedinAsuser = true;
            $scope.loadContent();
            $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
            //alert("extendedprofile/mobile_view/index/value_id/"+$stateParams.value_id);
            $timeout(function(){
            	$location.hash("#/"+BASE_PATH+"extendedprofile/mobile_view/index/value_id/"+$stateParams.value_id);
            },5000);
            

        }).error(function() {

        }).finally(function() {
            $scope.is_loading = false;
        });
    	//alert($stateParams.token);
    	
    }

    $scope.loadContent = function() {

        ExtendedProfile.findAll().success(function(data) {
            $scope.sections = data.sections;
            $scope.page_title = data.page_title;
            $scope.dateFormat = data.dateFormat;
            $scope.formData = data.metadatas;
            $scope.country = data.country;
            

            /** Setting Date format for datefield **/
            for(var s in  $scope.sections){

	            for(var f in $scope.sections[s].fields){
	            	if($scope.sections[s].fields[f].type=="date" || $scope.sections[s].fields[f].type=="anniversary" || $scope.sections[s].fields[f].type=="birthday"){
	            		$scope.formData[$scope.sections[s].fields[f].id] = new Date($scope.formData[$scope.sections[s].fields[f].id]);
	            	}
	            	if($scope.sections[s].fields[f].type=="image"){
	            		$scope.preview_src[$scope.sections[s].fields[f].id] = $scope.formData[$scope.sections[s].fields[f].id];
	            	}
	            }
            }
            /** end- date format*/

        }).error(function() {

        }).finally(function() {
            $scope.is_loading = false;
        });

    };

    $scope.getLocation = function(field) {

        if($scope.geolocation[field.id]) {

            $scope.is_loading = true;

            $cordovaGeolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }).then(function(position) {

                GoogleMaps.reverseGeocode(position.coords).then(function(results) {
                    if (results[0]) {
                        $scope.formData[field.id] = results[0].formatted_address;
                    } else {
                        $scope.formData[field.id] = position.coords.latitude + ", " + position.coords.longitude;
                    }
                    $scope.is_loading = false;
                }, function(data) {
                    $scope.formData[field.id] = null;
                    $scope.geolocation[field.id] = false;
                    $scope.is_loading = false;
                });

            }, function(e) {
                $scope.is_loading = false;

                $scope.formData[field.id] = null;
                $scope.geolocation[field.id] = false;

            });

        } else {
            $scope.formData[field.id] = null;
        }
    };

    $scope.takePicture = function(field) {
		 Picture.takePicture()
            .then(function(success) {
                $scope.preview_src[field.id]    = success.image;
                $scope.formData[field.id]       = success.image;
            });

    };

    $scope.post = function() {

        $scope.is_loading = true;
		
	
		var objJsonStr = JSON.stringify($scope.formData);
		var objJsonB64 = btoa(objJsonStr);
		
        ExtendedProfile.post(objJsonB64).success(function(data) {
            //$scope.formData = {};
            //$scope.preview_src = {};
            if(data.success) {
            	$rootScope.fillProfileMatadata= false;
            	$ionicHistory.goBack(-1);

                Dialog.alert("", data.message, $translate.instant("OK"));
            }
        }).error(function(data) {
            if(data && angular.isDefined(data.message)) {
                Dialog.alert($translate.instant("Error"), data.message, $translate.instant("OK"));
            }
        }).finally(function() {
            $scope.is_loading = false;
            $rootScope.fillProfileMatadata= false;
            

        });
    };

    $scope.loadContent();

});



App.run(function($rootScope,$http,AUTH_EVENTS,ExtendedProfile,Customer,HomepageLayout,$pwaRequest,$state,$location,Application,$ionicHistory,$window) {
	 $rootScope.fillProfileMatadata = false;
	 $rootScope.isLoggedinAsuser = false;
	 $rootScope.profileBackend = false;

	  $rootScope.$on(AUTH_EVENTS.loginSuccess, function() {
	  	
	                			var promise = $pwaRequest.post('extendedprofile/mobile_view/findcustomer', {
						            cache: false
						        });
						
						        promise
						            .then(function (customer) {
						                console.log(customer);
		                				console.log("$window.top"+$window.top+"==$window.self"+$window.self);
							            if(customer.extendedProfileActive == true && $window.top==$window.self && (_.isEmpty(customer.metadatas) || ($rootScope.profileBackend && $rootScope.isLoggedinAsuser))) {
							            	var redirectProfilePath = customer.path;
	                						ExtendedProfile.value_id = customer.value_id;
							            	//console.log("redirect");
							            	//ExtendedProfile.key = $stateParams.key;
	    									//ExtendedProfile.customer_id = $stateParams.customer_id;
							            	 ExtendedProfile.findAll().success(function(data) {
	            							 	//$scope.sections = data.sections
	            							 	console.log(data);
	            							 	if(data.sections.length>0){
					                	         $rootScope.fillProfileMatadata = true;
					                	         //$location.path(redirectProfilePath);
					                	         
					                	         $state.go('extendedprofile-view', { 
									                value_id: ExtendedProfile.value_id,
									                },
									                { reload: true} 
									            );
	            							 		
	            							 	}
							            	 });
							            }
						
						                return customer;
						            }, function (data) {
						                if (data && angular.isDefined(data.message)) {
						                    Dialog.alert('Error', data.message, 'OK', -1);
						                }
						
						                return data;
						            }).then(function () {
						               // Loader.hide();
						            });
						
						        return promise;




    });
    
    $rootScope.$on('$stateChangeStart', function(event, toState,toParams, fromState, fromParams){
		console.log("$rootScope.isLoggedinAsuser"+$rootScope.isLoggedinAsuser);
	
			
        if($rootScope.fillProfileMatadata  && !$rootScope.profileBackend && !$rootScope.isLoggedinAsuser && fromState.name=="extendedprofile-view"){
            event.preventDefault();
            
        }
    })
    

    
});




