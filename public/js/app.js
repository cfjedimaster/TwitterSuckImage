$(document).ready(function() {
	
	$statusDiv = $('#statusArea');
	$twitterAccount = $('#twitterAccount');
	$searchButton = $('#searchButton');
	$results = $('#results');
	$searchForm = $('#searchForm');
	
	$.get('/loginstatus', {}, function(res) {
		if(res == 0) {
			console.log('we need to auth');
			$statusDiv.html('<p>To begin, you need to authenticate with Twitter: <a href="/auth/twitter">Sign in via Twitter</a></p>');
		} else {
			console.log('we are online');
			$searchForm.show();
		}
	});

	$searchButton.on('click', function() {
		var account = $.trim($twitterAccount.val());
		//remove @
		if(account.indexOf('@') === 0) account = account.substr(1);
		if(account === '') return;

		$results.html('<i>Searching...</i>').show();
		$searchButton.prop('disabled',true);
		console.log('begin looking for '+account);

		$.get('/search/'+account, function(result) {
			console.log('Back from search with '+result.length+' items');
			
			$searchButton.prop('disabled',false);
			
			if(result.length === 0) {
				$results.html('<i>Sorry, but no results were found.</i>').show();
				return;
			}
			
			s = '';

			result.forEach(function(u) {
				s += '<a class="gallery" href="'+u+'"><img src="' + u + ':thumb" data-highres="'+u+'"></a>';
			});
			
			$results.html(s).show();
			$('.gallery').colorbox();
			
		});
	});
	
});