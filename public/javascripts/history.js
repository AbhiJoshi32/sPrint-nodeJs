var rowTemplate;
var historyObj;
var loginKey = "userLoginStatus";
var shopNameKey = "shop name";
var shopIdKey = "shop id";
var localHistory = "local history";
database = firebase.database();
firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
  	uid = user.uid;
  	shopRef = database.ref('shop-client/shop-info/');
  	shopRef.child(uid).
  		once('value',function(snapshot){
	  	if(snapshot.val()!=null){
			localStorage.setItem(loginKey,true);
			localStorage.setItem(shopIdKey,uid);
			localStorage.setItem(shopNameKey,snapshot.val()["shopName"]);
			database.ref('shop-client/shop-info/' + uid + "/shopAvailability").set("yes");
	 		database.ref('shop-client/shop-info/' + uid + "/shopAvailability").onDisconnect().set("no");
			getShopHistory();
	  	}
	  	else{
	  		logout();
	  		alert("Not a shop User");
	  	}
	});
  }
  else{
  	localStorage.clear();
  	window.location = '/login';
  }
});

$(document).ready(function(){
	if (localStorage.getItem(loginKey)) {
		historyObj = JSON.parse(localStorage.getItem(localHistory));
		console.log(historyObj);
		loadNavbar();
		getRow();
		$('.body').css('visibility','visible');
  		var shopName = localStorage.getItem(shopNameKey);
  		$('.shop-name').html(shopName);
	}
	else {
		localStorage.clear();
		window.location = '/login';
	}
});

function loadNavbar(){
	$.ajax({
  		url: "html-snippets/navbar-snippet.html"
	}).done(function(data) {
    	addNavbar(data);
  	});
}

function addNavbar(response){
	$('nav').html(response);
	$('.history-nav').addClass("active");
	$('.home-nav').removeClass("active");
	$('#logout').click(function(){
		logout();
	})
}

function getRow(){
	$.ajax({
  		url: "html-snippets/history-row.html"
	}).done(function(data) {
		rowTemplate = data;
		updateRows();
  });
}

function getShopHistory() {
	refString = "printCompleted/"+ uid;
	ref = database.ref(refString);
	ref.on("value",function(snapshot) {
		if (snapshot.val()) {
			console.log("value changed");
			historyObj = snapshot.val();
			localStorage.setItem(localHistory,JSON.stringify(historyObj));
			console.log(localStorage.getItem(localHistory));
			updateRows();
		}
		else {
			$('.req-content').html("");
			$('.pend-content').html("")
		}
	});
}

function updateRows() {
	historyHtml = "";
	if (rowTemplate != null) {
		for(snap in historyObj) {
			tempNavTemplate = $.parseHTML(rowTemplate);
			obj = historyObj[snap]["printTransaction"];
			snapDate = historyObj[snap]['issuedDate'];
			snapTime = historyObj[snap]['issuedTime'];
			snapPin = historyObj[snap]['pin'];
			snapEmail = historyObj[snap]['user']['emailId'];
			snapPrintCost = obj['printCost'];
			snapBindCost = obj['bindingCost'];
			totalCost = snapPrintCost + snapBindCost;
			$(tempNavTemplate).find('.time').html(snapTime);
			$(tempNavTemplate).find('.date').html(snapDate);
			$(tempNavTemplate).find('.pin').html(snapPin);
			$(tempNavTemplate).find('.email').html(snapEmail);
			$(tempNavTemplate).find('.cost').html(totalCost);
			if (historyObj[snap]['status']!="Cancelled") {
				historyHtml = tempNavTemplate[0].innerHTML + historyHtml;
			}
		}
		$('.history-content').html(historyHtml);
	}
}

function logout(){
	firebase.auth().signOut().then(function() {
	 localStorage.clear();
	 database.ref('shop-client/shop-info/' + uid + "/shopAvailability").set("no");
	 window.location = "/login"
	 }).catch(function(error) {
	});
}