var navTemplate;
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

function playNotification() {
	$("#my_audio").get(0).play();
}

$(document).ready(function(){
	if (localStorage.getItem(loginKey)) {
		loadNavbar();
  		$('.body-container').css('visibility','visible');
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
  		url: "html-snippets/req-row-snippet.html"
	}).done(function(data) {
		navTemplate = data;
		getShopTransaction();
  });
}
function getShopTransaction() {
	refString = "printTransaction/"+ uid;
	ref = database.ref('printTransaction/'+uid);
	ref.on("value",function(snapshot) {
		if (snapshot.val()) {
			console.log("value changed");
			updateRows(snapshot.val());
		}
		else {
			$('.req-content').html("");
			$('.pend-content').html("")
		}
	});
	ref.on("child_added", function(snapshot, prevChildKey) {
		playNotification();
	});
}

function updateRows(snapshot) {
	// console.log("the snapshop recied is "+snapshot);
	reqHtml = "";
	pendingHtml = "";
	tempNavTemplate = $.parseHTML(navTemplate);
	// console.log(snapshot.key);

	for(snap in snapshot) {
		tempNavTemplate = $.parseHTML(navTemplate);
		obj = snapshot[snap]["printTransaction"];
		snapFile = obj['fileDetails'];
		snapUserId = snapshot[snap]['user']['uid'];
		snapBindingCost = obj['bindingCost'];
		snapPrintCost = obj['printCost'];		
		snapTotalCost = snapPrintCost + snapBindingCost;
		snapStatus = snapshot[snap]['status'];
		snapOrientation = obj['printDetail']['printOrientation'];
		snapBinding = obj['printDetail']['bindingType'];
		snapColor = obj['printDetail']['printColor'];
		snapPaperType = obj['printDetail']['printPaperType'];
		snapNoCopies = obj['printDetail']['copies'];
		snapSided = obj['printDetail']['pagesPerSheet'];
		snapToken =snapshot[snap]['user']['requestToken'];
		snapPagesText = obj['printDetail']['pagesText'];
		snapTotalPages = obj['printDetail']['pagesToPrint'];
		ul = "<ul>";
		for (file in snapFile) {
			ul+=("<li><a href=" + snapFile[file]['downloadUrl']+">"+snapFile[file]['filename']+"</a></li>");
		}
		ul+="</ul>";
		// console.log(snapFile,snapStatus,snapBinding,snapColor);
		$(tempNavTemplate).find('.total-pages').html(snapTotalPages)
		$(tempNavTemplate).find('.file-list').html(ul)
		$(tempNavTemplate).find('.type').html(snapPaperType);
		$(tempNavTemplate).find('.color').html(snapColor);
		$(tempNavTemplate).find('.binding').html(snapBinding);
		$(tempNavTemplate).find('.cost').html(snapTotalCost);
		$(tempNavTemplate).find('.copies').html(snapNoCopies);
		$(tempNavTemplate).find('.sided').html(snapSided);
		$(tempNavTemplate).find('.pages').html(snapPagesText);
		$(tempNavTemplate).find('.orientation').html(snapOrientation);
		if(snapStatus=="Waiting"){
			// console.log("The requeted token is "+snapToken);
			$(tempNavTemplate).find('.confirm').attr("data-token",snapToken).attr("id",snap).attr("data-userid",snapUserId).addClass("reqConfirm").attr("tokenId",);
			$(tempNavTemplate).find('.reject').attr("id",snap).attr("data-token",snapToken).attr("data-userid",snapUserId).addClass("reqReject");
			reqHtml += tempNavTemplate[0].innerHTML;
		}
		else if(snapStatus=="Printing"){
			$(tempNavTemplate).find('.confirm').attr("id",snap).attr("data-token",snapToken).attr("data-userid",snapUserId).addClass("printConfirm");
			$(tempNavTemplate).find('.reject').attr("id",snap).attr("data-token",snapToken).attr("data-userid",snapUserId).addClass("printReject");
			pendingHtml += tempNavTemplate[0].innerHTML;
		}	
	}
	$('.req-content').html(reqHtml);
	$('.pend-content').html(pendingHtml);
	$('.reqConfirm').click(function() {
		nodeObj= {};
		nodeObj['token'] = $(this).data("token");
		userId = $(this).data("userid");
		nodeObj['message'] = "Print Confirmed";
		// console.log("node obj is");
		// console.log(nodeObj);
		database.ref('notification/').push(nodeObj);
		updates={};
		updates['status'] = "Printing";
		database.ref('printTransaction/'+uid+'/'+this.id).update(updates);
		database.ref('userTransaction/'+userId+'/'+this.id).update(updates);
	});

	$('.reqReject').click(function() {
		nodeObj= {};
		nodeObj['token'] = $(this).data("token");
		userId = $(this).data("userid");
		nodeObj['message'] = "Print Rejected";
		database.ref('notification/').push(nodeObj);
		updates={};
		updates['status'] = "Rejected";
		database.ref('userTransaction/'+uid+'/'+this.id).once("value",
			function(snapshot){	
				database.ref('printCompleted/'+uid+'/'+this.id).set(snapshot.val());
				database.ref('userCompleted/'+userId+'/'+this.id).set(snapshot.val());			
			});
		database.ref('printTransaction/'+uid+'/'+this.id).set("");
		database.ref('userTransaction/'+userId+'/'+this.id).set("");
	
	});

	$('.printReject').click(function() {
		nodeObj= {};
		nodeObj['token'] = $(this).data("token");
		userId = $(this).data("userid");
		nodeObj['message'] = "Print Rejected";
		database.ref('notification/').push(nodeObj);
		updates={};
		updates['status'] = "Rejected";
		database.ref('printTransaction/'+uid+'/'+this.id).set("");
		database.ref('userTransaction/'+userId+'/'+this.id).set("");
		database.ref('printCompleted/'+uid+'/'+this.id).update(updates);
		database.ref('userCompleted/'+userId+'/'+this.id).update(updates);
	});
	$('.printConfirm').click(function() {
		nodeObj= {};
		nodeObj['token'] = $(this).data("token");
		userId = $(this).data("userid");
		nodeObj['message'] = "Print Completed";
		database.ref('notification/').push(nodeObj);
		updates={};
		updates['status'] = "Printed";
		database.ref('printCompleted/'+uid+'/'+this.id).update(updates);
		database.ref('userCompleted/'+userId+'/'+this.id).update(updates);
	});
}

function logout(){
	firebase.auth().signOut().then(function() {
	 // console.log("Logout Successful");
	 localStorage.clear();
	 window.location = "/login"
	 }).catch(function(error) {
	  // console.log("Logout Unsuccessful");
	});
}