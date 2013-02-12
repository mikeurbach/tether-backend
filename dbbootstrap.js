var mongo = require('mongodb');
var ObjectID = require('mongodb').ObjectID;
var db_uri = process.env.MONGOHQ_URL || 'mongodb://localhost/mythrandir';

// make up a few people to put into the app
var people = [];

var chloe = {
		'_id': new ObjectID('5104a68c5ccc5d67c55d287c'),
		'name': 'Chloe',
		'friends': [
				new ObjectID('50fa2a5e0f77a61e3612052e'),
				new ObjectID('5104a5cb5ccc5d67c55d287b')
		],
		'location': {
				'coords': [],
				'place_id': null,
				'place_name': 'Unknown location'
		}
};

var mike = {
		'_id': new ObjectID('50fa2a5e0f77a61e3612052e'),
		'name': 'Mike',
		'friends': [
				new ObjectID('5104a68c5ccc5d67c55d287c'),
				new ObjectID('5104a5cb5ccc5d67c55d287b')
		],
		'location': {
				'coords': [],
				'place_id': null,
				'place_name': 'Unknown location'
		}
};

var chris = {
		'_id': new ObjectID('5104a5cb5ccc5d67c55d287b'),
		'name': 'Chris',
		'friends': [
				new ObjectID('5104a68c5ccc5d67c55d287c'),
				new ObjectID('50fa2a5e0f77a61e3612052e')
		],
		'location': {
				'coords': [],
				'place_id': null,
				'place_name': 'Unknown location'
		}
};

people.push(chloe);
people.push(mike);
people.push(chris);

mongo.Db.connect(db_uri, function(err, db){
		var peoplecoll = db.collection('people');

		for(var i = 0; i < people.length; i++){
				peoplecoll.insert(people[i]);
				console.log('[DBBOOTSTRAP] inserted ' + people[i].name);
		}
});
