var express = require('express');

var app = express();

var bodyParser = require('body-parser');

var urlencodedParser = bodyParser.urlencoded({extended:false});

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

app.get('/index', function(request, response) {
	response.sendFile(__dirname + '/public/home.html');
});

app.get('/add', function(request, response) {
	response.sendFile(__dirname + '/public/populate.html');
});

app.get('/',function(request,response){
	response.redirect('/index');
})

app.get('/login', function(request, response) {
	response.sendFile(__dirname + '/public/login.html');
});

app.get('/history', function(request, response) {
  response.sendFile(__dirname + '/public/history.html');
});

app.get('/privacypolicy', function(request, response) {
  response.sendFile(__dirname + '/public/privacypolicy.html');
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

var shopObj = {};
var firebase = require('firebase-admin');
var request = require('request');

var API_KEY = "AAAAc7JphgM:APA91bHS4HHMBOiwu-SMQbHNgqzK8HYpMQhOa7f2c8sXwmk47XgOA8dRlNckXo7bR6ggzLHkp8a861g2niYo3APyg9ykIMJwknejwhHtPvdmBodXVBXvvsdB-zBeDPl5bjsZFmD_3ppH"; 
var serviceAccount = require("./sPrint-3d40e12cc475.json");

// Initialize the app with a service account, granting admin privileges
firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: "https://sprint-1045.firebaseio.com",
    
});
ref = firebase.database().ref();

function listenForNotificationRequests() {
  var requests = ref.child('notification');
  requests.on('child_added', function(requestSnapshot) {
    var request = requestSnapshot.val();
    console.log("Sending notification");
    sendNotificationToUser(
      request.token, 
      request.message,
      function() {
      	console.log("Sent notification");
        requestSnapshot.ref.remove();
      }
    );
  }, function(error) {
    console.error(error);
  });
};

function sendNotificationToUser(token, message, onSuccess) {
  request({
    url: 'https://fcm.googleapis.com/fcm/send',
    method: 'POST',
    headers: {
      'Content-Type' :' application/json',
      'Authorization': 'key='+API_KEY
    },
    body: JSON.stringify({
      notification: {
        title: message
      },
      to : token
    })
  }, function(error, response, body) {
    if (error) { console.error(error); }
    else if (response.statusCode >= 400) { 
      console.error('HTTP Error: '+response.statusCode+' - '+response.statusMessage); 
    }
    else {
      onSuccess();
    }
  });
}

function listenForQueueChanges(shopId) {
  var requests = ref.child('printTransaction/' + shopId);
  requests.on('child_added', function(requestSnapshot) {
    queueLength = shopObj[shopId]["queueLength"] + 1;
    shopObj[shopId]["queueLength"] = queueLength;
    updateQueue(shopId);
  }, function(error) {
    console.error(error);
  });
  requests.on('child_removed', function(requestSnapshot) {
    queueLength = shopObj[shopId]["queueLength"]-1;
    shopObj[shopId]["queueLength"] = queueLength;
    updateQueue(shopId);
  }, function(error) {
    console.error(error);
  });
}

function updateQueue(shopId) {
  var shopRef = ref.child('shop-client/shop-info/' + shopId + "/shopQueue");
  shopRef.set(shopObj[shopId]["queueLength"]);
  
}

function getShopList() {
  var shopRef = ref.child('shop-client/shop-info/');
  shopRef.once('value').then(
    function(requestSnapshot) {
      for (shopId in requestSnapshot.val()) {
        shopObj[shopId] = {"queueLength":0};
        listenForQueueChanges(shopId);
      }
  });
}


function setDayEndTimer() {
  var now = new Date();
  var millisTill10 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0) - now;
  if (millisTill10 < 0) {
     millisTill10 += 86400000; // it's after 10am, try 10am tomorrow.
  }
  setTimeout(function (){
      var shopRef = ref.child('shop-client/shop-info/');
      shopRef.once('value').then(
        function(requestSnapshot) {
          for (shopId in requestSnapshot.val()) {
            var shopRef = ref.child('shop-client/shop-info/' + shopId + "/shopPrinted");
            shopRef.set(0);
          }
      });
    }
  , millisTill10);
}



getShopList();
listenForNotificationRequests();
setDayEndTimer();