var express = require('express');
var session = require('cookie-session');
var bodyParser = require('body-parser');
var app = express();
var http = require('http');
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://<dbuser>:<dbpassword>@ds149672.mlab.com:49672/chrison9';
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;

app = express();
app.set('view engine','ejs');

var SECRETKEY1 = 'I want to pass COMPS381F';
var SECRETKEY2 = 'Keep this to yourself';

var users = new Array(
	{name: 'demo', password: ''},
	{name: 'guest', password: 'guest'}
);

app.set('view engine','ejs');

app.use(session({
  name: 'session',
  keys: [SECRETKEY1,SECRETKEY2]
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/',function(req,res) {
	console.log(req.session);
	if (!req.session.authenticated) {
		res.redirect('/login');
	} else {
		res.status(200);
		res.render('restaurant',{name:req.session.username});
	}
});

app.get('/login',function(req,res) {
	res.sendFile(__dirname + '/public/login.html');
});

app.post('/login',function(req,res) {
	for (var i=0; i<users.length; i++) {
		if (users[i].name == req.body.name &&
		    users[i].password == req.body.password) {
			req.session.authenticated = true;
			req.session.username = users[i].name;
		}
	}
	res.redirect('/');
});

app.get('/logout',function(req,res) {
	req.session = null;
	res.redirect('/');
});
app.listen(process.env.PORT || 8099);
var restaurant = function(db, callback) {
   db.collection('books').insertOne( {
	"_id" : "Introduction to Node.js",
	"name" : "John Dole",   
   }, function(err, result) {
    assert.equal(err, null);
    console.log("Inserted a document into the books collection.");
    callback(result);
  });
};  

MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  restaurant(db, function() {
      db.close();
  });
});
