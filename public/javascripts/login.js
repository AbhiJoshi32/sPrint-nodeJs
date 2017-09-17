var loginKey = "userLoginStatus";
database = firebase.database();
var uid;
var loginAttempt = false;

$(document).ready(function(){
	if (localStorage.getItem(loginKey)) {
		window.location = '/index';
	}
	firebase.auth().onAuthStateChanged(
		function(user) {
			console.log("State Changed");
			console.log(loginAttempt);
			if(user) {
				console.log("User email is "+user.email);
				if (user.email == "masteruser@binktec.com") {
					localStorage.setItem(loginKey,true);
					console.log("user is master");
					window.location = '/populate.html';
				}else{
					console.log("Login Attempt");
					loginAttempt = false;
					uid = user.uid;
					shopRef = database.ref('shop-client/shop-info/');
					console.log(firebase.auth().currentUser);
					shopRef.child(uid).once('value',
						function(snapshot){
							if(snapshot.val()!=null){
								localStorage.setItem(loginKey,true);
								console.log("user is shop");
								window.location = '/index';
							}
							else{
								showLoginError("Invalid Username and password");
								logout();
							}
						});
				}
			}
			else{
				localStorage.clear();
			}
			$('.login-btn').button('reset');
	});

	loadNavbar();
	$('.login-btn').click(function(e){
		e.preventDefault();
		if (validate()) {
			$(this).button('loading');
			password = $("#password").val();
			email = $("#email").val();
			console.log(email,password);
			authenticate(email,password);
			// logout();
		}
	});

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
}

function validate() {
	password = $("#password").val();
	email = $("#email").val();
	flag = false;

	if(email == "" || email == null || password == "" || password == null){
		showLoginError("Fill in all the fields");
		flag = false;
	}
	else{
		if(isValidEmailAddress(email)) {
			if (password.length>5){
				flag = true;
			}
			else{
				showLoginError("Password should be more than 6 characters");
				flag = false
			}
		}
		else {
			showLoginError("Enter valid email");
			flag = false;
		}
	}
	if(flag == true){
		hideLoginError();
	}
	return flag;
}

function logout(){
	localStorage.clear();
	localStorage.setItem(loginKey,"false");
	firebase.auth().signOut().then(
		function() {
			console.log("Logout Successful");
		}).catch (
			function(error) {
				console.log("Logout Unsuccessful");
		});
}

function isValidEmailAddress(emailAddress) {
    var pattern = new RegExp(/^[+a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/i);
    return pattern.test(emailAddress);
};

function authenticate(email,password) {
	console.log("trying to auth");
	firebase.auth().signInWithEmailAndPassword(email, password)
		.catch(function(error) {
			localStorage.clear();
			errorCode = error.code;
			errorMessage = error.message;
			showLoginError(errorMessage);
			$('.login-btn').button('reset');
	    });
}

function showLoginError(error){
	$('.login-error').html(error).css("visibility","visible");
}

function hideLoginError(){
	$('.login-error').css("visibility","hidden");
}