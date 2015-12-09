var Hapi = require('hapi');
var Inert = require('inert');
var Home = require('./home');


exports.init = function (port, next) {

    var server = new Hapi.Server();

    server.connection({port: port});

    var plugins = [Inert, Home];
    server.register(plugins, function (err) {
        if (err) {
            return next(err);
        }

        server.start(function(err) {
            return next(err, server);
        });
    });
};