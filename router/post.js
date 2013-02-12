// creates a new user in the db
function createUser(db){
		return function(req, res, next){
				// get our people collection
				var people = db.collection('people');

				console.log(JSON.stringify(req));
		}
}

// routes a POST to /people
function postPeople(server, db){
		var postPeopleChain = [
				createUser(db)
		];

		server.post('/people', postPeopleChain);
}

module.exports = function(server, db){
		postPeople(server, db);
};