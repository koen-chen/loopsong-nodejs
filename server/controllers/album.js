var http = require('http');
var fs = require('fs');
var path = require('path');
var cheerio = require('cheerio');
var async = require('async');
var util = require('../util');

module.exports = function(app, db){
    var Album = db.model('Album');

    app.get('/album/all', util.auth, function(request, response){
        Album.find({}, function(err, data){
            response.render('album/all', { loginUser: request.session.loginUser, albums: data, notice: request.session.notice });
        });
    });

    app.get('/album/new', util.auth, function(request, response){
        response.render('album/new');
    });

    app.post('/album/new', util.auth, function(request, response){
        async.waterfall([
            function(callback){
                getAlbumInfo(request.body['albumUrl'], callback);
            },
            function(data, callback){
                resolveAlbumInfo(request.body['albumUrl'], data, callback);
            },
            function(album, callback){
                getAlbumCover(app.get('client_dir'), album, callback);
            },
            function(album, callback) {
                getDoubanLink(album, callback);
            },
            function(album, callback){
                getKuwoLink(album, callback);
            },
            function(info, callback){
                saveAlbum(Album, info, request.session.loginUser['_id'], callback);
            },
            function(err, result){
                if (err) {
                    response.render('album/new', { notice: '添加新专辑失败！' });
                }
                else {
                    request.session.album = result;
                    resizeCover(app.get('client_dir'), request.session.album.cover);
                    response.redirect('/album/'+ result._id +'/edit');
                }
            }
        ]);
    });

    app.get('/album/:id', function(request, response){
        Album.findById(request.params.id, function(err, data){
            response.render('album/show', { loginUser: request.session.loginUser, album: data, 'albumTypes': request.session.albumTypes });
        });
    });

    app.get('/album/:id/edit', util.auth, function(request, response){
        Album.findById(request.params.id, function(err, data){
            if (err) {
                response.redirect('/album/all');
            }
            else {
                response.render('album/edit', { album: data });
            }
        });
    });

    app.put('/album/:id/edit', util.auth, function(request, response){
        Album.update({ _id: request.params.id }, {
            type: request.body.type.trim(),
            title: request.body.title.trim(),
            published: request.body.published,
            company: request.body.company.trim(),
            author: request.body.author.trim(),
            detail: request.body.detail,
            links: {
                taobao: request.body.taobaoLink,
                douban: request.body.doubanLink,
                xiami: request.body.xiamiLink,
                kuwo: request.body.kuwoLink
            },
            update_at: Date.now()
        }, function(err){
            if (err) {
                response.render('album/edit', { notice: '修改专辑失败', album: request.body })
            }
            else {
                request.session.notice = '修改专辑成功';
                response.redirect('/album/all');
            }
        })
    });

    app.get('/album/:id/delete', util.auth, function(request, response){
        Album.remove({ _id: request.params.id }, function(err){
            request.session.notice = !err ? '删除专辑成功' : '删除专辑失败';
            response.redirect('/album/all');
        });
    });

    app.post('/album/search', function(request, response){
        Album.find().or([{ title: new RegExp(request.body.keyword,'i') }, { author: new RegExp(request.body.keyword,'i') }]).exec(function(err, albums){
            response.render('base/index', { 'loginUser': request.session.loginUser, 'albums': albums, 'albumTypes': request.session.albumTypes, notice: '搜索结果' });  
        });
    });
};

function getAlbumInfo(albumUrl, callback) {
    util.makeRequest(albumUrl, false, function(data){
        callback && callback(null, data);
    });
}

function resolveAlbumInfo(xiamiLink, data, callback) {
    $ = cheerio.load(data);

    var album = {};
    album.cover = $('#albumCover').attr('href');
    album.title = $('#title h1').html().replace(/<span>.*<\/span>/g, '').replace(/\(.*\).*/g, '');
    album.detail = $('#album_intro .album_intro_brief').text().trim().replace(/^专辑介绍:/, '');
    
    $('#album_info table td.item').each(function(){
        var itemValue = $(this).next().text().trim();
        var itemName = $(this).text().match(/([\u4e00-\u9fa5]+)/g)[0];
        switch (itemName) {
            case '艺人':
                album.author = itemValue;
                break;
            case '唱片公司':
                album.company = itemValue;
                break;
            case '发行时间':
                album.published = itemValue;
                break;
            case '专辑类别':
                album.type = itemValue.split(/[^\u4e00-\u9fa5]/)[0];
                break;
        }
    });

    album.xiamiLink = xiamiLink;
    album.taobaoLink = 'http://s.taobao.com/search?q=' + album.title + ' ' + album.author;
    album.trackList = [];

    $('#track .song_name a').each(function(){
        album.trackList.push($(this).text());
    });

    callback && callback(null, album);
}

function getDoubanLink(album, callback) {
    util.makeRequest('https://api.douban.com/v2/music/search?q=' + album.title + ' ' + album.author, true, function(data){
        var result = JSON.parse(data).musics[0];
        album.doubanLink = result.alt;
        callback && callback(null, album);
    });
}

function getKuwoLink(album, callback) {
    util.makeRequest('http://sou.kuwo.cn/ws/NSearch?key=' + album.title + ' ' + album.author, false, function(data){
        $ = cheerio.load(data);
        album.kuwoLink = $('.albumFrm a.clr').attr('href');
        callback && callback(null, album);
    });
}

function getAlbumCover(dir, album, callback) {
    http.get(album.cover, function(res){
        var coverName = path.basename(album.cover);
        var writeStream = fs.createWriteStream(dir + '/images/cover/xiami_'+ coverName); 
        album.cover = '/cover_default.jpg';

        writeStream.on('finish', function(){
            album.cover = '/cover/xiami_' + coverName;
            callback && callback(null, album);
        });

        res.pipe(writeStream);
    });
}

function saveAlbum(Album, info, creater, callback) {
    var album = new Album({
        type: info.type,
        title: info.title,
        published: info.published,
        company: info.company,
        author: info.author,
        detail: info.detail,
        trackList: info.trackList,
        cover: info.cover,
        links: {
            taobao: info.taobaoLink,
            douban: info.doubanLink,
            xiami: info.xiamiLink,
            kuwo: info.kuwoLink
        },
        likes: Math.ceil(Math.random() * 10),
        creater: creater,
        create_at: Date.now(),
        update_at: Date.now()
    });

    album.save(function (err, album) {
        callback && callback(null, err, album);
    });
}

var gm = require('gm');
function resizeCover(dir, cover){
    gm(dir + '/images' + cover)
    .resize(300, 300)
    .autoOrient()
    .write(dir + '/images' + cover, function(err){
        console.log(err);
    });
}