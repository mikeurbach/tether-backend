module.exports= function(){
		this.init = function(db){
				this.people = require('people')(db);
				this.places = require('places')(db);
				this.tethers = require('tethers')(db);
		};
};