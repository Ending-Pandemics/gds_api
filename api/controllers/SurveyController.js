var flash500 = require('../services/flash500');
var surveyGenerator = require('../services/surveyGenerator');
var Geocoder = require('../services/geocoder');
var Utils = require('../services/utils');
var SurveyService = require('../services/surveyService');
var moment = require('moment');
/**
 * SurveyController
 *
 * @description :: Server-side logic for managing Surveys
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var current_week_of = Utils.getWeekOf();

module.exports = {
    index: function (req, res) {
        return res.view('admin/admin_surveys.ejs', {error: false, page: 'admin_surveys'});
    },
    /**
     * `SurveyController.create()`
     */
    create: function (req, res) {
        var user_id = req.body.user_id;
        var household_id = req.body.household_id;
        var symptoms = req.body.symptoms;
        var client = req.body.client || 'api';
        var redirectTo = req.body.redirect_to || '/user';
        delete req.body.client;
        delete req.body.redirect_to;
        var ip = req.headers['x-forwarded-for'] || "";
        if (!user_id && !household_id) {
            return res.forbidden({
                error: true,
                message: 'user_id or household_id required.'
            });
        }
        var params = req.body;
        params.ip = ip;
        if (user_id != null) {
            params.user = user_id;
        }
        if (household_id != null) {
            params.household = household_id;
        }
        delete params.user_id;
        delete params.household_id;
        delete params.symptoms;

        Survey.create(params).exec(function createCB(err, survey) {
            if (err) {
                var error = {
                    error: true,
                    title: 'Validation Error',
                    message: 'There was an error processing your request: \n' + err
                };
                if (err.code == 'E_VALIDATION') {
                    return res.clientAwareResponse(client, redirectTo, error);
                } else {
                    return flash500(req, res, error);
                }
            } else {

                return res.clientAwareResponse(client, redirectTo, {
                    error: false,
                    status: true,
                    exantematica: survey.exantematica,
                    diarreica: survey.diarreica,
                    respiratoria: survey.respiratoria,
                    message: "Survey Created",
                    survey: survey
                });

            }
        });
    },
    /**
     * `SurveyController.read()`
     */
    read: function (req, res) {
        var params = {};
        if (req.param('user_id') != null) {
            params = {user: req.param('user_id')};
        } else if (req.param('survey_id') != null) {
            params = {id: req.param('survey_id')};
        } else if (req.param('app') != null) {
            params = {id: req.param('survey_id')};
        }
        Survey.find(params).exec(function (err, survey) {
            if (err) return flash500(req, res, {
                error: true,
                message: 'There was an error processing your request: \n' + err
            });
            return res.json({error: false, data: survey});
        });
    },
    getBySymptom: function (req, res) {
        var symptoms = req.param('symptoms');
        console.log('symptoms', symptoms);
        if (symptoms == null) {
            return res.status(401).send({
                error: true,
                message: 'symptoms list required.'
            });
        } else {
            var symptomsArray = symptoms.split(":");
            var symptomsQuery = {'$or': []};
            _.forEach(symptomsArray, function (arraySplited) {
                var symptoms = arraySplited.split(',');
                var condition = {}
                _.forEach(symptoms, function (symptom) {
                    condition[symptom] = "Y";
                });
                symptomsQuery['$or'].push(condition);
            });
            console.log("symptomsQuery", symptomsQuery);
            Survey.find(symptomsQuery).exec(function (err, survey) {
                if (err) return flash500(req, res, {
                    error: true,
                    message: 'There was an error processing your request: \n' + err
                });
                return res.json({error: false, data: survey});
            });
        }
    },
    getByLocation: function (req, res) {
        var lat = req.param('lat');
        var lon = req.param('lon');
        var address = req.param('q');
        var radius = req.param('radius') || 50000;
        var coord = [];
        var minDate = req.param('min');
        var maxDate = req.param('max');
        if (minDate && maxDate){
            var firstDay = new Date(minDate);
            var lastDay = new Date(maxDate);
        }else{
            var date = new Date();
            var firstDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()-2);
            var lastDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()+1);
        }
        if (lat && lon){
            var coord = [parseFloat(lon), parseFloat(lat)];
            Utils.getLocation(address, lon, lat, function (location) {
                Survey.native(function(err, collection){
                    var twoDaysAgo = new Date(moment().subtract(2, 'days'));
                    collection.aggregate([
                        {$match: { $and : [ {createdAt: {$gte: firstDay} }, {createdAt: {$lte: lastDay }}, {city: location.city }]}},
                        {$project: {user: { $ifNull: ['$user', '$household'] }, lat:1, lon:1, createdAt:1, formattedAddress:1, no_symptom:1}},
                        {$sort: { user: 1, createdAt: 1 }},
                        {
                           $group:
                             {
                               _id: "$user",
                               lastSurveyDate: { $last: "$createdAt" },
                               lat: { $last: "$lat" },
                               lon: { $last: "$lon" },
                               formattedAddress: { $last :"$formattedAddress"},
                               no_symptom: {$last: "$no_symptom"}
                             }
                        }
                    ], function(err, surveys){
                        if (err){
                            return res.serverError(err);
                        }
                        return res.json({error: false, data: surveys});
                    });
                });
            });
        }else{
            return res.notFound();
        }
    },

    getByDisease: function (req, res) {
        var id_disease = req.param('id_disease');
        var code_disease = req.param('code');
        Survey.getSurveysByDisease(id_disease, code_disease, null, null, function (result) {
            return res.json({error: false, data: result});
        });
    },
    getByWeekOf: function (req, res) {
        var week_of = req.param('week_of') || current_week_of;
        Survey.find({week_of: new Date(week_of)}).exec(function (err, survey) {
            if (err) return flash500(req, res, {
                error: true,
                message: 'There was an error processing your request: \n' + err
            });
            return res.json({error: false, data: survey});
        });
    },
    getSummary: function (req, res) {
        var params = {};
        var address = req.param('q');
        var lat = req.param('lat');
        var lon = req.param('lon');
        var minDate = req.param('min');
        var maxDate = req.param('max');
        var coord = [parseFloat(lon), parseFloat(lat)];
        if (minDate && maxDate){
            var firstDay = new Date(minDate);
            var lastDay = new Date(maxDate);
        }else{
            var date = new Date();
            var firstDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()-2);
            var lastDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()+1);
        }
        var result = {};
        Utils.getLocation(address, lon, lat, function (location) {
            var coord = [parseFloat(lon), parseFloat(lat)];
            console.log('LOCATION', location.city);
            Survey.native(function(err, collection){
                collection.find({ $and : [ {createdAt: {$gte: firstDay} }, {createdAt: {$lte: lastDay }}, {city: location.city }]}).toArray(function(err, surveys_total){
                    if (err){
                        res.serverError(err);
                    }
                    Survey.find({
                        $and : [ {createdAt: {$gte: firstDay} }, {createdAt: {$lte: lastDay }}, {city: location.city }],
                        no_symptom: "Y"
                    }).exec(function (err, surveys_no_symptoms) {
                        if (err) return flash500(req, res, {
                            error: true,
                            message: 'There was an error processing your request: \n' + err
                        });
                        SurveyService.totalSurveysByDiseaseWeekOf(location.city, current_week_of, function (data) {
                            data['location'] = location;
                            data['total_surveys'] = surveys_total.length;
                            data['total_no_symptoms'] = surveys_no_symptoms.length;
                            data['total_symptoms'] =  data['total_surveys'] - data['total_no_symptoms'];
                            return res.json({error: false, data: data});
                        });
                    });
                });
            });
        });
    },
    /**
     * `SurveyController.batch()`
     */
    batch: function (req, res) {
        var appToken = req.body.app_token;
        var diseaseCode = req.body.disease_code;
        var numSurveys = req.body.batch_ammount;
        var minDate = req.body.min_date;
        var maxDate = req.body.max_date;
        var client = req.body.client || 'api';
        var redirectTo = req.body.redirect_to || '/';
        var currentSurvey = 0;

        function single_callback(err) {
            currentSurvey++;
            surveyCallback();
        }

        function surveyCallback() {
            if (currentSurvey >= numSurveys) {
                return res.clientAwareResponse(client, redirectTo, {
                    error: false,
                    status: true,
                    message: "Batch Surveys Created"
                });
            }
        }

        for (var i = 0; i < numSurveys; i++) {
            surveyGenerator(req, res, diseaseCode, minDate, maxDate, appToken, function (err, result) {
                if (err) {
                    var error = {
                        error: true,
                        title: 'Validation Error',
                        message: 'There was an error processing your request: \n' + err
                    };
                    if (err.code == 'E_VALIDATION') {
                        return res.clientAwareResponse(client, redirectTo, error);
                    } else {
                        return flash500(req, res, error);
                    }
                } else {
                    single_callback();
                }
            });
        }
    },

    updateSyndrome: function(req, res){
        Survey.find().exec(function(err, surveys){
            for (var i = 0; i < surveys.length; i++) {
                surveys[i].save(function(err, s){
                    if (err) {throw err}
                });
            }
            return res.send('OK');
        });
    }
};
