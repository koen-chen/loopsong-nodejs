exports.init = function(app, db){
    ['base', 'user', 'album'].forEach(function(item){
        require('./controllers/'+ item)(app, db);
    });
};