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

                    client.search({

                        index: 'globalm',
                        type: 'contacts',
                        body: {
                            query: {
                                bool: {
                                    must: [

                                        {match: {location: request.query.location}},
                                        {match: {fullname: request.query.name}}
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