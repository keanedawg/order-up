const express = require('express');
const app = express();

app.use(express.static('public'));
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded()); // to support URL-encoded bodies
app.set('view engine', 'ejs');

// This is very insecure and I wouldn't do this for a non-school related project
var admin = require("firebase-admin");
var nodemailer = require("nodemailer");

var serviceAccount = require("./rexburg-order-up-firebase-adminsdk-rgix7-703d627a3b.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://rexburg-order-up.firebaseio.com"
});

// Throwaway email account
var mailTransport = nodemailer.createTransport('smtps://rexburgorderingup%40gmail.com:foodles2@smtp.gmail.com');
var email = 'cameronfife@hotmail.com';


var mailOptions = {
    from: '"Firebase Database Quickstart" <noreply@firebase.com>',
    to: email,
    subject: 'New star!',
    text: 'Thank you for your purchase!\nYour order will be ready soon!'
  };
//   mailTransport.sendMail(mailOptions).then(function() {
//     console.log('New star email notification sent');
//   });


app.get('/viewOrders', function(req, res){ 
    res.render('index.ejs',{user: "Great User",title:"homepage"});
});

app.get('/getRestaurants', function(req, res){ 
    console.log();
    res.setHeader('Content-Type', 'application/json');
    res.send({test:"food"});
});

app.get('/getFoodItems', function(req, res){ 
    console.log(req.query.restaurant);
    res.setHeader('Content-Type', 'application/json');
    res.send({test:"food"});
});

app.get('/makeOrder', function(req, res){ 
    console.log(req.body.restaurant);
    res.setHeader('Content-Type', 'application/json');
    res.send({test:"giveOrder"});
});

app.get('/getOrders', function(req, res){ 
    console.log();
    console.log(req.query.restaurant);
    res.setHeader('Content-Type', 'application/json');
    res.send({test:"food"});
});

app.post('/getrate', function(req, res){ 
    console.log(req.body.weight);
    res.render('getRate.ejs',{rate:calculateRate(req.body.weight, req.body.type)});
});

// Today I learned that if you are using URL params, you must make sure you're not sharing a name
// with another URL. I originally had the URL set to 'getrate' but this url was failing to be
// recognized. 
app.get('/getrate/:weight/:type', function(req, res){ 
    console.log(req.params);
    res.render('getRate.ejs',{rate:calculateRate(req.params.weight, req.params.type)});
});

app.listen(process.env.PORT || 5555, () => console.log('App is listening...'))


function calculateRate(weight, type) {
    var ic; // initial cost
    var r;  // rate
    var inc = 1; // rate of incrementing cost, assumes 1 by default 
    var max; // maximum possible weight
    if (type == "stamped") {
        ic = 0.50;
        r = .21;
        max = 3.5;
    }
    else if (type == "metered") {
        ic = 0.47;
        r = .21;
        max = 3.5;
    }
    else if (type == "flats") {
        ic = 1.00;
        r = .21;
        max = 13;
    }
    else if (type == "first-class") {
        ic = 3.50;
        r = .25;
        max = 13;
    }
    else {
        return "Incorrect type specified. Please return to the form.";
    }
    if (weight <= 0 || weight > max) {
        return "Weight is incorrect. It must weigh more than 0 and less than or equal to " + max + " ounces for type \"" + type + "\".";
    }
    
    var cost;
    // Have to treat first-class in a special way since it formats differently than the rest
    if (type == "first-class") {
        cost = ic;
        var i;
        for (i = 4; i < 8 && i < weight; i += 4) {
            console.log(cost);
            cost += r;
            console.log(cost)
        }
        r = 0.35;
        for (i; i < weight && i >= 8; i++) {
            cost += r;
        }
        
    }
    else {
        cost = ic;
        for (var i = 1; i < weight; i++) {
            cost += r;
        }
    }

    // always round to and display 2 decimal places.
    return "$" + (Math.round(cost * 100) / 100).toFixed(2);


}
