var rowTemplate;
var historyObj;
var loginKey = "userLoginStatus";
database = firebase.database();
firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
  	uid = user.uid;
  	shopRef = database.ref('shop-client/shop-info/');
  	shopRef.child(uid).
  		once('value',function(snapshot){
	  	if(snapshot.val()!=null){
			localStorage.setItem(loginKey,true);
			getRow();
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
		loadNavbar();
  		$('.body').css('visibility','visible');
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
			updateRows();
		}
		else {
			$('.req-content').html("");
			$('.pend-content').html("")
		}
	});
}

function updateRows() {
	// console.log("the snapshop recied is "+snapshot);
	historyHtml = "";
	// console.log(snapshot.key);

	for(snap in historyObj) {
		tempNavTemplate = $.parseHTML(rowTemplate);
		obj = historyObj[snap]["printTransaction"];
		snapDate = historyObj[snap]['issuedDate'];
		snapTime = historyObj[snap]['issuedTime'];
		snapEmail = historyObj[snap]['user']['emailId'];
		snapPrintCost = obj['printCost'];
		snapBindCost = obj['bindingCost'];
		totalCost = snapPrintCost + snapBindCost;
		$(tempNavTemplate).find('.date').html(snapDate);
		$(tempNavTemplate).find('.time').html(snapTime);
		$(tempNavTemplate).find('.email').html(snapEmail);
		$(tempNavTemplate).find('.cost').html(totalCost);
		historyHtml += tempNavTemplate[0].innerHTML;
	}
	$('.history-content').html(historyHtml);
}