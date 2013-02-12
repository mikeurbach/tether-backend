var restify = require('restify');
var ObjectID = require('mongodb').ObjectID;

// query the database for a place, given coordinates
function placeFromCoords(db){
		return function(req, res, next){
				debugger;

				// collect request data
				req.lon = parseFloat(req.query.lon);
				req.lat = parseFloat(req.query.lat);
				req.acc = parseFloat(req.query.acc);
				
				// get our places collection
				var places = db.collection('places');
				
				// ensure our geospatial index is intact
				places.ensureIndex({loc: '2d', aff: -1}, function(err, idx){
						if(err) throw err;

						// options for the geoNear query
						// note that the distance multiplier returns distance in miles
						// but the lat, lon must be degrees
						// and the acc is meters, still not sure about it
						geoOpts = {
								maxDistance: req.acc / 6371000,
								num: 1,
								spherical: true,
								distanceMultiplier: 3963.1676
						};

						// query for places within acc of [x,y]
						places.geoNear(req.lon, req.lat, geoOpts, function(err, result){
								if(err) throw err;

								// if we got results, save them for the next guy
								// otherwise, set it null
								if(result.results[0]){
										req.place = result.results[0].obj;
								} else {
										req.place = null;
								}

								next();
						});
				});
		};
}

// if we have this place in the db, we can make our updates
// otherwise, we have to figure out what the place is
function verifyPlace(db){
		return function(req, res, next){
				debugger;

				// check if we know this place
				if(req.place){
						next();
				} else {
						// if we don't, we've got to ask google
						var client = restify.createJsonClient({
								url: 'https://maps.googleapis.com'
						});

						// our bomb ass Google Places API query
						resource = '/maps/api/place/nearbysearch/json?' + 
								'key=AIzaSyBzCRl-gyiBNYez46RbaaJGQy-Q_tBKayY&' +
								'location=' + req.lat + ',' + req.lon + '&' +
								'rankby=distance&' +
								'types=establishment&' + // sufficient?
								'sensor=true';

						// query the Google Places API
						client.get(resource, function(err, greq, gres, obj){
								if(err) throw err;
								
								// check that Google knows where they are (50km radius, so probs)
								if(obj.results[0]){
										cand = obj.results[0];

										// find distance with Haversine formula
										// courtesy of http://www.movable-type.co.uk/scripts/latlong.html
										var R = 6371000; // meters
										var dLat = (cand.geometry.location.lat-req.lat) * (Math.PI / 180);
										var dLon = (cand.geometry.location.lng-req.lon) * (Math.PI / 180);
										var lat1 = req.lat * (Math.PI / 180);
										var lat2 = cand.geometry.location.lat * (Math.PI / 180);

										var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
												Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
										var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
										var d = R * c;
										
										// if the candidate was within our accuracy
										if(d < req.acc){
												// construct our new place
												var place = {};
												place['name'] = cand['name'];
												place['types'] = cand['types'];
												place['address'] = cand['vicinity'];
												place['loc'] = [
														cand.geometry.location.lng,
														cand.geometry.location.lat
												];
												place['attendees'] = [];
												place['wall'] = {};
												req.place = place;

												// pump the new place into the database,
												// then finally move on
												var places = db.collection('places');
												places.insert(place, next);
										} else {
												// we're not confident enough
												req.place = null;
												next();
										}
								} else {
										// Google doesn't even know where they are
										req.place = null;
										next();
								}
						});
				}
		};
}

// processes the place, if any, by loading it into the 
// user's location, and moving the user to the new place,
// calling functions to notify the subscribers
function updatePerson(db){
		return function(req, res, next){
				if(!req.place){
						// uh oh, unknown place
						var update = {
								location: {
										coords: [],
										place_id: null,
										place_name: ''
								}
						};
				} else {
						// update object
						var update = {
								'$set': {
										location: {
												coords: [req.lon, req.lat],
												place_id: new ObjectID(req.place._id.toString()),
												place_name: req.place.name
										}
								}
						};
				}

				// get our people collection
				var people = db.collection('people');

				// update the user's location
				people.findAndModify(
						{'_id': new ObjectID(req.params.uid.toString())}, 
						[], update, function(err, results){
								req.old_place_id = results.location.place_id;
								next();
						});
		};
}

// removes our user from the place they used to be
function updateOldPlace(db){
		return function(req, res, next){
				// get our places collection
				var places = db.collection('places');

				// set up our user's id
				var uid = new ObjectID(req.params.uid.toString());

				// remove the user from their old place
				places.update({'_id': req.old_place_id},
											{'$pull': {'attendees': uid}}, 
											next);
		};
}

// puts our user into their new place
function updateNewPlace(db){
		return function(req, res, next){
				// get our places collection
				var places = db.collection('places');

				// set up our user's id, and the increment object
				var uid = new ObjectID(req.params.uid.toString());
				var inc = {};
				inc['affinities.' + uid] = 1;

				// put the user in the new place
				places.update({'_id': req.place._id},
											{
													'$push': {'attendees': uid},
													'$inc': inc
											}, 
											next);
		};
}

// notifies everyone wathing this user of their location change
function finalize(db){
		return function(req, res, next){
				res.send();
		};
}

// routes a PUT to /people/:uid/location
function putPeopleLocation(server, db){
		var putPeopleLocationChain = [
				placeFromCoords(db),
				verifyPlace(db),
				updatePerson(db),
				updateOldPlace(db),
				updateNewPlace(db),
				finalize(db)
		];

		server.put('/people/:uid/location', putPeopleLocationChain);
}

module.exports = function(server, db){
		putPeopleLocation(server, db);
};