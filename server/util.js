var http = require('http');
var https = require('https');

exports.auth = function(request, response, next){
    request.session.loginUser ? next() : response.redirect('/');
};

exports.makeRequest = function(url, ssl, callback){
    var data = '';
    var net = ssl ? https : http;
    
    net.get(url, function(res){
        res.on('data', function(chunk){
            data += chunk;
        });
        res.on('end', function(chunk){
            callback(data);
        });
    }).on('error', function(err){
        console.error(err);
    });
};