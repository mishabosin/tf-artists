var https = require('https');
var events = require('events');
var querystring = require('querystring');

var getFromApi = function(endpoint, args) {
  var emitter = new events.EventEmitter();
  var options = {
    host: 'api.spotify.com',
    path: '/v1/' + endpoint + '?' + querystring.stringify(args)
  };
  var item = '';
  console.log('GET: ', options.path);
  var searchReq = https.get(options, function(response) {
    response.on('data', function(chunk) {
      item += chunk;
    });
    response.on('end', function() {
      try {
        item = JSON.parse(item);
      } catch (e) {
        console.error('Api error', e);
        emitter.emit('error');
      }
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

module.exports = {
  getFromApi: getFromApi
};
