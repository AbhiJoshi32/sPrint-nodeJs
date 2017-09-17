var navTemplate;
var uid;
var loginKey = "userLoginStatus";
database = firebase.database();
firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
  	uid = user.uid;
  	console.log(uid);
  	shopRef = database.ref('shop-client/shop-info/');
  	shopRef.child(uid).
  		once('value',function(snapshot){
	  	if(snapshot.val()!=null){
			localStorage.setItem(loginKey,true);
	  		console.log("user is shop");
			getRow();
	  	}
	  	else{
	  		console.log("Normal User");
	  		
	  		logout();
	  		alert("Not a shop User");
	  	}
	});
  }
  else{
  	localStorage.clear();
  	console.log("Nobody is logged in");
  	window.location = '/login';
  }
});

$(document).ready(function(){
	console.log("the doc is readyy");
	if (localStorage.getItem(loginKey)) {
		console.log(localStorage.getItem(loginKey));
		loadNavbar();
  		$('.body-container').css('visibility','visible');
	}
	else {
		localStorage.clear();
		console.log("Nobody is logged in");
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
  		url: "html-snippets/req-row-snippet.html"
	}).done(function(data) {
		navTemplate = data;
		getShopTransaction();
  });
}
function getShopTransaction() {
	refString = "printTransaction/"+ uid;
	console.log("Trying to connect to firebase for");
	console.log(refString);
	ref = database.ref('printTransaction/'+uid);
	ref.on("value",function(snapshot) {
		if (snapshot.val()) {
			updateRows(snapshot.val());
		}
		else {
			$('.req-content').html("");
		}
	});
}
var reqid;
var token;
function updateRows(snapshot) {
	console.log("the snapshop recied is "+snapshot);
	reqHtml = "";
	pendingHtml = "";
	tempNavTemplate = $.parseHTML(navTemplate);
	console.log(snapshot.key);

	for(snap in snapshot) {
		tempNavTemplate = $.parseHTML(navTemplate);
		console.log(snap);
		obj = snapshot[snap]["printTransaction"];
		snapFile = obj['fileDetails'];
		reqid = obj['uid'];
		snapBindingCost = snapshot[snap]['bindingCost'];
		snapPrintCost = snapshot[snap]['printCost'];		
		snapTotalCost = snapPrintCost + snapBindingCost;
		console.log(snapFile);
		snapStatus = snapshot[snap]['status'];
		snapOrientation = obj['printOrientation'];
		snapBinding = obj['printDetail']['bindingType'];
		snapColor = obj['printDetail']['printColor'];
		snapPaperType = obj['printDetail']['printPaperType'];
		snapNoCopies = obj['printDetail']['printCopies'];
		snapSided = obj['printDetail']['pagesPerSheet'];
		snapToken =snapshot[snap]['user']['requestToken'];
		ul = "<ul>";
		for (file in snapFile) {
			console.log(snapFile[file]);
			ul+=("<li><a href=" + snapFile[file]['downloadUrl']+">"+snapFile[file]['filename']+"</a></li>");
		}
		ul+="</ul>";
		console.log(snapFile,snapStatus,snapBinding,snapColor);
		$(tempNavTemplate).find('.total-pages').html()
		$(tempNavTemplate).find('.file-list').html(ul)
		$(tempNavTemplate).find('.type').html(snapPaperType);
		$(tempNavTemplate).find('.color').html(snapColor);
		$(tempNavTemplate).find('.binding').html(snapBinding);
		$(tempNavTemplate).find('.cost').html(snapTotalCost);
		$(tempNavTemplate).find('.orientation').html(snapOrientation);
		if(snapStatus=="Waiting"){
			console.log("The requeted token is "+snapToken);
			$(tempNavTemplate).find('.confirm').attr("data-token",snapToken).attr("id",snap).addClass("reqConfirm").attr("tokenId",);
			$(tempNavTemplate).find('.reject').attr("id",snap).attr("data-token",snapToken).addClass("reqReject");
			reqHtml = tempNavTemplate[0].innerHTML + reqHtml;
		}
		else if(snapStatus=="Printing"){
			$(tempNavTemplate).find('.confirm').attr("id",snap).attr("data-token",snapToken).addClass("printConfirm");
			$(tempNavTemplate).find('.reject').attr("id",snap).attr("data-token",snapToken).addClass("printReject");
			pendingHtml = tempNavTemplate[0].innerHTML + pendingHtml;
		}
	
	}
	$('.req-content').html(reqHtml);
	$('.pend-content').html(pendingHtml);
	$('.reqConfirm').click(function() {
		nodeObj= {};
		nodeObj['token'] = $('.reqConfirm').data("token");
		nodeObj['message'] = "Print Confirmed";
		console.log("node obj is");
		console.log(nodeObj);
		database.ref('notification/').push(nodeObj);
		updates={};
		updates['status'] = "Printing";
		database.ref('printTransaction/'+uid+'/'+this.id).update(updates);
		database.ref('userTransaction/'+reqid+'/'+this.id).update(updates);
	});

	$('.reqReject').click(function() {
		nodeObj= {};
		nodeObj['token'] = $('.reqReject').data("token");
		nodeObj['message'] = "Print Cancelled";
		console.log("node obj is");
		console.log(nodeObj);
		database.ref('notification/').push(nodeObj);
		updates={};
		updates['status'] = "Cancelled";
		database.ref('printTransaction/'+uid+'/'+this.id).update(updates);
		database.ref('userTransaction/'+reqid+'/'+this.id).update(updates);
	});

	$('.printReject').click(function() {
		nodeObj= {};
		nodeObj['token'] = $('.printReject').data("token");
		nodeObj['message'] = "Print Cancelled";
		console.log("node obj is");
		console.log(nodeObj);
		database.ref('notification/').push(nodeObj);
		updates={};
		updates['status'] = "Cancelled";
		database.ref('printTransaction/'+uid+'/'+this.id).update(updates);
		database.ref('userTransaction/'+reqid+'/'+this.id).update(updates);
	});
	$('.printConfirm').click(function() {
		nodeObj= {};
		nodeObj['token'] = $('.printConfirm').data("token");
		nodeObj['message'] = "Print Completed";
		console.log("node obj is");
		console.log(nodeObj);
		ref = database.ref('transactions/'+uid+'/'+this.id);
		updates={};
		updates['status'] = "Printed";
		database.ref('printTransaction/'+uid+'/'+this.id).update(updates);
		database.ref('userTransaction/'+reqid+'/'+this.id).update(updates);
	});
}

function logout(){
	firebase.auth().signOut().then(function() {
	 console.log("Logout Successful");
	 localStorage.clear();
	 window.location = "/login"
	 }).catch(function(error) {
	  console.log("Logout Unsuccessful");
	});
}