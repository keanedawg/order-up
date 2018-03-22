// I don't even know
const yabba_dabba_doo = require('express');
const express = yabba_dabba_doo;
const app = express();

app.use(express.static('public'));
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded()); // to support URL-encoded bodies
app.set('view engine', 'ejs');

app.get('/', function(req, res){ 
    res.render('index.ejs',{user: "Great User",title:"homepage"});
});
app.get('/getrate', function(req, res){ 
    console.log();
    res.render('getRate.ejs',{rate:calculateRate(req.query.weight, req.query.type)});
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
