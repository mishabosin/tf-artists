var http = require('http');
var https = require('https');
var events = require('events');
var querystring = require('querystring');
var nodeStatic = require('node-static');

var getFromApi = function(endpoint, args) {
  var emitter = new events.EventEmitter();
  var options = {
    host: 'api.spotify.com',
    path: '/v1/' + endpoint + '?' + querystring.stringify(args)
  };
  var item = '';
  var searchReq = https.get(options, function(response) {
    response.on('data', function(chunk) {
      item += chunk;
    });
    response.on('end', function() {
      item = JSON.parse(item);
      console.log('API RETURNED: ', item);
      emitter.emit('end', item);
    });
    response.on('error', function() {
      console.log('Api error');
      emitter.emit('error');
    });
  });
  return emitter;
};

function addRelatedArtists(artist, res) {
  var relatedReq = getFromApi('artists/' + artist.id + '/related-artists');
  relatedReq.on('end', function(item) {
    artist.related = item.artists || null;
    console.log('RELATED RESPONSE: ', artist);
    res.end(JSON.stringify(artist));
  });

  relatedReq.on('error', function() {
    console.log('Related search error');
    errorResp(res);
  });
}

function errorResp(res) {
  res.statusCode = 404;
  res.end();
}

var fileServer = new nodeStatic.Server('./public');
var server = http.createServer(function(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method == "GET" && req.url.indexOf('/search/') == 0) {
    var name = req.url.split('/')[2];
    var searchReq = getFromApi('search', {
      q: name,
      limit: 1,
      type: 'artist'
    });

    searchReq.on('end', function(item) {
      console.log('SERVER RESPONSE: ', item);
      if (!item.artists || !item.artists.items || !item.artists.items.length) {
        errorResp(res);
        return;
      }
      var artist = item.artists.items[0];
      return addRelatedArtists(artist, res);
    });

    searchReq.on('error', function() {
      console.log('Server error');
      errorResp(res);
    });
  }
  else {
    fileServer.serve(req, res);
  }
});

var PORT = 8080;
server.listen(PORT);
console.log('Listening on port: ', PORT);
