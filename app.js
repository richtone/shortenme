"use strict";

var express = require("express");
var mongodb = require("mongodb").MongoClient;

var server_port = process.env.PORT || 8080;
var dbURL = process.env.MONGOLAB_URI;

console.log(dbURL);

mongodb.connect(dbURL, (err, db) => {
    if (err) {
    console.log('Unable to connect to the mongoDB server. Error:', err);
  } else {
    console.log('Connection established to', dbURL);
  }
    
    db.close();
})