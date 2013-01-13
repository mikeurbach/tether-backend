var restify = require('restify');

// query the database for a place, given coordinates
function placeFromCoords(db){
		return function(req, res, next){
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
						// and the acc is meters
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
								if(result.results){
										req.place = result.results[0];
								} else {
										req.place = null;
								}

								next();
						});
				});
		};
};

// if we have this place in the db, we can make our updates
// otherwise, we have to figure out what the place is
function verifyPlace(db){
		return function(req, res, next){
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
};

// routes a PUT to /people/:uid/location
var putPeopleLocation = function(server, db){
		var putPeopleLocationChain = [
				placeFromCoords(db),
				verifyPlace(db),
				function(req,res,next){
						console.log(req.place);
						res.send('done');
				}
		];

		server.put('/people/:uid/location', putPeopleLocationChain);
};

module.exports = function(server, db){
		putPeopleLocation(server, db);
};