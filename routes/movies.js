var http = require('http');
var url = require('url');
var cheerio = require('cheerio');
var util = require("util");
var _ = require('underscore')._;

var done = false;
exports = module.exports;

var movies = null;
var movietheaters = null;
var CurrentMovies = null;

var callbackFunction = null;


var cine = function(callback){

var options = {
	  	host: 'caribbeancinemas.com',
	  	port: 80,
  		path: '/'
	};


http.get(options, function(response) {  
		var dataToSend = "";
		response.on('data', function(chunk) {					
			dataToSend += chunk;
		})
		response.on('end',function(){
			GetTheaters(dataToSend);})
		response.on('error', function(e) {
			console.log("Got error: " + e.message);
		});	
		});	

	var nowPlaying = {};
	function GetTheaters(msg) {
		var $ = cheerio.load(msg);		
		var theaters = [];
		$('#menuDosCoulm .menuCentralInt td').each(function(){
				var click = $(this).attr('onClick');					
				if(click){		
					click  = click.slice(click.indexOf('=')+2,click.lastIndexOf("'"));				
					theaters[theaters.length] = 
					{ 	
						id : url.parse(click,true).query.id_theater,
						title : $(this).text(),
						url : click
					};
				}
		});
		theaters.sort(function(a,b){
			var tA = a.title.toLowerCase(), tB = b.title.toLowerCase();
			if(tA < tB)
				return  1;
			if(tA > tB)
				return -1;
			return 0;
		});	
		movietheaters = theaters;
		GetMovies(theaters);				
	}
	function GetMovies(theaters)
	{				
		_.each(theaters, function(element, index, list){
			GetMoviesByTheater(element,list.length);
		});
	}

	var endCount = 0; //global variable :( what do?
	var ReturnArray = []; //global variable :( what do?

	function GetMoviesByTheater(theater, theaterCount)
	{	
		var theaterName = theater.title;
		var url = theater.url;
		var localOptions = options;
		var localHttp = http;
		localOptions.path = "/" + url;	
		localHttp.get(localOptions, function(res) {  
			var dataToSend = "";
			var _theaterName = theaterName
			res.on('data', function(chunk) {					
				dataToSend += chunk;
			}).on('end',function(){	
				endCount++;	
				var result = ParseResult(theater,dataToSend);			
				ReturnArray.push(result);
				done = true;
				if(endCount === theaterCount){				
					movies = ReturnArray;
					CurrentMovies = _.values(nowPlaying);
					if(_.isFunction(callback)){
						callback(movies);
					}
				}		
			}).on('error', function(e) {
				console.log("Got error: " + e.message);});				
			});
	}

	function ParseResult(theater,s){	
		var _theater = theater.title;	
		var $ = cheerio.load(s);
		var movieList = [];
		var x = $('.NowShowingText');		
		var $allmovies = x.find('a');
		$allmovies.each(function(index, element){		
			var times = [];			
			$(element).parent().parent().parent().parent().next().find('[id$="_diashoras"]')
				.each(function(index,element){
					times = $(element).html().split('<b class="INFOHEADERS">');
					for(var timesIndex = 0; timesIndex < times.length; timesIndex++){							
						var n=times[timesIndex].replace(/&nbsp;/g,'').replace(/<br\/>/g,"").replace(/<\/b>/g,"");
						times[timesIndex] = n;
					}
					for(timesIndex = 0; timesIndex < times.length; timesIndex++){					
						if(times[timesIndex].trim() === '')
						times.splice(timesIndex,1);					
					}				
			});
			var descriptionUrl = $(element).attr('href').trim();
			var hofn_ = url.parse(descriptionUrl,true).query.HOFN;
			var movieId = url.parse(descriptionUrl,true).query.id_movie;
			var movie = {		
				movieId : movieId,
				title:$(element).text(),				
				times:times,
				description:descriptionUrl,							
			};
			movieList.push(movie);
			if(movie.movieId in nowPlaying){
				
			}
			else {
				nowPlaying[movieId] = {
					movieId:movieId,
					title: movie.title,
					description:movie.description,
					HOFN: hofn_
				}
			}				
		});
		return {
			theater: theater,
			movies: movieList
			};
	}

}

exports.list = function(req, res){
	if(done)
	{
		res.json(movies);
	}
	else {
		cine(function(movies){
	 		res.json(movies);
		});
	}
}

exports.theaters = function(req, res){
	if(done)
	{
		res.json(movietheaters);
	}
	else {
		cine(function(movies){
			res.json(movietheaters);
		});
	}
}

exports.theaterName = function(req, res){
	var name = req.params.name;
	if(done)
	{
		var theater = _.find(movies,function(theater){			
				return theater.theater.title == name;
			});
		if(theater){
			res.json(theater);
		}
		else res.send(404);
	}
	else {
		cine(function(movies){
			var theater = _.find(movies,function(theater){			
				return theater.theater.title == name;
			});
			if(theater){
				res.json(theater);
			}
			else res.send(404);
		});
	}
}

exports.theaterId = function(req, res){
	var id = req.params.id;
	if(done)
	{
		var theater = _.find(movies,function(theater){			
				return theater.theater.id == id;
			});
		if(theater){
			res.json(theater);
		}
		else res.send(404);
	}
	else {
		cine(function(theaterObject){
			var theater = _.find(theaterObject,function(theater){			
				return theater.theater.id == id;
			});
			if(theater){
				res.json(theater);
			}
			else res.send(404);
		});
	}
}

exports.movies = function(req, res){
	if(done)
	{
		res.json(CurrentMovies);
	}
	else {
		cine(function(){
			res.json(CurrentMovies);
		});
	}
}

