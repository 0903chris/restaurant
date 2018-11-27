
var express = require('express');
var session = require('cookie-session');
var bodyParser = require('body-parser');
var app = express();
var MongoClient = require('mongodb').MongoClient;
var url ="mongodb://df:df9999@ds149672.mlab.com:49672/chrison9";
var assert= require('assert');
var ObjectId=require('mongodb').ObjectID;


 
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

app.get('/',function(req,res) {
	console.log(req.session);
	if (!req.session.authenticated) {
		res.redirect('/login');
	} else {
		res.status(200);
		res.render('restaurant',{name:req.session.username});
	}
});

app.get('/create',function(req,res) {
	console.log(req.session);
	if (!req.session.authenticated) {
		res.redirect('/login');
	} else {
		res.status(200);
		res.render('create',{name:req.session.username});
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
app.post('/create',function(req,res) {
	MongoClient.connect(url,function(err,db){
		assert.equal(err,null);
		db.collection('restaurant').insertOne({
			"name":req.body.name,
			"borough":req.body.borough,
			"cuisine":req.body.cuisine,
			"photo":"no.jpg",
			"photo mimetype":"asdah",
			
			"grade":{
			"user":null,
			"score":null
			},
			"owner":req.body.owner
						      });
		};
res.redirect('/');
};

app.listen(process.env.PORT || 8099);
