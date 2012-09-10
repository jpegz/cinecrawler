runs on localhost and listens on port 3000.
http://localhost:3000/movies returns json response with
[
	{
	theater: theaterName,
	movies : [
			{
				id:Number,
				times: [time1, time2,... ],
				description:descriptionRelativeUrl,
				title:MovieName
			}
			,...
		 ]
	},
	...
]
node app.js

Learning async programming with Node by scraping the Caribbean Cinemas Website.

This tool gets all the movies showing at theaters by Caribbean Cinemas and outputs it to the console.
Features to add:
-Make code better.
-Persist request information to a database or file to be read by another process.
-Update the theater information every thursday.


Dependencies:
	cheerio 0.9.2
	node 0.9.x 
	express 3.x