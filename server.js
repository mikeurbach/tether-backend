var restify = require('restify');
var mongo = require('mongodb');
var router = require('./router');

// server init details
var db_uri = process.env.MONGOHQ_URL || 'mongodb://localhost/mythrandir';
var port = process.env.PORT || 5000;

// create the HTTP server
var server = restify.createServer({name: 'mythrandir'});

// create the MongoDB server and database
mongo.Db.connect(db_uri, function(err, db){
		if(err) throw err;
		
		// built in stuff from restify
		server.use(restify.pre.userAgentConnection());
		server.use(restify.queryParser());

		// set up the routes
		router.init(server, db);

		// fire up the server
		server.listen(port, function(){
				console.log('%s listening on %s', server.name, server.url)
		});
});
