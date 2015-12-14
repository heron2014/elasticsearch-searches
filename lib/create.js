var client = require('./es');

exports.register = function (server, options, next) {

    server.route([

    {
        method: 'GET',
        path: '/create',
        config: {
            description: 'return the home page',
            handler: function (request, reply) {

                return reply.file('./views/create.html');
            }
        }
    },

    {
        method: 'POST',
        path: '/create',
        config: {
            description: 'save the user to db',
            handler: function (request, reply) {

                if (request.payload === '') {
                    return reply('please insert something');
                } else {

                    client.index({
                        index: 'myusers',
                        type: 'candidates',
                        body: {

                            name: request.payload.name,
                            surname: request.payload.surname,
                            company: request.payload.company,
                            education: request.payload.education,
                            job: request.payload.job,
                            hobby: request.payload.hobby,
                            location: request.payload.location,
                            skills: request.payload.skills,
                            published_at: new Date()

                        }

                    }, function (err, response) {
                        if (err) {
                            return next(err);
                        }
                    });

                    return reply.redirect('/');

                }




            }
        }
    }
    ]);

    return next();
};

exports.register.attributes = {
    name: 'Create'
};