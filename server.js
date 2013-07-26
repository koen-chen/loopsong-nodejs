var config = require('./config');
var crypto = require('crypto');
var express = require('express');
var cons = require('consolidate');
var swig = require('swig');
var router = require('./server/router');
var app = express();

swig.init({
    root: __dirname + '/server/views/',
    allowErrors: true,
    autoescape: false,
    cache: true 
});

app.engine('.html', cons.swig);
app.set('view engine', 'html');
app.set('views', __dirname + '/server/views/');
app.set('client_dir', __dirname + '/client');
app.set('server_dir', __dirname + '/server');
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('loopsong'));
app.use(express.session({ secret: 'loopsong' }));
app.use(express.static(__dirname + '/client/'));
app.use(app.router);
app.use(function(request, response){
    response.redirect('/');
});

app.listen(3001);

var db = require('mongoose').createConnection('localhost', config.dbName, config.dbPort, { 
    user: config.adminUsername, 
    pass: config.adminPassword,
    auth: { authSource: 'admin' }
});

db.once('open', function(){
	['User', 'Album'].forEach(function(item){
        var schema = require('./server/models/' + item.toLowerCase());
        db.model(item, schema); 
    });

    var User = db.model('User');
    
    User.count({ username:config.super_username, role: 'super' }, function(err, count){
        if (count == 0) {
            var shaSum = crypto.createHash('sha256');
            shaSum.update(config.superPassword);
            
            User.create({
                username: config.superUsername,
                password: shaSum.digest('hex'),
                role: 'super',
                create_at: Date.now(),
                update_at: Date.now()
            }, function(){});
        }
    });

   	router.init(app, db);
});

