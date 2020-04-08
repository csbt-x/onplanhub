App.requires.push('intlpnIonic');
App.requires.push('ngTable');





App.factory('AwesomeForms', function($rootScope, $http, Url, Application, Push) {

    var factory = {};

    factory.value_id = null;
    factory.record_id = null;

    factory.findAll = function() {

        if(!this.value_id) return;

        return $http({
            method: 'GET',
            url: Url.get("awesomeforms/mobile_view/findall", {value_id: this.value_id}),
            cache: false,
            responseType:'json'
        });
    };
    
    factory.findAllRevisions = function() {

        if(!this.value_id) return;

        return $http({
            method: 'GET',
            url: Url.get("awesomeforms/mobile_view/findallrevisions", {value_id: this.value_id,id: this.record_id}),
            cache: false,
            responseType:'json'
        });
    };
    
    
    factory.findChart = function() {

        if(!this.value_id) return;

        return $http({
            method: 'GET',
            url: Url.get("awesomeforms/mobile_view/reportsdata", {value_id: this.value_id}),
            cache: false,
            responseType:'json'
        });
    };
    
    
    
    factory.findOne = function() {

        if(!this.value_id) return;

        return $http({
            method: 'GET',
            url: Url.get("awesomeforms/mobile_view/find", {value_id: this.value_id,id: this.record_id}),
            cache: false,
            responseType:'json'
        });
    };

    factory.post = function (form) {

        if (!this.value_id) return;
        
        var device_uid = null;
        	  try {
        if(!Application.is_webview) {
            device_uid = Push.device_uid;
	        }
	    } catch(e) {
	        device_uid = null;
	    }
	   
	   	

        var url = Url.get("awesomeforms/mobile_view/post", {value_id: this.value_id,id: this.record_id});
        var data = {form: form, device_uid: device_uid};
		
        return $http.post(url, data);
    };
    
    factory.login = function (form) {

        if (!this.value_id) return;

        var url = Url.get("awesomeforms/mobile_view/loginas", {value_id: this.value_id,customer_id: this.customer_id,key:this.key});
        var data = {form: form};

        return $http.post(url, data);
    };

    return factory;
});


App.config(function($stateProvider) {

  
    
    $stateProvider.state('awesomeforms-list', {
    	cache:false,
        url: BASE_PATH+"/awesomeforms/mobile_list/index/value_id/:value_id",
        controller: 'AwesomeformsListController',
        templateUrl: "modules/awesomeforms/templates/l1/list.html",
    });
    
    


}).controller('AwesomeformsListController', function($cordovaCamera,ngTableDefaults, $state, $cordovaGeolocation,AUTH_EVENTS, $http, $ionicActionSheet,$ionicModal, $location, $rootScope, $scope, $stateParams, $timeout, $translate, Application, Dialog,$window, AwesomeForms, Customer, GoogleMaps,NgTableParams) {

	 var self = this;
	
	$scope.selectedChartItem = {label:"",value:""};
	// var data = [{"name": "Moroni", "age": 50} /*,*/];
	// $scope.tableParams = new NgTableParams({}, { dataset: data});
	//ngTableDefaults.params.count = 5;
    ngTableDefaults.settings.counts = [5,10,50,100,200];
    
	$scope.cols = [
      { field: "name", title: "Name", show: true },
      { field: "age", title: "Age", show: true },
      { field: "money", title: "Money", show: true }
    ];
	
	$scope.$on("connectionStateChange", function(event, args) {
        if(args.isOnline == true) {
            $scope.loadContent();
        }
    });
    $scope.is_loading = true;
    $scope.is_logged_in = Customer.isLoggedIn();
    $scope.can_take_pictures = !Application.is_webview;
    $scope.value_id = AwesomeForms.value_id = $stateParams.value_id;
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
    	AwesomeForms.key = $stateParams.key;
    	AwesomeForms.customer_id = $stateParams.customer_id;
    	AwesomeForms.login().success(function(data) {
    		Customer.clearCredentials();
    		Customer.flushData();
    		$window.localStorage.setItem("sb-auth-token", data.token);

            Customer.saveCredentials(data.token);
            Customer.id = data.customer_id;
            Customer.can_access_locked_features = data.can_access_locked_features;
            Customer.flushData();
            $rootScope.isLoggedinAsuser = true;
            $scope.loadContent();
            $timeout(function(){
            	$location.hash("#/"+BASE_PATH+"awesomeforms/mobile_view/index/value_id/"+$stateParams.value_id);
            },1000);
            

        }).error(function() {

        }).finally(function() {
            $scope.is_loading = false;
        });
    	//alert($stateParams.token);
    	
    }


	$scope.addNew = function(){
		$state.go('awesomeforms-view', $stateParams);

		
		
	}
	
	$scope.update = function(row){
		$stateParams.id = row.id;
		$state.go('awesomeforms-view', $stateParams);
		// $stateParams.id = self.data[index].id;
		// console.log(self.data[index].id);
		// $state.go('awesomeforms-view', $stateParams);

	}
	
	 var fields = new Array();
	  
	
	$scope.applyUserFilter = function(user){
		
		if(!$scope.chartVisible || !$scope.tableParams) 
			    	return false;
	    if( user =="All")
	    		$scope.tableParams.filter({  });
	    else
	    		$scope.tableParams.filter({ "User Email": user });

	}
	  

	
	// $scope.$watch('selectedChartItem', function () {
	//     //Do anything with $scope.letters
	//     if(!$scope.chartVisible || !$scope.tableParams) 
	//     	return false;
	//     if( $scope.selectedChartItem.label =="All")
	//     		$scope.tableParams.filter({  });
	//     else
	//     		$scope.tableParams.filter({ "User Email": $scope.selectedChartItem.label });
	    		
	// });
	
	 $scope.loadGridData = function(){
	 	
	 	  AwesomeForms.findOne().success(function(data) {
            $scope.sections = data.sections;
            $scope.page_title = data.page_title;
            $scope.formData = data.metadatas;
            $scope.country = data.country;
            
            console.log($scope.data);
            var filterOptions = new Array();
         	// for (var m in $scope.data){
         	// 	filterOptions[$scope.data[m]['User Email']]=  {"title":$scope.data[m]['User Email'],"id":$scope.data[m]['User Email']};
         	// }
         
         	for (var m in $scope.data){
         		filterOptions[$scope.data[m]['customer_id']]=  {"title":$scope.data[m]['Customer Name'],"id":$scope.data[m]['Customer Name']};
         	}
         	
         	//customer_id
         	console.log(filterOptions);

         	var cnt = 0;
         	 var filterOptionsArr = new Array();
         	for (var m in filterOptions){
         		filterOptionsArr[cnt]=  filterOptions[m];
         		cnt = cnt+1;
         	}
         	console.log(filterOptionsArr);
			var fieldata = {field :"Customer Name", name: "Customer Name", title: $translate.instant("Creator"),show:true,sortable:'customer_id', filter:{"Customer Name":"select"},filterData:filterOptionsArr }; 
		    fields.push(fieldata);
            /** Setting Date format for datefield **/
            for(var s in  $scope.sections){
	            for(var f in $scope.sections[s].fields){
	            	if(!$scope.fields && $scope.sections[s].fields[f].type!="image" && $scope.sections[s].fields[f].type!="signature"){
		            	var fieldata = $scope.sections[s].fields[f];
						var name= fieldata.name;

		            	fieldata.title = name;
		            	fieldata.field = name;
		            	fieldata.name= fieldata.name.replace(" *", "");
		            	fieldata.title = fieldata.title.replace(" *", "");
		            	fieldata.field = fieldata.field.replace(" *", "");
		            	fieldata.sortable= name;
		            	var filter = {};
		            	var type= "text";
		            	if(fieldata.type=="select")
		            		type= "select";
		     //       	if(fieldata.type=="nombre")
							// type= "number";

	
						filter[fieldata.name] = type;
          				fieldata.filter = filter;
          				fieldata.filterData = fieldata.options;
          				for(var fkey in fieldata.filterData){
          					fieldata.filterData[fkey].title = fieldata.filterData[fkey].name;
          					fieldata.filterData[fkey].id = fieldata.filterData[fkey].name;

          				}
		            	fieldata.show = true;
		            	fields.push(fieldata);
	            	}

	            	if($scope.sections[s].fields[f].type=="date" || $scope.sections[s].fields[f].type=="anniversary" || $scope.sections[s].fields[f].type=="birthday"){
	            		$scope.formData[$scope.sections[s].fields[f].id] = new Date($scope.formData[$scope.sections[s].fields[f].id]);
	            	}
	            }
            }
            /** end- date format*/

            $scope.fields = fields;
            
            console.log(fields);

        }).error(function() {

        }).finally(function() {
            $scope.is_loading = false;
        });
	 	
	 }
	 
	 $scope.loadContent = function() {
	 	
	 	AwesomeForms.findAll().success(function(data) {
	 		$scope.data = data.data;
	 		$scope.loadGridData();

	 		$scope.tableParams = new NgTableParams({}, {       
	 			//filter: { name: "T" } ,
				dataset: $scope.data
	 			
	 		});
	 		//console.log($scope.data);
	 	 	


	 	}).error(function() {

        }).finally(function() {
            $scope.is_loading = false;
        });
        
        
        //** Laoding Chart Data **/
        AwesomeForms.findChart().success(function(data) {
	 		$scope.chartItems = data.chart;
	 		$scope.chartVisible = data.chartVisible;
	 		if(data.chart.length>0){
		 		$scope.selectedChartItem = data.chart[0];
	 		}
	 		

	 	}).error(function() {

        }).finally(function() {
            $scope.is_loading = false;
        });
        
        

      

    };
    
    
    
    $scope.loadContent();

	
});

App.config(function($stateProvider) {

    $stateProvider.state('awesomeforms-view', {
    	cache:false,
        url: BASE_PATH+"/awesomeforms/mobile_view/index/value_id/:value_id/id/:id",
        controller: 'AwesomeformsViewController',
        templateUrl: "modules/awesomeforms/templates/l1/view.html"
    });
    
  
    
    $stateProvider.state('awesomeforms-view-login', {
    	cache:false,
        url: BASE_PATH+"/awesomeforms/mobile_view/index/value_id/:value_id/customer_id/:customer_id/key/:key",
        controller: 'AwesomeformsViewController',
        templateUrl: "modules/awesomeforms/templates/l1/view.html"
    });


}).controller('AwesomeformsViewController', function($cordovaCamera, ngTableDefaults, $ionicHistory, $cordovaGeolocation,AUTH_EVENTS, $http, $ionicActionSheet,$ionicModal, $location, $rootScope, $scope, $stateParams, $timeout, $translate, Application, Dialog,$window, AwesomeForms, Customer, GoogleMaps,Picture, NgTableParams) {


	var self = this;

	// var data = [{"name": "Moroni", "age": 50} /*,*/];
	// $scope.tableParams = new NgTableParams({}, { dataset: data});
	//ngTableDefaults.params.count = 5;
    //ngTableDefaults.settings.counts = [];
    
    ngTableDefaults.settings.counts = [5,10,50,100,200];
	
	$scope.boundingBox = {
        width: 700,
        height: 300
    };
    
    $scope.$on("connectionStateChange", function(event, args) {
        if(args.isOnline == true) {
            $scope.loadContent();
        }
    });
    $scope.is_loading = true;
    $scope.is_logged_in = Customer.isLoggedIn();
    $scope.can_take_pictures = !Application.is_webview;
    $scope.value_id = AwesomeForms.value_id = $stateParams.value_id;
    $scope.record_id = AwesomeForms.record_id = $stateParams.id;

    $scope.formData = {};
    $scope.preview_src = {};
    $scope.geolocation = {};
    $scope.dataurl ='';
    
    
    
     $rootScope.$on(AUTH_EVENTS.loginSuccess, function() {
                $scope.is_logged_in = true;
               $scope.loadContent();
            });
    if(!$scope.is_logged_in) {

           

            $ionicModal.fromTemplateUrl('templates/customer/account/l1/login.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function(modal) {
                Customer.modal = modal;
                Customer.modal.show();
                 $scope.is_loading = false;
            });
        }
    
    if($stateParams.key){
    	$rootScope.profileBackend = true;
    	$scope.is_loading = true;
    	AwesomeForms.key = $stateParams.key;
    	AwesomeForms.customer_id = $stateParams.customer_id;
    	AwesomeForms.login().success(function(data) {
    		Customer.clearCredentials();
    		Customer.flushData();
    		$window.localStorage.setItem("sb-auth-token", data.token);

            Customer.saveCredentials(data.token);
            Customer.id = data.customer_id;
            Customer.can_access_locked_features = data.can_access_locked_features;
            Customer.flushData();
            $rootScope.isLoggedinAsuser = true;
            $scope.loadContent();
            $timeout(function(){
            	$location.hash("#/"+BASE_PATH+"awesomeforms/mobile_view/index/value_id/"+$stateParams.value_id);
            },1000);
            

        }).error(function() {

        }).finally(function() {
            $scope.is_loading = false;
        });
    	//alert($stateParams.token);
    	
    }

		var fields = new Array();

    $scope.loadContent = function() {
    	
    	AwesomeForms.findAllRevisions().success(function(data) {
	 		$scope.data = data.data;
	 		$scope.tableParams = new NgTableParams({}, {       
	 			filter: { name: "T" } ,
				dataset: $scope.data
	 			
	 		});

	 	}).error(function() {

        }).finally(function() {
            $scope.is_loading = false;
        });

        AwesomeForms.findOne().success(function(data) {
            $scope.sections = data.sections;
            $scope.page_title = data.page_title;
            $scope.settings    = data.settings;
            $scope.formData = data.metadatas;
            $scope.country = data.country;
            
            
            var fieldata = {field :"createdTime", name: "Created At", title: $translate.instant("Created At"),show:true,sortable:'customer_id'}; 
		    fields.push(fieldata);

            /** Setting Date format for datefield **/
            for(var s in  $scope.sections){

	            for(var f in $scope.sections[s].fields){
	            	
	            	
	            		if(!$scope.fields && $scope.sections[s].fields[f].type!="image"  && $scope.sections[s].fields[f].type!="signature"){
		            	var fieldata = $scope.sections[s].fields[f];
		            	var name= fieldata.name;

		            	fieldata.title = name;
		            	fieldata.field = name;
		            	fieldata.name= fieldata.name.replace(" *", "");
		            	fieldata.title = fieldata.title.replace(" *", "");
		            	fieldata.field = fieldata.field.replace(" *", "");
		            	fieldata.sortable= name;
		            	var filter = {};
		            	var type= "text";
		            	if(fieldata.type=="select")
		            		type= "select";
		     //       	if(fieldata.type=="nombre")
							// type= "number";

		            		
						filter[name] = type;
          				fieldata.filter = filter;
          				fieldata.filterData = fieldata.options;
          				for(var fkey in fieldata.filterData){
          					fieldata.filterData[fkey].title = fieldata.filterData[fkey].name;
          					fieldata.filterData[fkey].id = fieldata.filterData[fkey].name;

          				}
		            	fieldata.show = true;
		            	fields.push(fieldata);
	            	}


	            	if($scope.sections[s].fields[f].type=="date" || $scope.sections[s].fields[f].type=="anniversary" || $scope.sections[s].fields[f].type=="birthday"){
	            		$scope.formData[$scope.sections[s].fields[f].id] = new Date($scope.formData[$scope.sections[s].fields[f].id]);
	            	}
	            	if($scope.sections[s].fields[f].type=="image"){
	            		$scope.preview_src[$scope.sections[s].fields[f].id] = $scope.formData[$scope.sections[s].fields[f].id];
	            	}
	            }
            }
            /** end- date format*/
            
            $scope.fields = fields;

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
                	var coordStr = position.coords.latitude + "," + position.coords.longitude;
                    if (results[0]) {
                        $scope.formData[field.id] = results[0].formatted_address  + "++"+ coordStr;
                    } else {
                        $scope.formData[field.id] = coordStr+ "++ " ;
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


    $scope.getLocationAddress = function(field) {

		//alert(1);
        $scope.is_loading = true;
		var address = $scope.formData[field.id].split('++');
		if(address.length>0)
			address = address[0];

		//alert($scope.formData[field.id]);
        GoogleMaps.geocode(address).then(function(coords) {
        	var coordStr = coords.latitude + "," + coords.longitude;
            $scope.formData[field.id] =  address + "++"+ coordStr;
            

            $scope.is_loading = false;
        }, function(data) {
            $scope.formData[field.id] = null;
            $scope.is_loading = false;
        });

        

    
};

    $scope.takePicture = function(field) {

       Picture.takePicture()
            .then(function(success) {
                $scope.preview_src[field.id]    = success.image;
                $scope.formData[field.id]       = success.image;
            });
    };
    
   
	var signaturePad = {};
	var signaturePadCanvas 

	$scope.$watch('$viewContentLoaded', 
	    function() { 
	        $timeout(function() {
	            //do something
	            signaturePadCanvas = document.getElementsByClassName("signaturePadCanvas");
				var i;
				for (i = 0; i < signaturePadCanvas.length; i++) {
				  var field_id = signaturePadCanvas[i].getAttribute("field-id");
				 	signaturePad[field_id] =  new SignaturePad(signaturePadCanvas[i]);
				}
	        },1000);    
	});
	


		
    $scope.post = function(sendMail) {

        $scope.is_loading = true;
		//var signature = $scope.accept();
		
		//var canvas = angular.element($window).find('canvas')[0];


		var signaturePadCanvas = document.getElementsByClassName("signaturePadCanvas");
		var i;
		for (i = 0; i < signaturePadCanvas.length; i++) {
		  var field_id = signaturePadCanvas[i].getAttribute("field-id");
		  $scope.formData[field_id]  = signaturePad[field_id].toDataURL();
		  $scope.formData[field_id]
		}
		if(sendMail!=undefined && sendMail==1)
			$scope.formData['sendMail'] = 1;
		
			
		var objJsonStr = JSON.stringify($scope.formData);
		var objJsonB64 = btoa(objJsonStr);		

        AwesomeForms.post(objJsonB64).success(function(data) {
            //$scope.formData = {};
            //$scope.preview_src = {};
            
            if(data.success==1) {
            	
                Dialog.alert("", data.message, $translate.instant("OK"));
                //$state.go('awesomeforms-list', $stateParams);

            }
            if(sendMail)
            	$ionicHistory.goBack(-1);
            
        }).error(function(data) {
            if(data && angular.isDefined(data.message)) {
                Dialog.alert($translate.instant("Error"), data.message, $translate.instant("OK"));
            }
        }).finally(function() {
            $scope.is_loading = false;
            
        });
    };

    $scope.loadContent();

});








