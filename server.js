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

var SECRETKEY1 = 'COMPS381F mini project';
var SECRETKEY2 = 'Restaurant';

var users = new Array(
	{name: 'demo', password: ''},
	{name: 'guest', password: 'guest'}
);
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
			{gps1:req.body.search}, 
			{gps2:req.body.search}, 
			{owner:req.body.search}]}).toArray(function(err,items){
				res.render('restaurant',{name:req.session.username, r:items});
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
var express = require('express');
var fileUpload = require('express-fileupload');

app.use(fileUpload());   




function create(db,bfile,rb,rs,callback) {
  console.log(bfile);
  db.collection('restaurant').insertOne({
	"name":rb.name,
	"borough": rb.borough,
	"cuisine": rb.cuisine,
	"street":rb.street,
	"building":rb.building,
	"zipcode":rb.zipcode,
	"longtitude":rb.gps1,
	"latitude":rb.gps2,
	"photo" : new Buffer(bfile.data).toString('base64'),
	"photo mimetype" : bfile.mimetype,
	"owner":rs.username
	
	  
	  
  }, function(err,result) {
    if (err) {
      console.log('insertOne Error: ' + JSON.stringify(err));
      result = err;
    } else {
      console.log("Inserted _id = " + result.insertId);
    }
    callback(result);
  });
}
app.post('/upload', function(req, res) {
    var sampleFile;
    
     if (!req.files.sampleFile) {
        MongoClient.connect(mongourl,function(err,db) {
      	assert.equal(null,err);
	db.collection('restaurants').insertOne({
		"name":req.body.name,
		"borough": req.body.borough,
		"cuisine": req.body.cuisine,
		"street":req.body.street,
		"building":req.body.building,
		"zipcode":req.body.zipcode,
		"gps1":req.body.gps1,
		"gps2":req.body.gps2,
		"owner":req.session.username
	});
	});
	res.redirect('/')
	return;
    }
	
    MongoClient.connect(mongourl,function(err,db) {
      assert.equal(null,err);
      create(db, req.files.sampleFile,req.body,req.session, function(result) {
        db.close();
        res.redirect('/')
      });
    });
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
			"owner":req.session.username
			  });
		});
res.redirect('/');
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
		var rest = null;
		var rn = null;
		if (req.query.id) {
		for (i in items) {
			if (items[i]._id == req.query.id) {
				item = items[i];
				rn = items[i].name;
				break;
			}
		}
		if (item) {
			db.collection("grade").find({rname: rn}).toArray(function(err,rnames){
					res.render('details', {r: items[i], g: rnames});
			});
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
	res.redirect('/updateok')
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

function update(db,bfile,a,callback) {
  console.log(bfile);
 db.collection('restaurant').update({_id: ObjectId(a.id)}, {
			$set: {
			    "name": a.name,
			    "borough": a.borough,
			    "cuisine": a.cuisine,
			    "street": a.street,
			    "building": a.building,
			    "zipcode": a.zipcode,
			    "longtitude": a.gps1,
			    "latitude": a.gps2,
			    "photo" : new Buffer(bfile.data).toString('base64'),
			    "photo mimetype" : bfile.mimetype
			}	  
	  
  }, function(err,result) {
    callback(result);
  });
	db.collection('grade').update({r_id: a.id}, {
			$set: {
			    "rname": a.name
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

app.listen(process.env.PORT || 8099);
