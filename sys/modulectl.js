//#! 本文件由share.js自动产生, 产生命令行为: node sharecli.js gen module
/**
 * sysmoduleHTTP入口模块, 需要在主文件中添加map
 * var sysmodule = require('./routes/sysmodule').bindurl(app);
 */
 'use strict';
 var moduledb = require('./moduledb.js')
    // base function
    , share = require('../sharepage.js')
    , express = require('express')
    , path = require('path')
    , sf = require('../config.js')
    , inspect = require('util').inspect
    , ObjectID = require('mongodb').ObjectID;

// 模块相关的全局属性
const module_name = 'module', module_desc = '模块管理';

//LIST用到的参数
var PAGE = {
    // 列表页条件,包括页的开始记录数skip，和页面长度limit 
    page : {name:'page', key:'page', optional: true, default: { skip: 0, limit: 50 }},
    // 查询条件
    cond : {name: 'cond', key: 'cond', optional: true, default: {} },
    // 排序条件
    sort : {name: 'sort', key: 'sort', optional: true, default: { _id :1 } },
    // 类型
    type : {name: 'type', key: 'type', optional: false},
}
//导入文件用到的参数
var IMP = {
    file : {name: 'file', key: 'file', optional: false},
}
//CRUD参数
var CRUD = {
    data : {name: 'data', key: 'data', optional: false},
    _id : {name:'_id', key:'_id', optional: false},
}


// 注册URL
exports.bindurl=function(app){
    app.use(express.static(path.join(__dirname, 'public')));
    share.bindurl(app, '/sys/module.html', { outType : 'page'}, exports.page);
    share.bindurl(app, '/sys/module/create', exports.create);
    share.bindurl(app, '/sys/module/update', exports.update);
    share.bindurl(app, '/sys/module/list', exports.list);
    share.bindurl(app, '/sys/module/listnavi', exports.listnavi);
    share.bindurl(app, '/sys/module/get', exports.get);
    share.bindurl(app, '/sys/module/delete', exports.delete);
    share.bindurl(app, '/sys/module/count', exports.count);
}

// GUI页面
exports.page = function(req, res){
    res.render('modulepage.html', {
        conf : require('../config.js'),
        user : req.session.user,
        commons : require('../routes/commons.js'),
        opt : {
            title : module_desc
        }
    });
};

// 更新对象
exports.create = function(req, res){
    var arg = share.getParam(`创建新${module_desc}对象:`, req, res, [CRUD.data]);
    if(!arg.passed)
       return;

    moduledb.create(arg.data, function(err, newDoc){
        if(err) return share.rt(false, `创建新${module_desc}对象出错:` + err.message, res);

        share.rt(true, { _id: newDoc._id }, res);
    });
}

// 更新对象
exports.update = function(req, res){
    var arg = share.getParam(`更新${module_desc}对象`, req, res, [CRUD._id, CRUD.data]);
    if(!arg.passed) return;

    console.log(arg._id);

    var data = arg.data;
    delete data._id;
    moduledb.update( arg._id , data , function(err, cnt){
        if(err) {
            console.log(err);
            return share.rt(false, `更新${module_desc}出错:` + err.message, res);
        }
        
        share.rt(true, { cnt : cnt }, res);
    });
}

// 查询对象，并返回列表
exports.list = function(req, res){
    var arg = share.getParam(`查询${module_desc}列表`, req, res, [PAGE.page, PAGE.cond, PAGE.sort]);
    if(!arg.passed)
        return;

    var page = {
        skip : parseInt(arg.page.skip),
        limit : parseInt(arg.page.limit),
    };

    share.searchCondExp(arg.cond);
    share.fillUserDataRule(arg.cond, req, _datafiler);
    moduledb.list(arg.cond, arg.sort, page, function(err, docs){
        if(err) return share.rt(false, err.message, res);
        
        share.rt(true, {docs: docs}, res);
    });
};

function _datafiler(cond, user){

}    

// 查询结果集的返回数量
exports.count = function(req, res){
    var arg = share.getParam(`统计${module_desc}数量`, req, res, [PAGE.cond]);
    if(!arg.passed)
        return;

    share.searchCondExp(arg.cond);
    share.fillUserDataRule(arg.cond, req, _datafiler);
    moduledb.count(arg.cond, function(err, count){
        if(err) return share.rt(false, err.message, res);
        
        share.rt(true, {count: count}, res);
    });
}

// 查询对象，并返回列表
exports.listnavi = function(req, res){
    var arg = share.getParam(`查询${module_desc}导航列表`, req, res, [PAGE.page, PAGE.cond, PAGE.sort]);
    if(!arg.passed)
        return;

    var page = {
        skip : parseInt(arg.page.skip),
        limit : parseInt(arg.page.limit),
    };

    share.searchCondExp(arg.cond);
    share.fillUserDataRule(arg.cond, req);
    // moduledb.list(arg.cond, arg.sort, page, function(err, docs){
    //     if(err) return share.rt(false, err.message, res);
    //    
    //     share.rt(true, {docs: docs}, res);
    // });
    share.rt(true, {docs: moduledb.getModuleTree()}, res);
};

// 查询对象详细信息
exports.get = function(req, res){
    var arg = share.getParam(`读取${module_desc}对象数据`, req, res, [CRUD._id]);
    if(!arg.passed) return;

    moduledb.findById(arg._id, function(err, doc){
        if(err) return share.rt(false, "查询出错:" + err.message, res);
        if(!doc) return share.rt(false, "找不到对象：" + _id);

        share.rt(true, { doc : doc }, res);
    });
}

// 删除对象
exports.delete = function(req, res){
    var arg = share.getParam(`删除${module_desc}对象数据`, req, res, [CRUD._id]);
    if(!arg.passed) return;

    moduledb.delete(arg._id , function(err, doc){
        if(err) return share.rt(false, "删除出错:" + err.message, res);
        
        share.rt(true, { doc : doc }, res);
    });
}


// === 新加的函数请加在这一行下面，方便模板文件修改后自动合并 ===

