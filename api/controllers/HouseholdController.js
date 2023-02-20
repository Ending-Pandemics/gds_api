var flash500 = require('../services/flash500');
var ObjectID = require('sails-mongo/node_modules/mongodb').ObjectID;
var uuid = require('node-uuid');
var path = require('path');
/**
 * HouseholdController
 *
 * @description :: Server-side logic for managing Households members
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
    /**
     * `HouseholdController.create()`
     */
    create: function (req, res) {
        var client = req.body.client || 'api';
        delete req.body.client;
        var redirectTo = req.body.redirect_to || (req.session.UserKind == 'admin' ? '/admin/users' : '/');
        delete req.body.redirect_to;
        var params = req.body;
        Household.create(params).exec(function createCB(err, hm) {
            if (err) {
                return flash500(req, res, {
                    error: true,
                    message: 'There was an error processing your request: \n' + err
                });
            } else {
                return res.clientAwareResponse(client, redirectTo, {
                    error: false,
                    message: "Household member Created",
                    member: hm
                });
            }
        });
    },
    /**
     * `HouseholdController.read()`
     */
    read: function (req, res) {
        var params = {};
        if (req.param('household_id') != null) {
            params = {id: req.param('household_id')};
        } else if (req.param('user_id') != null) {
            params = {user: req.param('user_id')};
        }
        Household.find(params).populateAll().exec(function (err, user) {
            if (err) return flash500(req, res, {
                error: true,
                message: 'There was an error processing your request: \n' + err
            });
            return res.json({error: false, data: user});
        });
    },
    /**
     * `HouseholdController.list()`
     */
    list: function (req, res) {
        Household.find({}).exec(function (err, users) {
            if (err) return flash500(req, res, {
                error: true,
                message: 'There was an error processing your request: \n' + err
            });
            return res.json({error: false, data: users});
        });
    },
    /**
     * `HouseholdController.update()`
     */
    update: function (req, res) {
        var client = req.body.client || 'api';
        delete req.body.client;
        var params = req.body;
        Household.update({
            id: params.id
        }, params).exec(function afterwards(err, upb) {
            if (err) {
                return flash500(req, res, {
                    error: true,
                    message: 'There was an error processing your request: \n' + err
                });
            }
            return res.clientAwareResponse(client, '/admin/users', {
                error: false,
                message: "Household Member Updated",
                user: upb
            });
        });
    },
    edit: function (req, res) {
        var household_id = req.param("household_id");
        Household.findOne(household_id).exec(function (err, household_member) {
            if (err) return flash500(req, res, {
                error: true,
                message: 'There was an error processing your request: \n' + err
            });
            return res.view('admin/household_edit', {
                household_member: household_member,
                error: false,
                page: 'household_edit'
            });
        });
    },
    /**
     * `HouseholdController.delete()`
     */
    delete: function (req, res) {
        var household_id = req.param("household_id");
        var client = req.param("client") || 'dashboard';
        var redirectTo = req.param("redirect_to") || (req.session.UserKind == 'admin' ? '/admin/users' : '/');
        Household.destroy({
            id: household_id
        }).exec(function (err) {
            if (err) {
                return flash500(req, res, {
                    error: true,
                    message: 'There was an error processing your request: \n' + err
                });
            } else {
                return res.clientAwareResponse(client, redirectTo, {error: false, message: "Household member removed"});
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
                var household_id = req.body.household_id;
                User.findOne(req.session.User.id).populateAll().exec(function (err, user) {
                    var isOwn = false;
                    _.forEach(user.household, function (household) {
                        console.log('COMPARACAO', household.id, household_id);
                        if (household.id == household_id) {
                            isOwn = true;
                        }
                    });

                    if (isOwn) {
                        Household.update({
                            id: household_id
                        }, {picture: "/uploads/profile/" + files[0].filename}).exec(function afterwards(err, upb) {
                            if (err) return flash500(req, res, {
                                error: true,
                                message: 'There was an error processing your request: \n' + err
                            });
                            res.json({error: false, user: upb});
                        });
                    } else {
                        res.json({error: true, message: 'is not owner'});
                    }
                });
            } else {
                res.json({error: true, message: 'no files'});
            }

        });
    },


    /**
     * `HouseholdController.surveys()`
     */
    surveys: function (req, res) {
        return res.json({
            todo: 'surveys() is not implemented yet!'
        });
    },

    getHouseholdSurveySummary: function (req, res) {
        var year = req.param('year') || new Date().getFullYear();
        var household_id = req.param('household_id');
        console.log('d1', household_id);
        if (!household_id) {
            return res.forbidden({
                error: true,
                message: 'household_id required.'
            });
        }
        var condition = {">=": new Date(year + "-01-01"), "<=": new Date(year + "-12-31")};

        var result = {};
        Survey.count({
            no_symptom: 'Y',
            user: req.session.User.id,
            household: household_id,
            createdAt: condition
        }).exec(function (err, data) {
            console.log('d2', data);
            result['no_symptom'] = data;
            Survey.count({
                no_symptom: 'N',
                user: req.session.User.id,
                household: household_id,
                createdAt: condition
            }).exec(function (err, data) {
              console.log('d3', data);
                result['symptom'] = data;
                result['total'] = result['no_symptom'] + result['symptom'];
                return res.json({data: result});
            });
        });
    },


    getHouseholdSurveyMonth: function (req, res) {
        var year = parseInt(req.param('year')) || new Date().getFullYear();
        var month = parseInt(req.param('month')) || new Date().getMonth()+1;
        var user_id = req.session.User.id;
        var household_id = req.param('household_id');
        if (!household_id) {
            return res.forbidden({
                error: true,
                message: 'household_id required.'
            });
        }

        Survey.native(function (err, survey) {
            if (!err) {
                survey.aggregate([
                    {
                        "$project": {
                            year: {$year: "$createdAt"},
                            month: {$month: "$createdAt"},
                            day: {$dayOfMonth: "$createdAt"},
                            no_symptom: "$no_symptom",
                            household: "$household",
                        }
                    },
                    {
                        "$match": {
                            month: month,
                            year: year,
                            household: new ObjectID(household_id)
                        }
                    },
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

    getHouseholdSurveyDay: function (req, res) {
        var year = parseInt(req.param('year')) || new Date().getFullYear();
        var month = parseInt(req.param('month')) || new Date().getMonth();
        var day = parseInt(req.param('day')) || new Date().getDate();
        var user_id = req.session.User.id;
        var household_id = req.param('household_id');
        if (!household_id) {
            return res.forbidden({
                error: true,
                message: 'household_id required.'
            });
        }

        Survey.native(function (err, survey) {
            if (!err) {
                survey.aggregate([
                    {
                        "$project": {
                            year: {$year: "$createdAt"},
                            month: {$month: "$createdAt"},
                            day: {$dayOfMonth: "$createdAt"},
                            no_symptom: "$no_symptom",
                            household: "$household",
                            user: "$user"
                        }
                    },
                    {
                        "$match": {
                            month: month,
                            year: year,
                            day: day,
                            user: new ObjectID(user_id),
                            household: new ObjectID(household_id)
                        }
                    },
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

    getHouseholdSurveyYear: function (req, res) {
        var year = parseInt(req.param('year')) || new Date().getFullYear();
        var user_id = req.session.User.id;
        var household_id = req.param('household_id');
        if (!household_id) {
            return res.forbidden({
                error: true,
                message: 'household_id required.'
            });
        }

        Survey.native(function (err, survey) {
            if (!err) {
                survey.aggregate([
                    {
                        "$project": {
                            year: {$year: "$createdAt"},
                            month: {$month: "$createdAt"},
                            day: {$dayOfMonth: "$createdAt"},
                            user: "$user",
                            household: "$household",
                        }
                    },
                    {"$match": {year: year, user: new ObjectID(user_id), household: new ObjectID(household_id)}},
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


};
