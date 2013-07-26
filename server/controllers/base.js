var https = require('https');
var querystring = require('querystring');
var async = require('async');

module.exports = function(app ,db){
    var Album = db.model('Album');
    var User = db.model('User');
    
    app.get('/', function(request, response){
        async.parallel([
            function(callback){
                Album.find({}, function(err, albums){
                    callback(null, albums, processTypes(albums));
                });
            },
            function(callback){
                if (request.session.loginUser) {
                    callback(null, request.session.loginUser);   
                }
                else {
                    if (request.cookies.uid) {
                        User.findById(request.cookies.uid, function(err, user){
                            callback(null, user);                
                        });
                    }
                    else {
                        callback(null, null);   
                    }
                }
            }
        ], function(err, results){
            var albums = results[0][0];
            request.session.albumTypes = results[0][1];
            request.session.loginUser = results[1];
            response.render('base/index', { 'loginUser': request.session.loginUser, 'albums': albums, 'albumTypes': request.session.albumTypes });
        });
    });

    app.get('/artist/:author', function(request, response){
        Album.find({ author: request.params.author }, function(err, albums){
            response.render('base/index', { 'loginUser': request.session.loginUser, 'albums': albums, 'albumTypes': request.session.albumTypes, artist: request.params.author });  
        });
    });

    app.get('/style/:type', function(request, response){
        Album.find({ type: request.params.type }, function(err, albums){
            response.render('base/index', { 'loginUser': request.session.loginUser, 'albums': albums, 'albumTypes': request.session.albumTypes, 'albumType': request.params.type });  
        });
    });

    app.get('/oauth/weibo', function(request, response){
    });
};

function processTypes(albums) {
    var albumTypes = {};
    albums.forEach(function(item){
        var type = item.type;
        if (!albumTypes[type]) {
            albumTypes[type] = {};
            albumTypes[type]['name'] = type;
            albumTypes[type]['count'] = 1;
        }
        else {
            albumTypes[type]['count'] += 1;
        }
    });

    return albumTypes;
}