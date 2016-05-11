//#!本文件由share.js自动产生, 命令行为: node share.js gen age CRUD ..
'use strict';
/**
 * age数据库访问类
 */
var inspect = require('util').inspect
  , ObjectID = require('mongodb').ObjectID
  , mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , Data = require('../../mongo.js')
  , Helper = require('../../mongo.js').Helper
  , extend = require('node.extend')
  , csv = require('csv') 
  , _ = require('lodash')
  , share = require('../../sharepage.js');

// 模块相关的全局属性
const module_name = 'age', module_desc = '年代';
// === 基本数据结构定义，按照实际需求修改 ===

// TODO: 下面为Demo数据结构，请改成模块实际数据结构
var age = new Schema({
    // ID字段在每个对象中会自动创建，除非需要自己创建_id,否者不要放开
    /* _id : Schema.Types.ObjectId, */
    // ---- 基本信息 ----
    // 年代名称
    name : String,
    // 年代说明
    desc : String,
    // 年代封面配图URL
    cover : String,
    // 年代开始时间
    start : Number,
    // 年代结束时间
    end : Number,
    
    // ------------------ 通用数据 ----------------
    // 最后修改时间
    ctime : Date,
    // 最后修改时间
    utime : Date,
},  { collection: 'age' });

// 创建索引，以及设置唯一键
// TODO: 根据实际结构确定索引结构
age.index({_id : 1})
    .index({name : 1}, { unique : true });
var age = mongoose.model('age', age ),
    _Module = age ;
exports.age  = age;


// 以下字段不用在列表查询的时候返回
// TODO:  需要修改为实际数据结构对应的字段
var defaultProjection = { ctime : 0, utime : 0 };


// === 基本功能实现函数,一般不用修改 ===
// 创建对象
exports.create = function(data, fn){
    var module = new _Module(data);
    module.ctime = new Date();
    module.utime = new Date();

    _Module.create(module, function(err, newModule){
      if(err) return fn(err);
      fn(err, newModule);
    });
};

// 更新对象
exports.update = function(_id, data, fn){
    data.utime = new Date();
    _Module.findByIdAndUpdate(_id, {$set: data}, {new : false}, fn);
};

//删除对象
exports.delete = function(_id, fn) {
    _Module.remove({ _id : { $in : _id } } , fn);
}

// 查询数据，支持排序和分页
exports.list = function(cond, sort, page, fn){
    // 使用Aggregate查询数据
  _Module.find(cond, defaultProjection)
    .sort(sort)
    .skip(page.skip)
    .limit(page.limit)
    .exec(fn);
}

// 普通查询,用于数据导出
exports.query = function(cond, sort, fn){
    _Module.find(cond)
    .sort(sort)
    .exec(fn);
}

//返回某个查询的返回值数量，主要用于分页
exports.count = function(cond, fn){
  _Module.find(cond)
    .count(function(err, count){
      if(err) return fn(err);

      fn(err, count);
    });
}

//按照ID查询对象
exports.findById = function(_id, fn){
  _Module.findById(_id, function(err, doc){
    fn(err, doc ? doc.toObject() : {});
  });
}

// 按照条件查询返回一个第一个找到的对象
exports.findByCond = function(cond, fn){
  _Module.findOne(cond, function(err, doc){
    fn(err, doc ? doc.toObject() : null);
  });  
}


/**
 * 创建模块缓存管理器
 * @ opt.query : 查询条件，缺省为
 * @ opt.sort : 查询排序字段
 * @ opt.moduleKey : 模块的cachekey
 * @ opt.itemKeyName : 列表中各个项目的cachekey，如果没有赋值，则不存储列表中的
 *   各个项目，如果obj[itemkey_name]为空，则不缓存该项目
 */
function create_cachemgr(opt){
    var opt = _.defaults(opt, {
        query : {},
        sort : { _id : 1 },
        moduleKey : null,
        itemKeyName : null,
    });
    if(!opt.module_key)
        throw new Error('没有为cache指定对应的module_key');

    var cache = require('memory-cache');
    var cache_key = 'modules.';

    function _key(key){
        return [cache_key, key].join('.');
    }
    
    var self = {
        // 读取缓存中的数据，如果key为空，表示读取列表数据
        // 如果不为空，表示读取单个数据
        get : function(key){
            cache.get(_key(key));
        },

        // 提交数据到缓存中，如果key为空，表示存入的是列表数据
        // 如果不为空，表示存入单个数据
        put : function(key, data){
            cache.put(_key(key), data);
        },

        invalidate : function(key){
            cache.del(_key(key));
        },

        load : function(fn){
            _Module.find({}).sort({ start : 1 }).exec(function(err, docs){
                if(err) return fn(err);

                var objs = docs.map( doc => doc.toObject() );
                self.put(null, objs);
                var keyname = opt.itemKeyName;
                if(keyname){
                    objs.forEach(obj => {
                        if(obj[keyname]){
                            self.put( obj[keyname], obj );
                        }
                    });   
                }
                return fn(null, objs);
            });
        },

        refresh : function(){
            if(!opt.itemKeyName){
                self.invalidate();                
            }else{
                var list = self.get();
                var keyname = opt.itemKeyName;
                list.forEach(obj => {
                    if( obj[keyname] ){
                        self.invalidate( obj[keyname] );
                    }
                });
                self.invalidate();
            }
        },
    };
    return self;     
}


// 返回缓存的对象
var cachemgr = create_cachemgr({
    sort : { start : 1 },
    module_key : 'age',
    item_key : 'name',
});
cachemgr.load(function(err, ages){
    if(err) return console.log('载入年代缓存错误')
});

exports.cached_list = function(){
    return cachemgr.get();
}



// =============== 扩展的代码请加在这一行下面，方便以后升级模板的时候合并 ===================




// ============================= 下面是单元测试用的代码 ================================
var isme = require('../../sharepage.js').isme;
var tester = {
  testfn: function(){
    //TODO : 执行测试代码
  },

  test_list_cache : function(){

  },
}

if(isme(__filename)){
  if(process.argv.length > 2 && isme(__filename)){
    testfn = process.argv[2];
    console.log("run test:%s", testfn);

    if(tester[testfn]){
      tester[testfn]();
    }
  }else{
    var testcmd = [];
    for(cmd in tester)
      testcmd.push(cmd);

    console.log('agedb.js '+ testcmd.join('|'));
  }
}

