var bcrypt = require('bcrypt-nodejs');
var Geocoder = require('../services/geocoder');
var moment = require('moment');
/**
 * User.js
 *
 * @description :: Represents a platform user
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
    attributes: {
        email: {type: 'email', unique: true, required: true},
        app: {model: 'App', required: true},
        password: {type: 'string', required: true},
        nick: {type: 'string', required: false},
        dob: {type: 'date', required: true},
        gender: {type: 'string', enum: ['M', 'F'], required: true},
        race: {type: 'string', enum: ['branco', 'preto', 'pardo', 'amarelo', 'indigena', 'france'], required: true},
        tw: {type: 'string', required: false},
        fb: {type: 'string', required: false},
        gl: {type: 'string', required: false},
        city: {type: 'string', required: false},
        state: {type: 'string', required: false},
        zip: {type: 'string', required: false},
        formattedAddress: {type: 'string', required: false},
        picture: {type: 'integer', required: false},
        photo: {type: 'string', required: false},
        resetPasswordHash: {type: 'string', required: false},
        resetPasswordExpires: {type: 'datetime', required: false},
        categories: {
            collection: 'Category',
            via: 'owners',
            dominant: true
        },
        hashtags: {
            collection: 'Hashtag',
            via: 'owners',
            dominant: true
        },
        week_of: {
            type: 'date', defaultsTo: function () {
                return moment().day(1).format('YYYY-MM-DD');
            }, required: true
        },
        active: {type: 'string', enum: ['Y', 'N'], defaultsTo: 'Y', required: true},
        platform: {type: 'string', enum: ['web', 'ios', 'android', 'wp'], required: true},
        surveys: {
            collection: 'Survey',
            via: 'user'
        },
        household: {
            collection: 'Household',
            via: 'user'
        },
        isAdmin: {type: 'boolean', defaultsTo: false},
        age: {type: 'string', required: false},

        toJSON: function () {
            var obj = this.toObject();
            delete obj.password;
            return obj;
        },
        checkPasswd: function(userPass, reqPass){
            var userPasswd =  userPass;
            var passwdTocheck = reqPass;
            bcrypt.compare(userPasswd, passwdTocheck, function (err, valid) {
                if (!valid) {
                    return false;
                }else{
                    return true;
                }
            });
        }
    },
    beforeValidate: function (attr, next) {
        if (attr.password == '') {
            delete attr.password;
        }
        // console.log('USER PIC', attr.picture);
        if(attr.picture == null) attr.picture = 0;
        if (attr.app == null && attr.app_token != null) {
            // console.log("injecting app token");
            App.findOne({token: attr.app_token}, function (err, app) {
                if (err || app.id == null) {
                    return res.status(500).send({
                        error: true,
                        message: 'Invalid app id: ' + err.toString()
                    });
                } else {
                    // console.log("found app:", app.name, app.id);
                    attr.app = app.id;
                    delete attr.app_token;
                    next();
                }
            });

        } else {
            next();
        }
    },

    beforeCreate: function (attr, next) {
        attr.age = this._calculateAge(attr.dob);
        attr.ageGroup = this.checkAgeGroup(attr.age);
        bcrypt.genSalt(10, function (err, salt) {
            if (err) {
                next(err);
            }
            bcrypt.hash(attr.password, salt, null, function (err, hash) {
                if (err) next(err);
                attr.password = hash;
                if (attr.lon && attr.lat) {
                    Geocoder.getLocationByCoord(attr.lon, attr.lat, function (res) {
                          // delete attr.lat;
                          // delete attr.lon;
                        attr.state = res.state;
                        attr.city = res.city;
                        attr.zip = res.zip;
                        attr.formattedAddress = res.formattedAddress;
                        next();
                    });
                } else {
                    next();
                }
            });
        });
    },


    // beforeUpdate: function (attr, next) {
    //     console.log('calls before update');
    //     if (typeof(attr.password) === 'undefined') {
    //         console.log('calls before update 1');
    //         delete attr.password;
    //         next();
    //     } else {
    //         console.log('calls before update 2');
    //         bcrypt.genSalt(10, function (err, salt) {
    //             if (err) {
    //                 next(err);
    //             }
    //             bcrypt.hash(attr.password, salt, null, function (err, hash) {
    //                 if (err) next(err);
    //                 attr.password = hash;
    //                 next();
    //             });
    //         });
    //     }
    // },

    getSubscriptionByWeekOf: function (week_of, end_date, next) {
        var data = {};

        User.count({'createdAt': {'>=': new Date(week_of), '<': new Date(end_date)}}, function (err, result) {
            if (err) return flash500(req, res, {
                error: true,
                message: 'There was an error processing your request: \n' + err
            });
            data['signups'] = result;

            User.count({'createdAt': {'<': new Date(week_of)}}, function (err, result) {
                if (err) return flash500(req, res, {
                    error: true,
                    message: 'There was an error processing your request: \n' + err
                });
                // console.log(result);
                data['signups_percent'] = data['signups'] / result * 100;


                // console.log(new Date(week_of), new Date(end_date));
                Unsubscribe.native(function (err, unsubscribe) {
                    unsubscribe.distinct('user', {
                        'createdAt': {
                            $gte: new Date(week_of),
                            $lt: new Date(end_date)
                        }
                    }, function (err, result) {
                        if (err) return flash500(req, res, {
                            error: true,
                            message: 'There was an error processing your request: \n' + err
                        });
                        data['unsubscribes'] = result.length;

                        Unsubscribe.native(function (err, unsubscribe) {
                            unsubscribe.distinct('user', {'createdAt': {$lt: new Date(week_of)}}, function (err, result) {
                                if (err) return flash500(req, res, {
                                    error: true,
                                    message: 'There was an error processing your request: \n' + err
                                });
                                var total_old = result.length || 1;
                                data['unsubscribes_percent'] = data['unsubscribes'] / total_old * 100;
                                return next(data);
                            });
                        });
                    });
                });
            });
        });
    },

    getMonthlySubscription: function (year, user_id, next) {
        data = {};
        User.native(function (err, collection) {
            if (!err) {
                collection.aggregate([
                    {
                        "$project": {
                            year: {$year: "$createdAt"},
                            month: {$month: "$createdAt"},
                        }
                    },
                    {"$group": {_id: {month: "$month", year: "$year"}, count: {$sum: 1}}}

                ], function (err, result) {
                    data['signups'] = result;

                    Unsubscribe.native(function (err, collection) {
                        if (!err) {
                            collection.aggregate([
                                {
                                    "$project": {
                                        year: {$year: "$createdAt"},
                                        month: {$month: "$createdAt"},
                                        user: "$user",
                                    }
                                },
                                {"$match": {user: user_id}},
                                {
                                    "$group": {
                                        _id: {user: "$user", year: "$year", month: "$month"},
                                        duplication: {$sum: 1}
                                    }
                                },
                                {"$group": {_id: {month: "$_id.month", year: "$_id.year"}, count: {$sum: 1}}}

                            ], function (err, result) {
                                data['unsubscribes'] = result;
                                next(data);
                            });
                        }
                    });

                });
            }
        });
    },
    unsubscribe: function (user, reason, next) {
        // console.log('User unsubscribe');
        Unsubscribe.create({user: user, reason: reason}).exec(function (err, obj) {
            next(user);
        });
    },
    subscribe: function (user, next) {
        // console.log('User subscribe');
        User.update({'id': user.id}, {active: 'Y'}).exec(function (err, user) {
            console.log('user', user);
            next(user);
        });
    },

    checkAgeGroup: function(age){
        if (age >= 13 && age <= 19){
            rangeAge = "13_19";
        }else if (age >= 20 && age <= 29){
            rangeAge = "20_29";
        }else if (age >= 30 && age <= 39){
            rangeAge = "30_39";
        }else if (age >= 40 && age <= 49){
            rangeAge = "40_49";
        }else if (age >= 50 && age <= 59){
            rangeAge = "50_59";
        }else if (age >= 60 && age <= 69){
            rangeAge = "60_69";
        }else if (age >= 70 && age <= 79){
            rangeAge = "70_79";
        }else if (age > 80){
            rangeAge = "80";
        }
        return rangeAge;
    },

    _calculateAge: function(dob) {
        if (dob == "undefined"){
            return 0;
        }
        var ageDifMs = Date.now() - dob.getTime();
        var ageDate = new Date(ageDifMs); // miliseconds from epoch
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    }
};
