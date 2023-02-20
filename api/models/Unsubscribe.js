var moment = require('moment');


module.exports = {
    attributes: {
        user: {model: 'User', required: true},
        week_of: {
            type: 'date', defaultsTo: function () {
                return moment().day(1).format('YYYY-MM-DD');
            }, required: true
        },
        reason: {type: 'string', required: false},
    },
    beforeCreate: function (obj, next) {
        User.update({'id': obj.user}, {active: 'N'}).exec(function (err, user) {
            next();
        });
    }
}