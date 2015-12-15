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

                    var headline = request.query.job;
                    var fullname = request.query.name;
                    var location = request.query.location;
                    var skills = request.query.skills.split(',');

                    function deleteSpaces(e) {
                        return e.split(' ').filter(k => k !== '').join(' ');
                    }


                    skills = skills.map(e => deleteSpaces(e));
                    skills = skills.filter(e => e !== '');

                    console.log('==================',skills);

                    var mustClause = [];

                    if (headline !== '') {
                        mustClause.push({match: {headline:request.query.job}})
                    }

                    if (fullname !== '') {
                        mustClause.push({match: {fullname:request.query.name}})
                    }

                    if (location !== '') {
                        mustClause.push({match: {location:request.query.location}})
                    }

                    if (skills.length > 0) {
                        skills.forEach(function (skill) {
                            mustClause.push({match:{'skills.skill': skill}})
                        })
                        
                    }

                    console.log('MUSTTTTT', mustClause);

                    client.search({

                        index: process.env.ES_INDEX,
                        type: process.env.ES_TYPE,
                        body: {
                            query: {
                                bool: {
                                    must: mustClause
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