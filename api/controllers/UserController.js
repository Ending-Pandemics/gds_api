var flash500 = require('../services/flash500');
var uuid = require('node-uuid');
var bcrypt = require('bcrypt-nodejs');
var path = require('path');
var sendMail = require('../services/sendMail');
var Utils = require('../services/utils');
var findUserByToken = require('../services/findUserByToken');
var moment = require('moment');
var ObjectID = require('sails-mongo/node_modules/mongodb').ObjectID;
var jwt = require('jwt-simple');
/**
 - * UserController
 *
 * @description :: Server-side logic for managing Users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var current_week_of = Utils.getWeekOf();

module.exports = {
    /**
     * `UserController.create()`
     */
    create: function (req, res) {
        var client = req.body.client || 'api';
        delete req.body.client;
        var user = req.body;
        if (typeof(user.password) === 'undefined' && (user.fb || user.tw || user.gl)) {
            user.password = new Date().getTime();
        }
        User.create(user).exec(function createCB(err, b) {
            if (err) {
                if (err.Errors.email){

                  // console.log('ERROR EAMIL d1:',err.Errors.email);
                  // console.log('ERROR EAMIL d2:',user);
                  // User.findOne({email:user.email}).exec(function(err, userDoc){
                  //   checkPasswd
                  //   var payload = {
                  //       sub: userDoc.id,
                  //       exp: moment().add(1, 'days').unix()
                  //   };
                  //   userDoc.token = jwt.encode(payload, '69fce38b3f603d7ec895f7838b37c2f3#!@69fce38b3f603d7ec895f7838b37c2f3'); //TODO REPLACE INSERT_APP_SECRET WITH REAL APP SECRET
                  //   return res.clientAwareResponse(client, '/admin/users', {
                  //       error: false,
                  //       status: true,
                  //       message: "User Logged",
                  //       user: userDoc.toJSON()
                  //   });
                  // });
                  res.status(409);
                  return res.negotiate(err);
                }else{
                  return flash500(req, res, {
                      error: true,
                      message: 'There was an error processing your request: \n' + err.Errors
                  });
                }
            } else {
                var payload = {
                    sub: b.id,
                    exp: moment().add(1, 'days').unix()
                };
                b.token = jwt.encode(payload, '69fce38b3f603d7ec895f7838b37c2f3#!@69fce38b3f603d7ec895f7838b37c2f3'); //TODO REPLACE INSERT_APP_SECRET WITH REAL APP SECRET
                return res.clientAwareResponse(client, '/admin/users', {
                    error: false,
                    status: true,
                    message: "User Created",
                    user: b
                });
            }
        });
    },
    /**
     * `UserController.lookup()`
     */
    lookup: function (req, res) {
        var errorResponse = {error: true, message: "Invalid User Token."};

        function getProfileByToken(id) {
            User.findOne({id: id}).populateAll().exec(function (err, user) {
                if (err) {
                    return flash500(req, res, {
                        error: true,
                        message: 'There was an error processing your request: \n' + err
                    });
                }
                console.log("err", err);
                console.log("User", user);
                var payload = {
                    sub: user.id,
                    exp: moment().add(1, 'days').unix()
                };
                user.token = jwt.encode(payload, '69fce38b3f603d7ec895f7838b37c2f3#!@69fce38b3f603d7ec895f7838b37c2f3'); //TODO REPLACE INSERT_APP_SECRET WITH REAL APP SECRET
                return res.json({error: false, data: user});

            });
        }

        if (req.header['user_token'] != null || req.session.authenticated) {
            if (req.session.User != null) {
                console.log("getting from session", req.session.User);
                getProfileByToken(req.session.User.id);
            } else {
                console.log("getting from header", req.headers['user_token']);
                findUserByToken(req.headers['user_token'], function (result) {
                    console.log("findUserByToken", result);
                    if (result) {
                        getProfileByToken(result.id);
                    } else {
                        return res.json(errorResponse);
                    }
                });
            }
        } else {
            return res.json(errorResponse);
        }
    },
    read: function (req, res) {
        var params = {};
        if (req.param('email') != null) {
            params = {email: req.param('email')};
        } else if (req.param('user_id') != null) {
            params = {id: req.param('user_id')};
        } else if (req.param('fb') != null) {
            params = {fb: req.param('fb')};
        } else if (req.param('tw') != null) {
            params = {tw: req.param('tw')};
        } else if (req.param('gl') != null) {
            params = {gl: req.param('gl')};
        }
        User.find(params).populateAll().exec(function (err, user) {
            if (err) return flash500(req, res, {
                error: true,
                message: 'There was an error processing your request: \n' + err
            });
            return res.json({error: false, data: user});
        });
    },
    /**
     * `UserController.list()`
     */
    list: function (req, res) {
        User.find({}).exec(function (err, users) {
            if (err) return flash500(req, res, {
                error: true,
                message: 'There was an error processing your request: \n' + err
            });
            return res.json({error: false, data: users});
        });
    },
    /**
     * `UserController.update()`
     */
    update: function (req, res) {
        console.log('update user');
        var client = req.body.client || 'api';
        var redirectTo = req.session.UserKind == 'admin' ? '/admin/users' : '/user';
        delete req.body.redirect_to;
        delete req.body.client;
        var user = req.body;
        console.log('body', user);
        User.update({
            id: req.session.User.id
        }, user).exec(function afterwards(err, upb) {
            if (err) return flash500(req, res, {
                error: true,
                message: 'There was an error processing your request: \n' + err
            });
            if (client == 'api') {
                return res.json({error: false, message: 'Upload realizado com sucesso'});
            } else {
                return res.clientAwareResponse(client, redirectTo, {
                    error: false,
                    status: true,
                    message: "User Updated",
                    user: upb
                });
            }
        });
    },
    edit: function (req, res) {
        var user_id = req.param("user_id");
        User.findOne(user_id).exec(function (err, user) {
            if (err) return flash500(req, res, {
                error: true,
                message: 'There was an error processing your request: \n' + err
            });
            return res.view('user/user_edit', {
                user: user,
                error: false,
                page: 'user_edit'
            });
        });
    },
    /**
     * `UserController.delete()`
     */
    delete: function (req, res) {
        var userId = req.session.User.id;
        User.findOne({id: userId }).exec(function(err, user){
            user.deleted = true;
                user.save(function(err, s){
                req.session.destroy();
                return res.ok();
            });
        });
    },

    reactivate: function (req, res) {
        var userMail = req.body.email;
        User.findOne({email: userMail }).exec(function(err, user){
            user.deleted = false;
                user.save(function(err, s){
                return res.ok();
            });
        });
    },
    /**
     * `UserController.index()`
     */
    index: function (req, res) {
        App.find({}).exec(function (err, apps) {
            if (err) {
                return flash500({error: true, message: 'There was an error processing your request: \n' + err});
            }
            User.find({}).populate('app').exec(function (err, users) {
                if (err) return flash500(req, res, {
                    error: true,
                    message: 'There was an error processing your request: \n' + err
                });
                return res.view('user/user_index', {
                    users: users,
                    apps: apps,
                    error: false,
                    page: 'user_index'
                });
            });
        });
    },
    login: function (req, res) {
        return res.view('user/login', {page: 'user_login'});
    },
    profile: function (req, res) {
        User.findOne(req.session.User.id).populateAll().exec(function (err, user) {
            console.log("profile", user);
            return res.view('user/user_profile', {
                page: 'user_profile',
                user: user
            });
        });
    },
    report: function (req, res) {
        User.findOne(req.session.User.id).populateAll().exec(function (err, user) {
            Symptom.find({}).exec(function (err, symptoms) {
                if (err) return flash500(req, res, {
                    error: true,
                    message: 'There was an error processing your request: \n' + err
                });
                App.find({}).exec(function (err, apps) {
                    if (err) {
                        return flash500(req, res, {
                            error: true,
                            message: 'There was an error processing your request: \n' + err
                        });
                    } else {
                        return res.view('user/user_survey', {
                            symptoms: symptoms,
                            apps: apps,
                            error: false,
                            user: user,
                            page: 'user_survey'
                        });
                    }
                });

            });
        });
    },

    hashtag_add: function (req, res) {
        var client = req.body.client || 'api';
        var hashtag_id = req.body.hashtag_id;
        var user_id = req.session.User.id;

        User.findOne(user_id).populateAll().exec(function (err, user) {
            if (err) {
                return flash500({error: true, message: 'There was an error processing your request: \n' + err});
            } else {
                user.hashtags.add(hashtag_id);
                user.save(function (err, user_new) {
                    if (err) {
                        return flash500(req, res, {
                            error: true,
                            message: 'There was an error processing your request: \n' + err
                        });
                    } else {
                        return res.json({error: 'false', message: 'Hashtag added'});
                    }
                });
            }
        });
    },
    hashtag_remove: function (req, res) {
        var client = req.body.client || 'api';
        var hashtag_id = req.body.hashtag_id;
        var user_id = req.session.User.id;
        User.findOne(user_id).populateAll().exec(function (err, user) {
            if (err) {
                return flash500({error: true, message: 'There was an error processing your request: \n' + err});
            } else {
                user.hashtags.remove(hashtag_id);
                user.save(function (err, user_new) {
                    if (err) {
                        return flash500(req, res, {
                            error: true,
                            message: 'There was an error processing your request: \n' + err
                        });
                    } else {
                        return res.json({error: 'false', message: 'Hashtag removed'});
                    }
                });
            }
        });
    },

    getUsersByPlatform: function (req, res) {
        User.native(function (err, user) {
            if (!err) {
                user.aggregate([
                    {"$match": {platform: {$exists: true}}},
                    {"$group": {_id: "$platform", count: {$sum: 1}}}
                ], function (err, result) {
                    var data = {total: 0};
                    _.forEach(result, function (row) {
                        data[row._id] = row.count;
                        data['total'] += row.count;
                    });
                    return res.json({error: 'false', data: data});
                });
            }
        });
    },

    getUserSurveySummary: function (req, res) {
        var year = req.param('year') || new Date().getFullYear();
        var condition = {">=": new Date(year + "-01-01"), "<=": new Date(year + "-12-31")};

        var result = {};
        Survey.count({
            no_symptom: 'Y',
            user: req.session.User.id,
            household: {$exists: false},
            createdAt: condition
        }).exec(function (err, data) {
            result['no_symptom'] = data;
            Survey.count({
                no_symptom: 'N',
                user: req.session.User.id,
                household: {$exists: false},
                createdAt: condition
            }).exec(function (err, data) {
                result['symptom'] = data;
                result['total'] = result['no_symptom'] + result['symptom'];
                return res.json({data: result});
            });
        });
    },

    getAllUserSurveyMonth: function (req, res) {
        var year = parseInt(req.param('year')) || new Date().getFullYear();
        var month = parseInt(req.param('month')) || new Date().getMonth();
        var user_id = req.session.User.id;
        var household = req.param('household_id') || null;
        if (household) {
            household = new ObjectID(household);
        } else {
            household = {$exists: false};
        }

        Survey.native(function (err, survey) {
            if (!err) {
                survey.aggregate([
                    {
                        "$project": {
                            year: {$year: "$createdAt"},
                            month: {$month: "$createdAt"},
                            day: {$dayOfMonth: "$createdAt"},
                            user: "$user"
                        }
                    },
                    {"$match": {month: month, year: year, user: new ObjectID(user_id)}},
                    {
                        "$group": {
                            _id: {day: "$day", month: "$month", year: "$year"},
                            count: {$sum: 1}
                        }
                    }

                ], function (err, result) {
                    return res.json({error: 'false', data: result});
                });
            }
        });

    },

    getUserSurveyMonth: function (req, res) {
        var year = parseInt(req.param('year')) || new Date().getFullYear();
        var month = parseInt(req.param('month')) || new Date().getMonth()+1;
        var user_id = req.session.User.id;

        Survey.native(function (err, survey) {
            if (!err) {
                survey.aggregate([
                    {
                        "$project": {
                            year: {$year: "$createdAt"},
                            month: {$month: "$createdAt"},
                            day: {$dayOfMonth: "$createdAt"},
                            no_symptom: "$no_symptom",
                            user: "$user",
                            household: "$household"
                        }
                    },
                    {"$match": {month: month, year: year, user: new ObjectID(user_id), household:{$exists:false}}},
                    {
                        "$group": {
                            _id: {day: "$day", month: "$month", year: "$year", no_symptom: "$no_symptom"},
                            count: {$sum: 1}
                        }
                    }

                ], function (err, result) {
                    return res.json({error: 'false', data: result});
                });
            }
        });

    },

    getUserSurveyDay: function (req, res) {
        var year  =  new Date().getFullYear();
        var month = new Date().getMonth()+1;
        var day   = new Date().getDate();
        var user_id = req.session.User.id;
        Survey.native(function (err, survey) {
            if (!err) {
                survey.aggregate([
                    {
                        "$project": {
                            year: {$year: "$createdAt"},
                            month: {$month: "$createdAt"},
                            day: {$dayOfMonth: "$createdAt"},
                            no_symptom: "$no_symptom",
                            user: "$user"
                        }
                    },
                    {"$match": {month: month, year: year, day: day, user: new ObjectID(user_id)}},
                    {
                        "$group": {
                            _id: {day: "$day", month: "$month", year: "$year", no_symptom: "$no_symptom"},
                            count: {$sum: 1}
                        }
                    }

                ], function (err, result) {
                    return res.json({error: 'false', data: result});
                });
            }
        });

    },


    getUserSurveyYear: function (req, res) {
        var year = parseInt(req.param('year')) || new Date().getFullYear();
        var month = parseInt(req.param('month')) || new Date().getFullYear();
        var user_id = req.session.User.id;

        Survey.native(function (err, survey) {
            if (!err) {
                survey.aggregate([
                    {
                        "$project": {
                            year: {$year: "$createdAt"},
                            month: {$month: "$createdAt"},
                            day: {$dayOfMonth: "$createdAt"},
                            user: "$user",
                        }
                    },
                    {"$match": {year: year, user: new ObjectID(user_id)}},
                    {"$group": {_id: {day: "$day", month: "$month", year: "$year"}, count: {$sum: 1}}},
                    {"$group": {_id: {month: "$_id.month", year: "$_id.year"}, count: {$sum: 1}}}

                ], function (err, result) {
                    for (var i = 0; i < result.length; i++) {
                        var month_days = new Date(result[i]['_id']['year'], result[i]['_id']['month'], 0).getDate();
                        var survey_days = result[i]['count'];
                        result[i]['percent'] = (survey_days / month_days * 100).toFixed(2);
                    }
                    ;
                    return res.json({error: 'false', data: result});
                });
            }
        });

    },

    getUserGeographicSummary: function (req, res) {
        User.native(function (err, user) { //get users group by state
            if (!err) {
                user.aggregate([
                    {"$match": {state: {$exists: true}}},
                    {"$group": {_id: "$state", count: {$sum: 1}}}
                ], function (err, result) {
                    var data = {"state": {total: 0}};
                    _.forEach(result, function (row) {
                        data['state'][row._id] = row.count;
                        data['state']['total'] += row.count;
                    });
                    return res.json({error: 'false', data: data});
                });
            }
        });
    },

    getUserProfileSummary: function (req, res) {
        var state = req.param('state');
        if (state) {
            var state_param = state;
        } else {
            var state_param = {$exists: true};
        }
        User.native(function (err, user) { // get users group by gender
            if (!err) {
                user.aggregate([
                    {"$match": {state: state_param}},
                    {
                        "$project": {
                            gender: "$gender",
                            age: {$subtract: [{$divide: [{$subtract: [new Date(), "$dob"]}, 31558464000]}, {$mod: [{$divide: [{$subtract: [new Date(), "$dob"]}, 31558464000]}, 1]}]}
                        }
                    },
                    {"$group": {_id: {gender: "$gender", age: "$age"}, count: {$sum: 1}}},
                    {"$sort": {count: -1}}
                ], function (err, result) {
                    if (err) return flash500(req, res, {
                        error: true,
                        message: 'There was an error processing your request: \n' + err
                    });
                    data = {
                        "M": {"18_24": 0, "25_34": 0, "35_44": 0, "45_54": 0, "65_": 0, "total": 0},
                        "F": {"18_24": 0, "25_34": 0, "35_44": 0, "45_54": 0, "65_": 0, "total": 0}
                    }
                    _.forEach(result, function (row) {
                        if (row._id.age >= 18 && row._id.age <= 24) {
                            data[row._id.gender]["18_24"] += row.count;
                            data[row._id.gender]["total"] += row.count;
                        }
                        else if (row._id.age >= 25 && row._id.age <= 34) {
                            data[row._id.gender]["25_34"] += row.count;
                            data[row._id.gender]["total"] += row.count;
                        }
                        else if (row._id.age >= 35 && row._id.age <= 44) {
                            data[row._id.gender]["35_44"] += row.count;
                            data[row._id.gender]["total"] += row.count;
                        }
                        else if (row._id.age >= 45 && row._id.age <= 54) {
                            data[row._id.gender]["45_54"] += row.count;
                            data[row._id.gender]["total"] += row.count;
                        }
                        else if (row._id.age >= 65) {
                            data[row._id.gender]["65_"] += row.count;
                            data[row._id.gender]["total"] += row.count;
                        }
                    });
                    return res.json({error: 'false', data: data});
                });
            }
        });
    },

    getSubscriptionByWeekOf: function (req, res) {
        var week_of = req.param('week_of') || current_week_of;
        var end_date = moment(week_of).add(7, "days").format("YYYY-MM-DD");
        User.getSubscriptionByWeekOf(week_of, end_date, function (result) {
            return res.json({error: false, data: result});
        });
    },

    getSubscriptionByWeeks: function (req, res) {
        var data = {};
        User.native(function (err, user) {
            if (!err) {
                user.aggregate([
                    {"$match": {week_of: {$exists: true}}},
                    {
                        "$project": {
                            year: {$year: "$week_of"},
                            month: {$month: "$week_of"},
                            day: {$dayOfMonth: "$week_of"},
                        }
                    },
                    {"$group": {_id: {year: "$year", month: "$month", day: "$day"}, count: {$sum: 1}}}
                ], function (err, result) {
                    data['signups'] = result;

                    Unsubscribe.native(function (err, unsubscribe) {
                        if (!err) {
                            unsubscribe.aggregate([
                                {"$match": {week_of: {$exists: true}}},
                                {
                                    "$project": {
                                        year: {$year: "$week_of"},
                                        month: {$month: "$week_of"},
                                        day: {$dayOfMonth: "$week_of"},
                                    }
                                },
                                {"$group": {_id: {year: "$year", month: "$month", day: "$day"}, count: {$sum: 1}}}
                            ], function (err, result) {
                                data['unsubscribes'] = result;

                                Survey.native(function (err, survey) {
                                    if (!err) {
                                        survey.aggregate([
                                            {"$match": {week_of: {$exists: true}, household: {$exists: false}}},
                                            {
                                                "$project": {
                                                    year: {$year: "$week_of"},
                                                    month: {$month: "$week_of"},
                                                    day: {$dayOfMonth: "$week_of"},
                                                }
                                            },
                                            {
                                                "$group": {
                                                    _id: {year: "$year", month: "$month", day: "$day"},
                                                    count: {$sum: 1}
                                                }
                                            }
                                        ], function (err, result) {
                                            data['surveys'] = result;
                                            return res.json({error: 'false', data: data});
                                        });
                                    }
                                });
                            });
                        }
                    });

                });
            }
        });

    },

    getMonthlySubscription: function (req, res) {
        var year = parseInt(req.param('year')) || new Date().getFullYear();
        var user_id = req.param('user_id') || null;
        var data = {};

        User.getMonthlySubscription(year, user_id, function (result) {
            return res.json({data: result});
        });

    },

    setSubscription: function (req, res) {
        var token = req.body.user_token;
        findUserByToken(token, function (user) {
            if (user[0]) {
                user = user[0];
                if (user.active == "Y") {
                    User.unsubscribe(user, req.body.reason, function (result) {
                        return res.json({error: false, data: result});
                    });
                } else {
                    User.subscribe(user, function (result) {
                        return res.json({error: false, data: result});
                    });
                }
            } else {
                return res.json({error: true});
            }
        });
    },
    upload: function (req, res) {
        if (req.method === 'GET')
            return res.json({'status': 'GET not allowed'});
        //  Call to /upload via GET is error

        var uploadFile = req.file('uploadFile');
        // console.log(uploadFile);

        uploadFile.upload({
            dirname: '../../assets/uploads/profile', saveAs: function (file, cb) {
                file.filename = uuid.v1(file.filename) + path.extname(file.filename);
                cb(null, file.filename);
            }
        }, function onUploadComplete(err, files) {
            //  Files will be uploaded to .tmp/uploads

            if (err) return res.serverError(err);
            //  IF ERROR Return and send 500 error with error

            if (files[0]) {
                console.log(files[0]);
                User.findOne(req.session.User.id).populateAll().exec(function (err, user) {
                    User.update({
                        id: user.id
                    }, {picture: "/uploads/profile/" + files[0].filename}).exec(function afterwards(err, upb) {
                        if (err) return flash500(req, res, {
                            error: true,
                            message: 'There was an error processing your request: \n' + err
                        });
                        res.json({error: false, user: upb});
                    });
                });
            } else {
                return res.json({error: true, file: files[0]});
            }

        });
    },

    forgot_password: function (req, res) {
        var email = req.body.email;
        var lang = req.body.lang || 'en';
        User.findOne({email: email}).populateAll().exec(function (err, user) {
            if (err) {
                return flash500({error: true, message: 'There was an error processing your request: \n' + err});
            } else {
                if (!user) {
                    return res.json({error: true, message: 'Email inválido.'});
                } else {
                    var salt = bcrypt.genSaltSync(10);
                    var hash = bcrypt.hashSync(user.id, salt);

                    user.resetPasswordHash = hash;
                    user.resetPasswordExpires = new Date(Date.now() + 7200000); // 2 hours

                    user.save(function (err) {
                        if (err) {
                            return flash500({
                                error: true,
                                message: 'There was an error processing your request: \n' + err
                            });
                        } else {
                            sendMail.sendMailForgotPassword(email, hash, lang, function (result) {
                                var response = {error: false, message: 'Mensagem enviada com sucesso!'};
                                if (result) {
                                    response.error = true;
                                    response.message = result;
                                }
                                return res.json(response);
                            });
                        }
                    });
                }
            }
        });
    },

    validate_hash: function (req, res) {
        var hash = req.param("hash");
        if (!hash) return res.json({error: true, message: 'param hash is obligatory'});

        User.findOne({
            resetPasswordHash: hash,
            resetPasswordExpires: {$gte: new Date()}
        }).populateAll().exec(function (err, user) {
            if (err) {
                return flash500({error: true, message: 'There was an error processing your request: \n' + err});
            } else {
                if (!user) {
                    return res.json({error: true, message: 'hash invalid'});
                } else {
                    return res.json({error: false, message: 'hash valid', user_id: user.id});
                }
            }
        });
    },

    update_password: function (req, res) {
        var password = req.body.password;
        var id = req.body.id;
        var hash = req.body.hash;
        if (!password) {
            return res.json({error: true, message: 'Senha é obrigatório.'});
        }
        User.findOne({
            resetPasswordHash: hash,
            resetPasswordExpires: {$gte: new Date()}
        }).populateAll().exec(function (err, user) {
            if (err) {
                return flash500({error: true, message: 'There was an error processing your request: \n' + err});
            } else {
                if (!user) {
                    return res.json({error: true, message: 'Hash inválido'});
                } else {
                    if (user.id != id) {
                        return res.json({error: true, message: 'Usuário inválido.'});
                    }
                    User.update({
                        id: id
                    }, {password: password}).exec(function afterwards(err, upb) {
                        if (err) {
                            return flash500(req, res, {
                                error: true,
                                message: 'There was an error processing your request: \n' + err
                            });
                        }
                        if (upb) {
                            return res.json({error: false, message: 'Senha atualizada com sucesso.'});
                        } else {
                            return res.json({error: true, message: 'Usuário não encontrado.'});
                        }
                    });
                }
            }
        });
    },

    changePasswd: function (req, res) {
      console.log('chpasswd body', req.body);
        var userId = req.session.User.id || req.body.userId;
        var passwd = req.body.passwd;
        var newPasswd = req.body.passwdn;
        User.findOne({id: userId }).exec(function(err, user){
            bcrypt.compare(passwd, user.password, function (err, valid) {
                if (!valid) {
                    res.status(401);
                    return res.send("NOK");
                }else{
                    user.password = newPasswd;
                        user.save(function(err, s){
                        return res.ok();
                    });
                }
            });
        });
    }
};
