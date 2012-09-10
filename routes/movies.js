var http = require('http');
var cheerio = require('cheerio');
var util = require("util");
var done = false;
exports = module.exports;

var movies = null;
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
	function GetTheaters(msg) {
		var $ = cheerio.load(msg);		
		var select = "<select id='theaterSelection'></select>";
			$('#theaters').append(select);
		var theaters = [];
		$('#menuDosCoulm .menuCentralInt td').each(function(){
				var click = $(this).attr('onClick');					
				if(click){		
					click  = click.slice(click.indexOf('=')+2,click.lastIndexOf("'"));				
					theaters[theaters.length] = 
					{ 
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
		GetMovies(theaters);				
	}
	function GetMovies(theaters)
	{					
		for(theatersIndex = theaters.length - 1; theatersIndex >= 0; theatersIndex--){
			var theater = theaters[theatersIndex];		
			GetMoviesByTheater(theater, theaters.length);
		}
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
				var result = ParseResult(theaterName,dataToSend);			
				ReturnArray.push(result);
				done = true;
				if(endCount === theaterCount){				
					movies = ReturnArray;
					callback(movies);
					//console.log(util.inspect(ReturnArray,false,null));				
				}		
			}).on('error', function(e) {
				console.log("Got error: " + e.message);});				
			});
	}

	function ParseResult(theaterName,s){	
		var theater = theaterName;	
		var $ = cheerio.load(s);
		var movieList = [];
		var x = $('.NowShowingText');		
		var allmovies = x.find('a');
		allmovies.each(function(index, element){		
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
			movieList.push({
				id:index,
				times:times,
				description:$(element).attr('href').trim(),
				title:$(element).text(),
			});				
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

