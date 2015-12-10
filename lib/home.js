var client = require('./es');

exports.register = function (server, options, next) {

    server.route({
        method: 'GET',
        path: '/',
        config: {
            description: 'return the home page',
            handler: function (request, reply) {
                console.log('+++++++++++++++++++++++++++++++++');
                client.search({
                    index: 'globalm',
                    size: 50,
                    type: 'contacts'

                }, function (err, response) {
                   if (err) {
                       return next(err);
                   }

                    var results = [];
                    response.hits.hits.forEach(function (e) {
                        var users = e._source;
                        console.log(e._source);
                        //users.name = e._source.name;
                        console.log('name', users.name);

                        results.push(users);
                    });

                    return reply.view('home', {users: results});
                });


            }
        }
    });

    return next();
};

exports.register.attributes = {
    name: 'Home'
};