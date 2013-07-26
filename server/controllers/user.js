var crypto = require('crypto');
var util = require('../util');

module.exports = function(app, db){
    var User = db.model('User');

    app.get('/login', function(request, response){
        response.render('user/login');
    });

    app.post('/login', function(request, response){
        User.findOne({ username: request.body['username'], password: request.body['password'] }, function(err, user){
            if (!err && user) {
                request.session.loginUser = user;
                if (request.body['remember']) {
                    response.cookie('uid', user._id, { maxAge: 24*60*60*1000, httpOnly: true });
                }
                response.redirect('/');
            }
            else {
                response.render('user/login', { notice: '邮箱或密码错误！', user: request.body });
            }
        });
    });

    app.get('/logout', function(request, response){
        request.session.loginUser = null;
        response.clearCookie('uid');
        response.redirect('/');
    });

    app.get('/user/all', util.auth, function(request, response){
        User.find({ role: 'general' }, function(err, data){
            response.render('user/all', { loginUser: request.session.loginUser, users: data, notice: request.session.notice });
        });
    });

    app.get('/user/new', util.auth, function(request, response){
        response.render('user/new');
    });

    app.post('/user/new', util.auth, function(request, response){
        var user = new User({
            username: request.body.username,
            password: request.body.password,
            role: 'general',
            create_at: Date.now(),
            update_at: Date.now()
        });

        user.save(function (err) {
            if (err) {
                response.render('user/new', { notice: '添加新用户失败！', user: request.body });
            }
            else {
                request.session.notice = '添加新用户成功！';
                response.redirect('/user/all');
            }
        });
    });
    
    app.get('/user/:id', util.auth, function(request, response){
        if (request.params.id != request.session.loginUser['_id']){
            response.redirect('/user/' + request.session.loginUser['_id']);
        }
        else {
            response.render('user/index', { loginUser: request.session.loginUser });
        }
        
    });

    app.get('/user/:id/edit', util.auth, function(request, response){
        User.findById(request.params.id, function(err, data){
            if (err) {
                response.redirect('/user/all');
            }
            else {
                response.render('user/edit', { user: data });
            }
        });
    });

    app.put('/user/:id/edit', util.auth, function(request, response){
        var user = {
            username: request.body.username,
            password: request.body.password,
            update_at: Date.now()
        };

        User.findByIdAndUpdate(request.params.id, user, function(err){
            if (err) {
                response.render('user/edit', { notice: '修改用户失败', user: request.body })
            }
            else {
                request.session.notice = '修改用户成功';
                response.redirect('/user/all');
            }
        });
    });

    app.get('/user/:id/delete', util.auth, function(request, response){
        User.remove({ _id: request.params.id }, function(err){
            request.session.notice = !err ? '删除用户成功' : '删除用户失败';
            response.redirect('/user/all');
        });
    });
};