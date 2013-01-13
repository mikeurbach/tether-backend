var post = require('./post');
var get  = require('./get');
var put  = require('./put');
var del  = require('./delete');

module.exports.init = function(server, db){
		post(server, db);
		get(server, db);
		put(server, db);
		del(server, db);
};