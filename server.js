const express = require('express');
const app = express();

app.use(express.static('public'));
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded()); // to support URL-encoded bodies
app.set('view engine', 'ejs');

// This is very insecure and I wouldn't do this for a non-school related project
var admin = require("firebase-admin");
//var firebase = require("firebase");
var nodemailer = require("nodemailer");

var serviceAccount = require("./rexburg-order-up-firebase-adminsdk-rgix7-703d627a3b.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  "authDomain": "rexburg-order-up.firebaseapp.com",
  "databaseURL": "https://rexburg-order-up.firebaseio.com",
  "storageBucket": "rexburg-order-up.appspot.com"
});

var ref = admin.app().database().ref();


// firebase.initializeApp({
//  "appName": "rexburg-order-up",
//  "serviceAccount": "./service-account.json",
//  "authDomain": "rexburg-order-up.firebaseapp.com",
//  "databaseURL": "rexburg-order-up",
//  "storageBucket": "rexburg-order-up.appspot.com"
// });

// Throwaway email account
var mailTransport = nodemailer.createTransport('smtps://rexburgorderingup%40gmail.com:foodles2@smtp.gmail.com');

app.get('/getRestaurants', function(req, res) { 
    ref.child('Restaurants').once('value').then(function (snapshot, err) {
        console.log(snapshot);
        res.setHeader('Content-Type', 'application/json');
        res.send(snapshot);
    });
});

app.get('/getFoodItems', function(req, res){ 
    ref.child('FoodItems').orderByChild('restaurant_id').equalTo(req.query.restaurant).once('value').then(function (snapshot, err) {
        console.log(snapshot);
        res.setHeader('Content-Type', 'application/json');
        res.send(snapshot);
    });
});


// In order to use this, you need to s
app.post('/makeOrder', function(req, res){ 
    
    var orderObj = {
                    "created": Date(),
                    "restaurant_id": req.body.restaurant, 
                    "menuItemsOrdered": req.body.foodItem };
    if (req.body.email != null) {
        ref.child('Restaurants').child(req.body.restaurant).once('value').then(function (snapshot, err) {
            var result = snapshot.val();
            var mailOptions = {
                from: '"Rexburg Ordering" <noreply@firebase.com>',
                to: req.body.email,
                subject: 'Your order to ' + result.name + ' has been placed!',
                text: 'Dear ' + req.body.person + ',\n\nThank you for your purchase!\n\nYour order will be ready soon!\n\nRegards,\nRexburg Ordering'
            };
            mailTransport.sendMail(mailOptions).then(function() {
                console.log('Email notification sent');
            });
        });
    }
    console.log(orderObj);
    ref.child('Orders').push(orderObj);
    res.setHeader('Content-Type', 'application/json');
    res.send({test:"order placed"});
});

app.get('/getOrders', function(req, res){ 
    ref.child('Orders').orderByChild('restaurant_id').equalTo(req.query.restaurant).once('value').then(function (snapshot, err) {
        console.log(snapshot);
        res.setHeader('Content-Type', 'application/json');
        res.send(snapshot);
    });
});


// Optional:
app.get('/checkOrders', function(req, res){ 
    console.log(req.query.restaurant);
    res.setHeader('Content-Type', 'application/json');
    res.send({test:"food"});
});

// Optional:
app.get('/completeOrder', function(req, res){ 
    console.log(req.query.order);
    res.setHeader('Content-Type', 'application/json');
    res.send({test:"food"});
});

// Optional:
app.post('/login', function(req, res){ 
    console.log(req.query.restaurant);
    res.setHeader('Content-Type', 'application/json');
    res.send({test:"food"});
});

app.post('/getrate', function(req, res){ 
    console.log(req.body.weight);
    res.render('getRate.ejs',{rate:calculateRate(req.body.weight, req.body.type)});
});

app.listen(process.env.PORT || 5555, () => console.log('App is listening...'))



