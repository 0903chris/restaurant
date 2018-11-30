var http = require('http');
var express = require('express');
var session = require('cookie-session');
var url  = require('url');
var bodyParser = require('body-parser');
var app = express();
var MongoClient = require('mongodb').MongoClient;
var mongourl ="mongodb://df:df9999@ds149672.mlab.com:49672/chrison9";
var assert= require('assert');
var ObjectId=require('mongodb').ObjectID;
var formidable = require('formidable');
 
app = express();
app.set('view engine','ejs');

var SECRETKEY1 = 'I want to pass COMPS381F';
var SECRETKEY2 = 'Keep this to yourself';

var users = new Array(
	{name: 'demo', password: ''},
	{name: 'guest', password: 'guest'}
);



var express = require('express');
var fileUpload = require('express-fileupload');

// middlewares
app.use(fileUpload());   // add 'files' object to req

app.post('/upload', function(req, res) {
    var sampleFile;

    if (!req.files) {
        res.send('No files were uploaded.');
        return;
    }

    MongoClient.connect(mongourl,function(err,db) {
      console.log('Connected to mlab.com');
      assert.equal(null,err);
      create(db, req.files.sampleFile, function(result) {
        db.close();
        if (result.insertedId != null) {
          res.status(200);
          res.end('Inserted: ' + result.insertedId)
        } else {
          res.status(500);
          res.end(JSON.stringify(result));
        }
      });
    });
});


function create(db,bfile,callback) {
  console.log(bfile);
  db.collection('restaurant').insertOne({
    "photo" : new Buffer(bfile.data).toString('base64'),
    "photo mimetype" : bfile.mimetype,
  }, function(err,result) {
    //assert.equal(err,null);
    if (err) {
      console.log('insertOne Error: ' + JSON.stringify(err));
      result = err;
    } else {
      console.log("Inserted _id = " + result.insertId);
    }
    callback(result);
  });
}

function read(db,target,callback) {
  var bfile = null;
  var mimetype = null;
  db.collection('restaurant').findOne({"_id": ObjectId(target)}, function(err,doc) {
    assert.equal(err,null);
    if (doc != null) {
      bfile = new Buffer(doc.data,'base64');
      mimetype = doc.mimetype;
    }
    callback(bfile,mimetype);
  });
}



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
		res.redirect('/read');;
	}
});
app.get('/read',function(req,res) {
	console.log(req.session);
	if (!req.session.authenticated) {
		res.redirect('/login');
	} 
	else {
		MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);
        	db.collection("restaurant").find().toArray(function(err,items){
		res.render('restaurant',{name:req.session.username, r:items});
			});
        	});									
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
app.get('/gps', function(req,res) {
	console.log(req.session);
	if (!req.session.authenticated) {
		res.redirect('/login');
	} 
	else {
		MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);
        	db.collection("restaurant").find().toArray(function(err,items){
		var item = null;
		if (req.query.id) {
		for (i in items) {
			if (items[i]._id == req.query.id) {
				item = items[i]
				break;
			}
		}
		if (item) {
			res.render('gps', {r: items[i]});							
		} else {
			res.status(500).end(req.query.id + ' not found!');
		}
	} else {
		res.status(500).end('id missing!');
	}
			});
		});
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
	MongoClient.connect(mongourl, function(err,db){
		assert.equal(err,null);
		db.collection('restaurant').insertOne({
			"name":req.body.name,
			"borough":req.body.borough,
			"cuisine":req.body.cuisine,
			"photo":req.body.photo,
			"photomimetype":req.body.photomimetype,
			"street":req.body.street,
			"building":req.body.building,
			"zipcode":req.body.zipcode,
			"longtitude":req.body.gps1,
			"latitude":req.body.gps2,
			"grade":{
			"user":req.session.username,
			"score":req.body.score
			},
			"owner":req.body.owner
			
			
			
						      });
		});
res.redirect('/');
});
app.get('/showdetails', function(req,res) {
	console.log(req.session);
	if (!req.session.authenticated) {
		res.redirect('/login');
	} 
	else {
		MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);
        	db.collection("restaurant").find().toArray(function(err,items){
		var item = null;
		if (req.query.id) {
		for (i in items) {
			if (items[i]._id == req.query.id) {
				item = items[i]
				break;
			}
		}
		if (item) {
			res.render('details', {r: items[i]});							
		} else {
			res.status(500).end(req.query.id + ' not found!');
		}
	} else {
		res.status(500).end('id missing!');
	}
			});
		});
	}
});
app.get('/edit',function(req,res) {
	console.log(req.session);
	if (!req.session.authenticated) {
		res.redirect('/login');
	} 
	else {
		MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);
        	db.collection("restaurant").find().toArray(function(err,items){
		var item = null;
		if (req.query.id) {
		for (i in items) {
			if (items[i]._id == req.query.id) {
				item = items[i]
				break;
			}
		}
		if (item) {
			res.render('update', {r: items[i]});							
		} else {
			res.status(500).end(req.query.id + ' not found!');
		}
	} else {
		res.status(500).end('id missing!');
	}
			});
		});
	}
});

app.post('/update',function(req,res) {
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);
			db.collection('restaurant').update({"_id": req.body.id}, { $set:  {
			    "name": req.body.name,
			    "borough": req.body.borough,
			    "cuisine": req.body.cuisine,
			    "photo": "no.jpg",
			    "photo mimetype": "KASDKJ",
			    "street": req.body.street,
			    "building": req.body.building,
			    "zipcode": req.body.zipcode,
			    "gps1": req.body.gps1,
			    "gps2": req.body.gps2,
			    "grades": {
				"user": null,
				"score": null
			    },
			    "owner":req.session.username
			}
		});
	
		});
		
	res.redirect('/');
});

app.listen(process.env.PORT || 8099);
