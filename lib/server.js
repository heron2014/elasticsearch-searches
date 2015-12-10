var Hapi = require('hapi');
var Inert = require('inert');
var Home = require('./home');
var Create = require('./create');
var Handlebars = require('handlebars');
var Vision = require('vision');
var Search  = require('./search');


exports.init = function (port, next) {

    var server = new Hapi.Server();

    server.connection({port: port});

    var plugins = [Inert, Vision, Home, Create, Search];

    server.register(plugins, function (err) {
        if (err) {
            return next(err);
        }

        server.views({
            engines: {
                html: Handlebars
            },
            relativeTo: __dirname + '/../views/',
            path: '.',
            layout: 'default',
            layoutPath: 'layout',
            helpersPath: 'helpers',
            partialsPath: 'partials'
        });

        server.start(function(err) {
            return next(err, server);
        });
    });
};