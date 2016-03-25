var express = require('express');
var app = express();

app.use(express.static('public'));

var credentials = require('./credentials.json');

var OAuth = require('oauth').OAuth;
var oa2;

app.set('port', process.env.PORT || 3000);

app.use(require('cookie-parser')(credentials.cookieSecret));
app.use(require('express-session')({
	resave:false,
	saveUninitialized:false,
	secret:credentials.cookieSecret
}));

app.get('/loginstatus', function(req, res) {
	console.log('ran loginstatus check');
	res.send(req.session.screen_name?'1':'0');
});

app.get('/auth/twitter', function(req, res){
	
	var callbackurl = 'http://' + req.headers.host + '/auth/twitter/callback';

	oa = new OAuth(
		'https://api.twitter.com/oauth/request_token',
		'https://api.twitter.com/oauth/access_token',
		credentials.twitter_consumer_key,
		credentials.twitter_secret,
		'1.0',
		callbackurl,
		'HMAC-SHA1'
	);
	
	oa.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results){
		if (error) {
			console.log(error);
			res.send('yeah no. didnt work.');
		}
		else {
			req.session.oa = oa;
			req.session.oauth_token = oauth_token;
			req.session.oauth_token_secret = oauth_token_secret;
			res.redirect('https://twitter.com/oauth/authenticate?oauth_token='+oauth_token);
	}
	});
});

app.get('/auth/twitter/callback', function(req, res, next) {

		var oa = new OAuth(req.session.oa._requestUrl,
	                  req.session.oa._accessUrl,
	                  req.session.oa._consumerKey,
	                  req.session.oa._consumerSecret,
	                  req.session.oa._version,
	                  req.session.oa._authorize_callback,
	                  req.session.oa._signatureMethod);
	
		oa.getOAuthAccessToken(req.session.oauth_token,
							   req.session.oauth_token_secret,
							   req.param('oauth_verifier'), 
		function(error, oauth_access_token, oauth_access_token_secret, results){
			if (error){
				console.log(error);
				res.send("yeah something broke.");
			} else {
				console.log('callback results');
				console.dir(results);
				req.session.oauth_access_token = oauth_access_token;
				req.session.oauth_access_token_secret = oauth_access_token_secret;
				req.session.screen_name = results.screen_name;
				res.redirect('/');
			}
		}
		);
});

app.get('/search/:account', function(req, res) {
	console.log('search for images in '+req.params.account);
	var account = req.params.account;
	
	var oa = new OAuth(req.session.oa._requestUrl,
	                  req.session.oa._accessUrl,
	                  req.session.oa._consumerKey,
	                  req.session.oa._consumerSecret,
	                  req.session.oa._version,
	                  req.session.oa._authorize_callback,
	                  req.session.oa._signatureMethod);
	
	//oa.get('https://api.twitter.com/1.1/search/tweets.json?q=from:'+account+'+filter:media', req.session.oauth_access_token, req.session.oauth_access_token_secret,             
	oa.get('https://api.twitter.com/1.1/search/tweets.json?q=from%3A'+account+'+filter%3Amedia&count=100', req.session.oauth_access_token, req.session.oauth_access_token_secret,           
      function (e, retData, ores) {
		if (e) {
			console.log('Search: error result');
			console.dir(JSON.parse(e.data));
			
			var error = JSON.parse(e.data).errors;
			res.send({error:1, message:error[0].message});			
		} else {
			retData = JSON.parse(retData);
			console.log('got '+retData.statuses.length+ ' items');
			var results = [];
					
			retData.statuses.forEach(function(tweet) {
				if(tweet.entities && tweet.entities.media && tweet.entities.media.length > 0) {
					tweet.entities.media.forEach(function(m) {
						results.push(m.media_url);	
					});
				}

			});
			res.send(results);

		}
      });
	
});

app.use(function(err, req, res, next) {
	console.error(err.stack);
	res.status(500).send('Crap');	
});

app.listen(app.get('port'), function() {
	console.log('Express running on http://localhost:' + app.get('port'));
});
