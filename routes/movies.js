var http = require('http');
var url = require('url');
var cheerio = require('cheerio');
var util = require("util");
var _ = require('underscore')._;
var async = require('async');

var done = false;
exports = module.exports;

var movies = null;
var movietheaters = null;
var CurrentMovies = null;

var callbackFunction = null;

//callback parameters are the list of movies in all theaters, the list of theaters and the list of distinct movies
var cine = function(callback){

if(movies && CurrentMovies && movieTheaters){
	callback(movies, movieTheaters, CurrentMovies);
	return;
}

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
		$('.puerto-rico-theater-menu a').each(function(){			
				 var click = $(this).attr('href');									 
					 theaters[theaters.length] = 
					 { 	
						 id : url.parse(click,true).query.id_theater,
						 title : $(this).text(),
						 url : click
					 };						
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
		var parallelFunctions = [];
		_.each(theaters, function(theater, index, list){			
			parallelFunctions.push(function(asyncCallback){
					var _theater = theater;
					var url = _theater.url;
					var localOptions = options;
					localOptions.path = "/" + url;	
				http.get(localOptions,function(res) {  					
					var dataToSend = "";					
					res.on('data', function(chunk) {					
						dataToSend += chunk;
					}).on('end',function(){	
						var result = ParseResult(_theater,dataToSend);			
						asyncCallback(null,result);					
					}).on('error', function(e) {
						console.log("Got error: " + e.message);
					});				
				});
			});			
		});
		async.parallel(parallelFunctions,function(err, result){
			done = true;
			movies = result;
			CurrentMovies = _.values(nowPlaying);
			if(_.isFunction(callback)){
				callback(movies, theaters, CurrentMovies);
			}
		});
	}
	function ParseResult(theater,s){	
		var $ = cheerio.load(s);
		var movieList = [];
		var x = $('.TheaterMovieItems');		
		var $allmovies = x.find('[id^="ContentPlaceHolderDefault_cp_content_theaterandmovies_Repeater1_LinkMovie_"]');
		$allmovies.each(function(index, element){				
			var times = [];			
			$(element).parent().parent().find('.mhoras [id^="ContentPlaceHolderDefault_cp_content_theaterandmovies_Repeater1_diashoras_"]')
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
	initialize(function(AllMoviesAllTheaters, AllTheaters, AllMovies){
		res.json(movies);
	});
}

exports.theaters = function(req, res){
	initialize(function(AllMoviesAllTheaters, AllTheaters, AllMovies){
		res.json(AllTheaters);	
	});
}

exports.theaterName = function(req, res){
	initialize(function(AllMoviesAllTheaters, AllTheaters, AllMovies){	
		var name = req.params.name;	
		var theater = _.find(AllMoviesAllTheaters,function(theater){			
				return theater.theater.title == name;
			});
		if(theater){
			res.json(theater);
		}
		else res.send(404);
	});
}

exports.theaterId = function(req, res){
	initialize(function(AllMoviesAllTheaters, AllTheaters, AllMovies){
		var id = req.params.id;
		var theater = _.find(movies,function(theater){
				return theater.theater.id == id;
			});
		if(theater){
			res.json(theater);
		}
		else res.send(404);
	});
}

exports.movies = function(req, res){
	initialize(function(AllMoviesAllTheaters, AllTheaters, AllMovies){
		res.json(AllMovies);
	});
}

exports.movieId = function(req, res) {
	initialize(function(AllMoviesAllTheaters, AllTheaters, AllMovies){
		var id = req.params.id;	
		var movie = _.find(AllMovies,function(movie){			
			return movie.movieId == id;
		});
		if(movie){
			res.json(movie);
		}
		else res.send(404);		
	});
}

exports.movieTimes = function(req, res) {
	initialize(function(AllMoviesAllTheaters, AllTheaters, AllMovies){
		var id = req.params.id;
		console.log("id = " + id);
		_.each(AllMoviesAllTheaters, function(element, index, list){
			_.each(element.movies, function(movie, movieIndex, movieList){
				AllMoviesAllTheaters[index].movies[movieIndex].theater = element.theater;
			});
		});
		var movies = _.pluck(AllMoviesAllTheaters,"movies");
		var flat = _.flatten(movies);
		var movie = _.filter(flat,function(m){
			return m.movieId == id;
		});		
		if(movie){
			res.json(movie);
		}
		else res.send(404);
	});
}

function initialize(callback){
	if(!done){
		cine(function(AllMoviesAllTheaters, AllTheaters, AllMovies){
			movies = AllMoviesAllTheaters;
			movieTheaters = AllTheaters;
			CurrentMovies = AllMovies;
			done = true;
			//client.set("currentMovies",JSON.stringify(CurrentMovies),redis.print);
			//client.set("movieTheaters",JSON.stringify(movieTheaters),redis.print);
			//client.set("movies",JSON.stringify(movies),redis.print);
			if(_.isFunction(callback)){
				callback(AllMoviesAllTheaters,AllTheaters,AllMovies);
			}
		});	
	}
	else {
		if(_.isFunction(callback)){
			callback(movies,movieTheaters,CurrentMovies);
		}
	}
}

initialize();
