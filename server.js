const express = require('express');
const app = express();



app.use(express.static('public'));
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded()); // to support URL-encoded bodies
app.set('view engine', 'ejs');

var server = require('http').Server(app);
var io = require('socket.io')(server);

var admin = require("firebase-admin");

var nodemailer = require("nodemailer");

if (process.env.firebase_admin_key) {
    var serviceAccount =  JSON.parse(process.env.firebase_admin_key);
}
else {
    var serviceAccount = require("./rexburg_order_up.json");
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  "authDomain": "rexburg-order-up.firebaseapp.com",
  "databaseURL": "https://rexburg-order-up.firebaseio.com",
  "storageBucket": "rexburg-order-up.appspot.com"
});

var defaultAuth = admin.auth();

var ref = admin.app().database().ref();
//var nonAuthRef = firebaseApp.database().ref();

/* SOCKET IO */
app.get('/', function (req, res) {
    res.sendfile(__dirname + '/index.html');
});
io.on('connection', function (socket) {
    socket.emit('news', { hello: 'world' });
    socket.on('my other event', function (data) {
        console.log(data);
    });
});


// Throwaway email account
// TO-DO: turn this into proper environment variable

var emailServer;
var mailTransport;
if (process.env.email) {
    mailTransport = nodemailer.createTransport(process.env.email);
}
else {
    fs = require('fs')
    fs.readFile('email_smtps.txt', 'utf8', function (err,data) {
    if (err) {
        console.log("error");
        return console.log(err);
    }
    console.log("read email data:" + data);
    emailServer = data;
    console.log(emailServer);
    mailTransport = nodemailer.createTransport(emailServer);
    });
}




/* WEB ENDPOINTS */
app.get('/getRestaurants', function(req, res) { 
    //socket.emit('news', { hello: 'world' });
    ref.child('Restaurants').once('value').then(function (snapshot, err) {
        res.setHeader('Content-Type', 'application/json');
        res.send(snapshot);
    });
});

app.get('/getFoodItems', function(req, res){ 
    ref.child('FoodItems').orderByChild('restaurant_id').equalTo(req.query.restaurant).once('value').then(function (snapshot, err) {
        res.setHeader('Content-Type', 'application/json');
        res.send(snapshot);
    });
});


app.post('/makeOrder', function(req, res){ 
    
    // Convert Post Parameters into new order
    var menuItemsOrdered = [];
    Object.keys(req.body).forEach(function(key) {
        if (key == "restaurant" || key == "email" || key == "name") {
            return;
        }
        for (let i = 0; i < req.body[key]; i++) {
            menuItemsOrdered.push(key);
        }
    });

    var orderObj = {
                    "created": Date(),
                    "name": req.body.name,
                    "email": req.body.email,
                    "restaurant_id": req.body.restaurant, 
                    "menuItemsOrdered": menuItemsOrdered};

    // Confirm that the menu was created
    // TO DO: calculate the price AND time-to-make
    if (req.body.email != null) {
        ref.child('Restaurants').child(req.body.restaurant).once('value').then(function (snapshot, err) {
            var result = snapshot.val();
            if (req.body.name == null || req.body.name == "") {
                req.body.name = "Anonymous";
            }
            var mailOptions = {
                from: '"Rexburg Ordering" <noreply@firebase.com>',
                to: req.body.email,
                subject: 'Your order to ' + result.name + ' has been placed!',
                text: 'Dear ' + req.body.name + ',\n\nThank you for your purchase!\n\nYour order will be ready soon!\n\nRegards,\nRexburg Ordering'
            };
            mailTransport.sendMail(mailOptions).then(function() {
                console.log('Email notification sent');
            });
        });
    }

    // sending to all clients in 'restaurnt_ids' room
    io.emit(req.body.restaurant, orderObj);
    console.log("I emitted");

    ref.child('Orders').push(orderObj);
    res.setHeader('Content-Type', 'application/json');
    if (req.body.restaurant != orderObj) {
        res.send({test:"Your order has been successfully placed! You will be notified if it was confirmed."});
    }
});

app.post('/getOrders', function(req, res){ 
    console.log("order placed");
    res.setHeader('Content-Type', 'application/json');
    admin.auth().verifyIdToken(req.body.idtoken).then(function(decodedToken) {
        console.log("authentication worked");
        var uid = decodedToken.uid;
        ref.child('Orders').orderByChild('restaurant_id').equalTo(req.body.restaurant).once('value').then(function (snapshot, err) {
            res.send(snapshot);
        });
    }).catch(function(error) {
        console.log("authentication blocked");
        res.status(401).send({ error: "You're not authenticated!" });
    });
});


app.get('/getOrders', function(req, res){ 
    res.setHeader('Content-Type', 'application/json');
    admin.auth().verifyIdToken(req.body.idtoken).then(function(decodedToken) {
        console.log("authentication worked");
        var uid = decodedToken.uid;
        ref.child('Orders').orderByChild('restaurant_id').equalTo(req.query.restaurant).once('value').then(function (snapshot, err) {
            res.send(snapshot);
        });
    }).catch(function(error) {
        console.log("authentication blocked");
        res.status(401).send({ error: "You're not authenticated!" });
    });
});

// Optional:
app.get('/completeOrder', function(req, res){ 
    console.log(req.query.order);
    res.setHeader('Content-Type', 'application/json');
    res.send({test:"food"});
});

// Optional:
app.post('/logUserIn', function(req, res){ 
    console.log(req.body);
    firebase.auth().signInWithEmailAndPassword(req.body.username, req.body.password).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // ...
    });
    res.setHeader('Content-Type', 'application/json');
    res.send({test:"food"});
});


// Web Pages to serve up
app.get('/viewOrders/:id', function(req, res){ 
    ref.child('Restaurants').child(req.params.id).once('value').then(function (snapshot, err) { 
        console.log(snapshot.val().name);
        res.render('viewOrders.ejs',{id:req.params.id, name:snapshot.val().name});
    });
});

app.get('/restaurants', function(req, res){ 
    res.render('restaurants.ejs');
});

app.get('/login', function(req, res){ 
    res.render('login.ejs');
});


// Middleware
// TO DO: It would be super neat to not have to authenticate directly inside my endpoints.
var authenticate = function (req, res, next) {
    
    // Do some authentication or something

    next();
}

server.listen(process.env.PORT || 80, () => console.log('App is listening...'))