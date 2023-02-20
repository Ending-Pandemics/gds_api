var jwt = require('jwt-simple');
module.exports = function (token, cb) {
    try {
        var payload = jwt.decode(token, '69fce38b3f603d7ec895f7838b37c2f3#!@69fce38b3f603d7ec895f7838b37c2f3'); //TODO REPLACE INSERT_CLIENT_SECRET WITH REAL APP SECRET
        Admin.find({id: payload.sub}).populateAll().exec(function (err, admin) {
            if (!admin) {
                cb(false);
            }
            cb(admin);
        });
    } catch (err) {
        cb(false);
    }
};
