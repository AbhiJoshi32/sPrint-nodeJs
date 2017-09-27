$(document).ready(function(){
	loadNavbar();
	$('.body').css('visibility','visible');
});

function loadNavbar(){
	$.ajax({
  		url: "html-snippets/navbar-snippet.html"
	}).done(function(data) {
    	addNavbar(data);
  	});
}
