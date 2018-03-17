// Week08 materials. This can be ignored but wanted to store it somewhere.

var http = require("http");
var url = require('url');



function onRequest(req, res) {
    // https://stackoverflow.com/questions/18931452/node-js-get-path-from-the-request
    var queryData = url.parse(req.url, true).query;
    var pathname = url.parse(req.url, true).pathname;
    console.log("got request from " + pathname);
    if (pathname == '/home' || pathname == '/') {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write('<h1>Welcome to the Home Page</h1><h2>type /calc to play with the calculation function</h2>');
    } 
    else if (pathname == '/getData') {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.write('{"name":"Br. Burton","class":"cs313"}');
    }
    else if (pathname == '/calc') {
        console.log(queryData);
        if(!queryData.valOne || !queryData.valTwo || !queryData.type) {
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write('<h1>Arguments Incorrect: GET parameters are "valOne" "valTwo" and "type"</h1>');
        }
        else {
            if (queryData.type == 'html') {
                res.writeHead(200, {'Content-Type': 'text/html'});
                var sum = parseInt(queryData.valOne) + parseInt(queryData.valTwo);
                res.write('<h1>' + sum + '</h1>');
            }
            else if (queryData.type == 'json') {
                res.writeHead(200, {'Content-Type': 'application/json'});
                var sum = parseInt(queryData.valOne) + parseInt(queryData.valTwo);
                res.write('{"sum":' + sum + '}');
            }
            else {
                res.write('<h1>type argument not specified: "type" must be set to either "json" or "html"</h1>');
            }
        }    
    }
    else {
        res.writeHead(404, {'Content-Type': 'text/html'});
        res.write('<h1>Page Not Found</h1>');
    }
    res.end();
}

http.createServer(onRequest).listen(8888);
console.log("Server Running");