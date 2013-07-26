exports.init = function(db){
    ['User', 'Album'].forEach(function(item){
        var schema = require('./models/' + item.toLowerCase());
        db.model(item, schema); 
    });
};