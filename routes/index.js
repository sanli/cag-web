
'use strict';
var share = require('../sharepage.js')
    , express = require('express')
    , path = require('path')
    , sf = require('../config.js')
    , commons = require('./commons.js')
    , inspect = require('util').inspect
    , ObjectID = require('mongodb').ObjectID;


// 注册URL
exports.bindurl=function(app){
    share.bindurl(app, '/', { needAuth : false, outType : 'page'}, exports.index);
    share.bindurl(app, '/main.html', { outType : 'page'}, exports.main);
	share.bindurl(app, '/signin.html', { needAuth : false, outType : 'page'}, exports.signin);

    // 当前web2的首页上只放
    share.bindurl(app, '/index.html', { needAuth : false, outType : 'page'}, exports.index);
    share.bindurl(app, '/media/:uuid', { needAuth : false, outType : 'page'}, exports.media);
}


var PAGE = {
    // 图片浏览的UUID
    uuid : {name: 'uuid', key: 'uuid', optional: true, default: 's1'},
}


/*
 * GET home page.
 */
exports.index = function(req, res){
    // 临时先重定向到例子页面，将来会自动定向到首页
	res.render('front/indexpage.html', {
        conf : require('../config.js'),
        user: req.session.user,
        commons : commons,
        opt : {
            title : sf.title
        }
    });
};


/*
 * GET home page.
 */
exports.media = function(req, res){
    res.render('front/mediapage.html', {
        conf : require('../config.js'),
        user: req.session.user,
        commons : commons,
        uuid : req.param('uuid'),
        opt : {
            title : sf.title,
        }
    });
};

/*
 * GET home page.
 */
exports.main = function(req, res){
    res.render('mainpage.html', {
        conf : require('../config.js'),
        user: req.session.user,
        commons : commons,
        opt : {
            title : sf.title,
        }
    });
};


/*
 * GET home page.
 */
exports.signin = function(req, res){
	res.render('signin.html', {
		conf : require('../config.js'),
	    user: req.session.user,
	    commons : commons,
	    opt : {
            title : "sharepage-project"
        }
	});
};

