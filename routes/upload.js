/**
 * Node.JS server sample file for the cool ajax file uploader by Valums (http://valums.com/ajax-upload/).
 *
 * You have to install additional modules with:
 * npm install express
 * npm install node-uuid
 *
 * If you are using NginX as reverse proxy, please set this in your server block:
 * client_max_body_size    200M;
 * 
 * You have to run the server endpoint on port 80,
 * either by an reverse proxy upstream to this script
 * or by run this script directly on port 80,
 * because the ajax upload script can not handle port instruction in the action url correctly. :(
 *
 * @Author: Felix Gertz <dev@felixgertz.de> 2012
 */

var express = require('express')
    , fs = require('fs')
    , util = require('util')
    , uuid = require('node-uuid')
    , url = require('url')
    , getreq = require('../sharepage').getreq
    , getParam = require('../sharepage').getParam
    , rt = require('../sharepage').rt
    , iconv = require('iconv-lite')
    , fse = require('fs-extra') ;

UPLOAD = {
    file : {name: 'file', key:'f', optional: false},
    // 预览文件的编码方式,如果不是utf8编码，读取出文件后需要转化成UTF-8
    encode: {name: 'encode', key:'encode', optional: true, default: 'utf8'},
}

// Settings
var settings = {
    uploadpath: __dirname + '/../uploads/'
};
exports.settings = settings ;

exports.upload = function(req, res) {
    var targetdir = req.params['targetdir'];
    targetdir = targetdir ?  '/' + targetdir + '/' : '';
    var uploadDir = settings.uploadpath + targetdir

    fse.ensureDir(uploadDir, function(err){
        if(err){
            console.log(err);
            // TODO : 创建文件失败可能导致临时文件没有清除
            return res.send({success: false, error: err.message }
                , {'Content-Type': 'text/plain'}, 500);
        }
        
        uploadFile(req, uploadDir, function(data){
            if(data.success)
                res.send(JSON.stringify(data), {'Content-Type': 'text/plain'}, 200);
            else
                res.send(JSON.stringify(data), {'Content-Type': 'text/plain'}, 404);
        });
    });
};

// Mainfunction to recieve and process the file upload data asynchronously
var uploadFile = function(req, targetdir, callback) {
    var uuid = req.param('qquuid');


    // Moves the uploaded file from temp directory to it's destination
    // and calls the callback with the JSON-data that could be returned.
    var moveToDestination = function(sourcefile, targetfile) {
        console.log('上传文件：'+ targetfile);
        var url = targetfile.replace(settings.uploadpath, '');
        moveFile(sourcefile, targetfile, function(err) {
            if(err)
                return callback({success: false, error: err});

            callback({success: true, url : url });    
        });
    };

    // Direct async xhr stream data upload, yeah baby.
    if(req.xhr && !req.files.qqfile) {
        var fname = url.parse(req.url, true).query.qqfile;

        // Be sure you can write to '/tmp/'
        var tmpfile = '/tmp/'+uuid.v1();

        // Open a temporary writestream
        var ws = fs.createWriteStream(tmpfile);
        ws.on('error', function(err) {
            console.log("uploadFile() - req.xhr - could not open writestream.");
            callback({success: false, error: "Sorry, could not open writestream."});
        });
        ws.on('close', function(err) {
            moveToDestination(tmpfile, targetdir + uuid + '_' + fname);
        });

        // Writing filedata into writestream
        req.on('data', function(data) {
            ws.write(data);
        });
        req.on('end', function() {
            ws.end();
        });
    }

    // Old form-based upload
    else {
        moveToDestination(req.files.qqfile.path, targetdir + uuid + '_' + req.files.qqfile.name);
    }
};

// Moves a file asynchronously over partition borders
var moveFile = function(source, dest, callback) {
    var is = fs.createReadStream(source)

    is.on('error', function(err) {
        console.log('moveFile() - Could not open readstream.');
        callback('Sorry, could not open readstream.')
    });
    is.on('end', function() {
        fs.unlinkSync(source);
        callback();
    });
    
    var os = fs.createWriteStream(dest);
    os.on('error', function(err) {
        console.log('moveFile() - Could not open writestream.');
        callback('Sorry, could not open writestream.');
    });
    
    is.pipe(os);
};
