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
      var artist = item.artists.items[0];
      console.log('SERVER RESPONSE: ', artist);
      res.end(JSON.stringify(artist));
    });

    searchReq.on('error', function() {
      res.statusCode = 404;
      console.log('Error');
      res.end();
    });
  }
  else {
    fileServer.serve(req, res);
  }
});

var PORT = 8080;
server.listen(PORT);
console.log('Listening on port: ', PORT);
