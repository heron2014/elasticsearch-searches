var client = require('./es');

exports.register = function (server, options, next) {

    server.route([
        {
            method: 'GET',
            path: '/search',
            config: {
                description: 'return search results',
                handler: function (request, reply) {


                    console.log(request.query);

                    client.search({

                        index: 'globalm',
                        type: 'contacts',
                        body: {


                            



                        }

                    }, function (err, response) {



                    });


                    return reply.redirect('/');
                }
            }
        }
    ]);

    return next();
};

exports.register.attributes = {
    name: 'Search'
};