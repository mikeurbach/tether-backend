var restify = require('restify');
var ObjectID = require('mongodb').ObjectID;

// parses the person's info out of the FB data
function parseInfo(db){
		return function(req, res, next){
				console.log(JSON.stringify(req.params));

				// build up our user object
				var person = {
						name: req.params.name,
						location: {
								coords: [],
								place_id: null,
								place_name: 'unknown place'
						},
						friends: [],
						fb_id: req.params.fid
				};

				req.person = person;
				next()
		}
}

// ask FB for all the person's friends
function queryFB(db){
		return function(req, res, next){
				var client = restify.createJsonClient({
						url: 'https://graph.facebook.com'
				});

				// go query for the friends
				var resource = '/' + req.params.fid + '/friends?access_token=' + req.params.token;
				client.get(resource, function(err, freq, fres, obj){
						if(err) throw err;
						
						console.log('fb response received');
						
						// go through the friends and add their fb_id's to an array
						req.friends = [];
						if(obj.data[0]){
								for(var i = 0; i < obj.data.length; i++){
										req.friends.push(obj.data[i].id);
								}
						}

						next();
				});
		}
}

// find the person's FB friends by fb_id
function findFriends(db){
		return function(req, res, next){
				// get our people collection
				var people = db.collection('people');
				var stream = people.find({'fb_id': {'$in': req.friends}}).stream();

				// add the friend connections
				stream.on('data', function(doc){
						req.person.friends.push(new ObjectID(doc._id.toString()));
				});

				// move on
				stream.on('end', function(){
						next();
				});

				// handle the unknown
				stream.on('error', function(err){
						console.log(err);
				});
		}
}

// creates a new user in the database
function createPerson(db){
		return function(req, res, next){
				// get our people collection
				var people = db.collection('people');
				people.insert(req.person, next);
		}
}

// finish by sending back the person's _id
function finalize(db){
		return function(req, res, next){
				res.send({'id': req.person._id.toString()});
		}
}

// Routes a POST to /people
function postPeople(server, db){
		var postPeopleChain = [
				parseInfo(db),
				queryFB(db),
				findFriends(db),
				createPerson(db),
				finalize(db)
		];

		server.post('/people', postPeopleChain);
}

module.exports = function(server, db){
		postPeople(server, db);
};