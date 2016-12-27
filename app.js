"use strict";

var express = require("express");
var shortHash = require('short-hash');
var mongodb = require("mongodb").MongoClient;
var appDB = null;
var shortsCollection = null;

var server_port = process.env.PORT || 8080;
var dbURL = process.env.MONGOLAB_URI;
var newRegEx = /^\/new\/[a-z0-9-]+:\/\/\S+\.\S+/i;
var redirectRegEx = /^\/[a-z0-9]{8}$/; // reťazec o 8 znakoch
var errorJSON = {"error":"Wrong url format, make sure you have a valid protocol and real site."}; 


mongodb.connect(dbURL, (err, db) => {
    
    if (err) {
    console.log("Unable to connect to the mongoDB. Error:", err);
    } else {
    console.log("Connection established to mongoDB");
    }
    appDB = db;
    shortsCollection = db.collection("shorts");
});

function insertNewURL (response, callback) {
    
    shortsCollection
    .insert(response, (err, data) => {
        if (err) throw err;
        console.log(response," zapísané do DB");
        callback(data);
    });
}

function getOrigURL (hash, res, callback) {
    shortsCollection
    .find(
        { "short_url" : hash },
        { "original_url" : 1 }
    )
    .toArray((err, data) => {
        if (err) throw err;
        console.log(data);
        callback(data);
    });
}

express()
.use(express.static(__dirname+"/html"))
.get("/", (req, res) => {
    
    res.sendFile("index.html");
    
})
.get(newRegEx, (req, res) => {
    
    let original_url = req.url.substring(5);
    let hash = shortHash(original_url);
    let short_url = req.protocol
                       + "://"
                       + req.get('host')
                       + "/"
                       + hash;
    let responseDoc = { "original_url":original_url, "short_url": hash };
    let response = { "original_url":original_url, "short_url": short_url };
    
    shortsCollection
    .count({ "short_url" : hash }, (err, count) => {
        
        if (err) throw err;
        
        console.log("count = ", count);
        if (count == 0 )  {
            insertNewURL(responseDoc, () => {
            //appDB.close();
            });
        } else {
            console.log(responseDoc," nebola zapísaná do DB");
        }
    });
    
    res.end(JSON.stringify(response));
    
})
.get(redirectRegEx, (req, res) => {
    
    let hash = req.url.substring(1);
    let redirectURL = null;
    
    shortsCollection
    .count({ "short_url" : hash }, (err, count) => {
        
        if (err) throw err;
        
        console.log("count = ", count);
        if (count == 1 )  {
            redirectURL = getOrigURL(hash, res, data => {
                res.redirect(data[0].original_url);
                //appDB.close();
            });
        } else {
            console.log(hash," nebol nájdený");
            res.end(JSON.stringify(errorJSON));
        }
    });
    
   
})
.listen(server_port);
