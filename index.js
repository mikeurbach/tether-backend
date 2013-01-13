module.exports.init = function(server, db){
		// get a collection and bootstrap
		var places = db.collection('places');
		places.insert({'loc': [12, 15], 'name': 'mike'}, function(err, obj){
				if(err) throw err;

				console.log('inserted bootstrap');
		});

		// handle a GET
		server.get('/', function(request, response, next){
				// make sure our geospatial index is intact
				places.ensureIndex({'loc': '2d'}, function(err, res){
						// find the nearest place to x,y w/in acc
						places.geoNear(10, 10, {maxDistance: 20, num: 1}, function(err, result){
								if(err) throw err;

								// send it back
								response.send(result);
						});
				});
		});
};