var ObjectID = require('mongodb').ObjectID;

// gets a user's friends' ids
function getFriendIds(db){
		return function(req, res, next){
				// get our people collection
				var people = db.collection('people');
				
				// find all our user's friends
				people.findOne({'_id': new ObjectID(req.params.uid.toString())}, 
											 function(err, person){
													 if(err) throw err;

													 // hand off control
													 req.friends = person.friends;
													 next();
											 });
		};
};

// looks up the friend documents from a list of friend id's
function getFriendDocs(db){
		return function(req, res, next){
				// get our people collection
				var people = db.collection('people');
				var stream = people.find({'_id': {'$in': req.friends}}).stream();
				
				// build up our response
				response = new Array();
				stream.on('data', function(doc){
						var person = {};
						person.location = doc.location;
						person.name = doc.name;
						response.push(person);
				});
				
				// send out the results
				stream.on('end', function(){
						console.log('GET /people/'+req.params.uid+'/friends');
						res.send(response);
				});

				// handle the unknown
				stream.on('error', function(err){
						console.log(err.stack);
				});
		}
};

// routes a GET to /people/:uid/friends
function getPeopleFriends(server, db){
		var getPeopleFriendsChain = [
				getFriendIds(db),
				getFriendDocs(db)
		];

		server.get('/people/:uid/friends', getPeopleFriendsChain);
};

module.exports = function(server, db){
		getPeopleFriends(server, db);
};