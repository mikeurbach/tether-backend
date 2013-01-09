var restify = require('restify');

var server = restify.createServer({
		name: 'mythrandir'
});

server.get('/', function(request, response, next){
		response.send('hello world');
});

server.listen(420, function(){
		console.log('%s listening on %s', server.name, server.port)
});