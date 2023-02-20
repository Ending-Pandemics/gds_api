var jwt = require('jwt-simple');
var moment = require('moment');

module.exports = function (user, res) {
    var payload = {
        sub: user.id,
        exp: moment().add(1, 'days').unix()
    };
    var token = jwt.encode(payload, '69fce38b3f603d7ec895f7838b37c2f3#!@69fce38b3f603d7ec895f7838b37c2f3'); //TODO REPLACE INSERT_APP_SECRET WITH REAL APP SECRET
    var userObj;
    if (user.hasOwnProperty('toJSON')){
        userObj = user.toJSON(); 
    }else{
        userObj = user;
    };
    return res.status(200).send({
        user: userObj,
        error: false,
        login: true,
        message: "Welcome, " + user.nick || user.email,
        token: token
    });
};
