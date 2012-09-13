
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , movies = require('./routes/movies')
  , http = require('http')
  , path = require('path');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(app.router);
  app.use(require('stylus').middleware(__dirname + '/public'));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/users', user.list);
app.get('/cine', movies.list);
app.get('/cine/theaters',movies.theaters);
//app.get('/cine/theaters/name',movies.theaterName);
app.get('/cine/theaters/name/:name',movies.theaterName);
app.get('/cine/theaters/id/:id',movies.theaterId);
app.get('/cine/movies',movies.movies);
app.get('/cine/movies/id/:id',movies.movieId);
app.get('/cine/movies/id/:id/times',movies.movieTimes);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
