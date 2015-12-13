require('env2')('.env');
var client = require('./es');

exports.register = function (server, options, next) {

    server.route([
        {
            method: 'GET',
            path: '/search',
            config: {
                description: 'return search results',
                handler: function (request, reply) {


                    console.log('My location', request.query.location);
                    console.log('My name', request.query.name);
                    console.log('My job', request.query.job);

                    client.search({

                        index: process.env.ES_INDEX,
                        type: process.env.ES_TYPE,
                        body: {
                            query: {
                                bool: {
                                    should: [

                                        {match: {location: request.query.location}},
                                        {match: {name: request.query.name}},
                                        {match: {job: request.query.job}}
                                    ]
                                }
                            }
                        }

                    }, function (error, response) {

                        if (error) {
                            next(error);
                        }

                        var results = [];
                        response.hits.hits.forEach(function (e) {
                            var users = e._source;
                            //console.log(e._source);
                            //users.name = e._source.name;
                            //console.log('name', users.name);
                            console.log('Userss',users);
                            results.push(users);

                        });
                            console.log('Resutls', results);
                        return reply.view('home', {results: results});

                    });

                }
            }
        }
    ]);

    return next();
};

exports.register.attributes = {
    name: 'Search'
};