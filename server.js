var restify = require('restify');

var server = restify.createServer({
		name: 'mythrandir'
});

server.get('/', function(request, response, next){
		response.send('hello world');
});

var port = process.env.PORT || 5000;
server.listen(port, function(){
		console.log('%s listening on %s', server.name, server.url)
});