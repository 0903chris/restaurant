var http = require('http');
var url  = require('url');
var express = require('express');
var session = require('cookie-session');
var bodyParser = require('body-parser');
var app = express();
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var mongourl ="mongodb://df:df9999@ds149672.mlab.com:49672/chrison9";
var formidable = require('formidable');
var fileUpload = require('express-fileupload');

var SECRETKEY1 = 'COMPS381F';
var SECRETKEY2 = 'mini project';

var users = new Array(
	{name: 'demo', password: ''},
	{name: 'student', password: ''}
);

app.set('view engine','ejs');

app.use(session({
  name: 'session',
  keys: [SECRETKEY1,SECRETKEY2]
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(fileUpload());   

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

app.get('/login',function(req,res) {
	res.render('login');
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

app.get('/create',function(req,res) {
		res.status(200);
		res.render('create',{name:req.session.username});
});

app.post('/upload', function(req, res) {
    var sampleFile;	
	
     if (!req.files.sampleFile) {
        MongoClient.connect(mongourl,function(err,db) {
      	assert.equal(null,err);
	db.collection('restaurant').insertOne({
		"name":req.body.name,
		"borough": req.body.borough,
		"cuisine": req.body.cuisine,
		"street":req.body.street,
		"building":req.body.building,
		"zipcode":req.body.zipcode,
		"longtitude":req.body.gps1,
		"latitude":req.body.gps2,
		"owner":req.session.username
	});
	});
	res.redirect('/');
	return;
     }
	
    MongoClient.connect(mongourl,function(err,db) {
      assert.equal(null,err);
      create(db, req.files.sampleFile,req.body,req.session, function(result) {
        db.close();
        res.redirect('/');
	return;
      });
    });
});

function create(db,bfile,rrr,sss,callback) {
  db.collection('restaurant').insertOne({
	"name":rrr.name,
	"borough": rrr.borough,
	"cuisine": rrr.cuisine,
	"street":rrr.street,
	"building":rrr.building,
	"zipcode":rrr.zipcode,
	"longtitude":rrr.gps1,
	"latitude":rrr.gps2,
	"owner":sss.username,
	"photo" : new Buffer(bfile.data).toString('base64'),
	"photomimetype" : bfile.mimetype	  
	  
  }, function(err,result) {
    callback(result);
  });
}

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
				item = items[i];
				break;
			}
		}
		if ((items[i].photo_mimetype == "application/pdf") && (!items[i].gps1) || 
		    (items[i].photo_mimetype == "application/pdf") && (!items[i].gps2)) {
			db.collection("grade").find({r_id: req.query.id}).toArray(function(err,rnames){
				res.render('detailsnophotonomap', {r: items[i], g: rnames});
			});
		} 
		if (!items[i].photo) {
			if ((!items[i].gps1) || (!items[i].gps2)) {
				db.collection("grade").find({r_id: req.query.id}).toArray(function(err,rnames){
					res.render('detailsnophotonomap', {r: items[i], g: rnames});
				});
			} else {
				db.collection("grades").find({r_id: req.query.id}).toArray(function(err,rnames){
					res.render('detailsnophoto', {r: items[i], g: rnames});
				});
			}
		} 
		db.collection("grades").find({r_id: req.query.id}).toArray(function(err,rnames){
			db.close();
			res.render('details', {r: items[i], g: rnames});			
		});
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
	} else {
		MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);
        	db.collection("restaurant").find().toArray(function(err,items){
		var item = null;
		var owner = null;
		if (req.query.id) {
			for (i in items) {
				if (items[i]._id == req.query.id) {
					item = items[i];
					owner = items[i].owner;
					break;
				}
			}	     
			if (item) {
				if(req.session.username == owner) {
					res.render('update', {r: items[i]});
				} else {
					res.render('updateError');
				}
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

app.post('/update', function(req, res) {
    var sampleFile;
    if (!req.files.sampleFile) {
        MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);
			db.collection('restaurant').update({_id: ObjectId(req.body.id)}, {
			$set: {
			    "name": req.body.name,
			    "borough": req.body.borough,
			    "cuisine": req.body.cuisine,
			    "street": req.body.street,
			    "building": req.body.building,
			    "zipcode": req.body.zipcode,
			    "longtitude": req.body.gps1,
			    "latitude": req.body.gps2
			}
			});
			db.collection('grade').update({r_id: req.body.id}, {
			$set: {
			    "rname": req.body.name
			}
			});	
	}); 
	res.redirect('/')
        return;
    }
    	MongoClient.connect(mongourl,function(err,db) {
     	 console.log('Connected to mlab.com');
      	assert.equal(null,err);
     	 update(db, req.files.sampleFile,req.body, function(result) {
       	 db.close();
       	 res.redirect('/');
     	 });
    	});
});

function update(db,bfile,rrr,callback) {
  console.log(bfile);
 db.collection('restaurant').update({_id: ObjectId(rrr.id)}, {
			$set: {
			    "name": rrr.name,
			    "borough": rrr.borough,
			    "cuisine": rrr.cuisine,
			    "street": rrr.street,
			    "building": rrr.building,
			    "zipcode": rrr.zipcode,
			    "longtitude": rrr.gps1,
			    "latitude": rrr.gps2,
			    "photo" : new Buffer(bfile.data).toString('base64'),
			    "photomimetype" : bfile.mimetype
			}	  
	  
  }, function(err,result) {
    callback(result);
  });
	db.collection('grade').update({r_id: rrr.id}, {
			$set: {
			    "rname": rrr.name
			}
			});
}

app.get('/remove',function(req,res) {
	console.log(req.session);
	if (!req.session.authenticated) {
		res.redirect('/login');
	} else {
		MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);
        	db.collection("restaurant").find().toArray(function(err,items){
		var item = null;
		var owner = null;
		if (req.query.id) {
			for (i in items) {
				if (items[i]._id == req.query.id) {
					item = items[i];
					owner = items[i].owner;
					break;
				}
			}	     
			if (item) {
				if(req.session.username == owner) {
					db.collection('restaurant').remove({_id: ObjectId(req.query.id)}, {
		});
					res.render('delete', {r: items[i]});
				} else {
					res.render('deleteError');
				}
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

app.post('/read',function(req,res) {
	console.log(req.session);
	if (!req.session.authenticated) {
		res.redirect('/login');
	} 
	else {
		MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);
        	db.collection("restaurant").find({$or:[
			{name:req.body.search}, 
			{borough:req.body.search}, 
			{cuisine:req.body.search}, 
			{street:req.body.search}, 
		 	{building:req.body.search}, 
			{zipcode:req.body.search}, 
			{longtitude:req.body.search}, 
			{latitude:req.body.search}, 
			{owner:req.body.search}]}).toArray(function(err,items){
				res.render('restaurant',{name:req.session.username, r:items});
			});
        	});									
	}
});

app.get('/rate',function(req,res) {
	console.log(req.session);
	if (!req.session.authenticated) {
		res.redirect('/login');
	} else {
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
				res.render('rating', {r: items[i]});
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

app.post('/rate',function(req,res) {
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);
		db.collection("grade").find().toArray(function(err,items){
			var item = null;
			for (i in items) {
				if (items[i].user == req.session.username) {
					if (items[i].r_id == req.body.id) {
						item = items[i]
						break;
					}
				}
			}
			if (!item) {
				db.collection('grade').insertOne({
					"r_id": req.body.id,
					"rname": req.body.name,
			    		"user": req.session.username,     
			    		"score": req.body.score
				});
					res.redirect('/');
				} else {
					res.render('rateError');
				}
		});
	});
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

app.get('/api/restaurant',function(req,res){ 
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);
 		db.collection("restaurant").find().toArray(function(err,items){
			res.status(200).json(items).end();
		});
	});	
});

app.post('/api/restaurant',function(req,res){ 
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);
 		db.collection("restaurant").insert({
			"name": req.body.name,
                        "borough":req.body.borough, 
			"cuisine":req.body.cuisine, 
			"street":req.body.street, 
		 	"building":req.body.building, 
			"zipcode":req.body.zipcode, 
			"longtitude":req.body.gps1, 
			"latitude":req.body.gps2, 
			"owner": req.body.user
		});
		res.status(200).end('success!');
	});
});

app.get('/api/restaurant/name/:search',function(req,res){ 
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);
 		db.collection("restaurant").find({name: req.params.search}).toArray(function(err,items){
			res.status(200).json(items).end();
		});
	});	
});

app.get('/api/restaurant/borough/:search',function(req,res){ 
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);
 		db.collection("restaurant").find({borough: req.params.search}).toArray(function(err,items){
			res.status(200).json(items).end();
		});
	});	
});

app.get('/api/restaurant/cuisine/:search',function(req,res){ 
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);
 		db.collection("restaurant").find({cuisine: req.params.search}).toArray(function(err,items){
			res.status(200).json(items).end();
		});
	});	
});

app.get('/api/restaurant/street/:search',function(req,res){ 
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);
 		db.collection("restaurant").find({street: req.params.search}).toArray(function(err,items){
			res.status(200).json(items).end();
		});
	});	
});

app.get('/api/restaurant/building/:search',function(req,res){ 
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);
 		db.collection("restaurant").find({building: req.params.search}).toArray(function(err,items){
			res.status(200).json(items).end();
		});
	});	
});

app.get('/api/restaurant/zipcode/:search',function(req,res){ 
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);
 		db.collection("restaurant").find({zipcode: req.params.search}).toArray(function(err,items){
			res.status(200).json(items).end();
		});
	});	
});

app.get('/api/restaurant/gps1/:search',function(req,res){ 
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);
 		db.collection("restaurant").find({gps1: req.params.search}).toArray(function(err,items){
			res.status(200).json(items).end();
		});
	});	
});

app.get('/api/restaurant/gps2/:search',function(req,res){ 
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);
 		db.collection("restaurant").find({gps2: req.params.search}).toArray(function(err,items){
			res.status(200).json(items).end();
		});
	});	
});

app.get('/api/restaurant/owner/:search',function(req,res){ 
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);
 		db.collection("restaurant").find({owner: req.params.search}).toArray(function(err,items){
			res.status(200).json(items).end();
		});
	});	
});

app.listen(process.env.PORT || 8099);
