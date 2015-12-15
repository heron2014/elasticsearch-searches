require('env2')('.env');
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
                    index: process.env.ES_INDEX,
                    size: 50,
                    type: process.env.ES_TYPE

                }, function (err, response) {
                   if (err) {
                       return next(err);
                   }

                    var results = [];
                    // var skills = ['php', 'css', 'hapi', 'javascript', 'c++', 'python', 'haskell', 'react', 'design', 'redis', 'elasticsearch', 'marketing and management'];
                    response.hits.hits.forEach(function (e) {
                        var users = e._source;
                        users.skills.forEach(function (skill) {
                            // console.log(skill.skill);
                        });
                        //console.log(e._source);
                        //users.name = e._source.name;
                        //console.log('name', users.name);

                        results.push(users);
                    });

                    return reply.view('home', {results: results});
                });


            }
        }
    });

    return next();
};

exports.register.attributes = {
    name: 'Home'
};