var ObjectID = require('mongodb').ObjectID;

// gets a user's friends' ids
function getFriendIds(db){
		return function(req, res, next){
				if(!req.params._id){
						res.send();
				}

				// get our people collection
				var people = db.collection('people');
				
				// find all our user's friends
				people.findOne({'_id': new ObjectID(req.params._id.toString())}, 
											 function(err, person){
													 if(err) throw err;

													 if(person){
															 // hand off control
															 req.friends = person.friends;
															 next();
													 }
											 });
		};
}

// looks up the friend documents from a list of friend id's
function getFriendDocs(db){
		return function(req, res, next){
				// get our people collection
				var people = db.collection('people');
				var stream = people.find({'_id': {'$in': req.friends}}).stream();
				
				// build up our response
				req.response = new Array();
				stream.on('data', function(doc){
						var person = {};
						person.location = doc.location;
						person.name = doc.name;
						req.response.push(person);
				});
				
				// send out the results
				stream.on('end', next);

				// handle the unknown
				stream.on('error', function(err){
						console.log(err);
						next();
				});
		}
}

// send back the friends
function finalize(db){
		return function(req, res, next){
				res.send(req.response);
		}
}

// routes a GET to /people?_id=...
function getPeopleFriends(server, db){
		var getPeopleFriendsChain = [
				getFriendIds(db),
				getFriendDocs(db),
				finalize(db)
		];

		server.get('/people', getPeopleFriendsChain);
}

module.exports = function(server, db){
		getPeopleFriends(server, db);
};