var http = require('http');
var nodeStatic = require('node-static');

var spottify = require('./lib/spottify');

function addRelatedArtists(artist, res) {
  var relatedReq = spottify.getFromApi('artists/' + artist.id + '/related-artists');
  relatedReq.on('end', function(item) {
    addResponseSongs(res, artist, item.artists);
  });

  relatedReq.on('error', function() {
    errorResp(res);
  });
}

function addResponseSongs(res, artist, related) {
  if (!related || related.length ==0) {
    artist.related = null;
    res.end(JSON.stringify(artist));
  }
  artist.related = related;
  var completed = 0;
  artist.related.forEach(function getTopSong(relatedArtist) {
    function onSuccess(tracks) {
      completed++;
      relatedArtist.tracks = tracks;
      if (completed === related.length) {
        res.end(JSON.stringify(artist));
      }
    }
    getTracks(relatedArtist, onSuccess);
  });
}

function getTracks(artist, cb) {
  var req = spottify.getFromApi('artists/' + artist.id + '/top-tracks', {
    country: 'US'
  });
  req.on('end', function(item) {
    cb && cb(item.tracks);
  });

  req.on('error', function() {
    cb && cb(null, {
      message: 'Failed to get tracks'
    });
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
    var searchReq = spottify.getFromApi('search', {
      q: name,
      limit: 1,
      type: 'artist'
    });

    searchReq.on('end', function(item) {
      if (!item.artists || !item.artists.items || !item.artists.items.length) {
        errorResp(res);
        return;
      }
      var artist = item.artists.items[0];
      return addRelatedArtists(artist, res);
    });

    searchReq.on('error', function() {
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
