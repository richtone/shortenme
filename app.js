"use strict";

var express = require("express");
var shortHash = require('short-hash');
var mongodb = require("mongodb").MongoClient;

var server_port = process.env.PORT || 8080;
var dbURL = process.env.MONGOLAB_URI;
var newReg = /^\/new\/[a-z0-9-]+:\/\/\S+\.\S+/i;

console.log(dbURL);

var insertNewURL = function (db, response, callback) {
    
    db
    .collection("shorts")
    .insert(response, (err, data) => {
        if (err) throw err;
        console.log(response," zapísané do DB");
        callback(data);
    });
    
};

express()
.get("/", (req, res) => {
    
    res.end("ShortenMe app");
    
})
.get(newReg, (req, res) => {
    
    let original_url = req.url.substring(5);
    let hash = shortHash(original_url);
    let short_url = req.protocol
                       + '://'
                       + req.get('host')
                       + req.originalUrl
                       + hash;
    let responseDoc = { "original_url":original_url, "short_url": hash };
    let response = { "original_url":original_url, "short_url": short_url };
    
    mongodb.connect(dbURL, (err, db) => {
        if (err) {
        console.log("Unable to connect to the mongoDB. Error:", err);
      } else {
        console.log("Connection established to mongoDB");
      }
        
        db
        .collection("shorts")
        .count({ "short_url" : {$eq : hash} }, (err, count) => {
            if (err) throw err;
            
            console.log("count = ", count);
            if (count == 0 )  {
                insertNewURL(db, responseDoc, () => {
                    db.close();
                });
            } else {
                console.log(responseDoc," nebola zapísaná do DB");
                db.close();
            }
        });
    });
    
    res.end(JSON.stringify(response));
    
})
.listen(server_port);