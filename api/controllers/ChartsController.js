/**
 * ChartsController
 *
 * @description :: Server-side logic for managing charts
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var Utils = require('../services/utils');
var current_week_of = Utils.getWeekOf();
var async = require('async');
var moment = require('moment');
var _ = require('underscore');
var rageOne = moment().subtract(15, 'days');
var Utils = require('../services/utils');
var SurveyService = require('../services/surveyService');
var clusterMaker = require('clusters');

var date = new Date();
var firstMonthDay = new Date(date.getFullYear(), date.getMonth(), 1);
var lastMonthDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
var delta = new Date(2016, 2, 28);

module.exports = {
	home: function(req, res){

		async.series({
		    user: function(callback){
					User.count({createdAt: {$gt: delta }}).exec(function(err, docsUsers){
						callback(null, docsUsers);
					});
			    },
			  households: function(callback){
			        Household.count({createdAt: {$gt: delta }}).exec(function(err, docsUsers){
						callback(null, docsUsers);
					});
			  },
		    platforms: function(callback){
    			Survey.native(function(err, collection){
					collection.aggregate([
							{
								$match:
									{
										createdAt:{$gt: delta}
									}
							},
						{
							$group: {
								_id: "$platform", count: { $sum: 1 }
							}
						}
					], function(err, result){
						callback(null, result);
					});
				});
		    },
		    asymptomatic: function(callback){
    			Survey.native(function(err, collection){
    				collection.aggregate([
						{$match:
							{$and: [{no_symptom: "Y"}, {createdAt:{$gt: delta}}]}
						},
						{
							$group: {

								_id: "$week_of",
								total: {$sum: 1}
							}
						}
					], function(err, result){
						callback(null, result);
					});
				});
		    },
		    symptomatic: function(callback){
		    	Survey.native(function(err, collection){
    				collection.aggregate([
							{
								$match:{
									$and:
									[
										{no_symptom: "N"}, {createdAt:{$gt: delta}}
									]
								}
							},
							{
								$group: {
									_id: "$week_of",
									total: {$sum: 1}
								}
							}
					], function(err, result){
						callback(null, result);
					});
				});
		    },
		    womenByRace: function(callback){
		    	User.native(function(err, collection){
					collection.aggregate([
						{
								$match:{
									$and:
									[
										{gender: "F"}, {createdAt:{$gt: delta}}
									]
							}
						},
						{ "$group": {
					        "_id": {
					            "state": "$state",
					            "race": "$race"
					        },
					        "stateCount": { "$sum": 1 }
					    }},
					    { "$group": {
					        "_id": "$_id.state",
					        "races": {
					            "$push": {
					                "race": "$_id.race",
					                "total": "$stateCount"
					            },
					        },
					        "total": { "$sum": "$stateCount" }
					    }},
					], function(err, result){
						callback(null, result);
					});
				});
		    },
		    menByRace: function(callback){
		    	User.native(function(err, collection){
					collection.aggregate([
						{
								$match:{
									$and:
									[
										{gender: "M"}, {createdAt:{$gt: delta}}
									]
							}
						},
					    { "$group": {
					        "_id": {
					            "state": "$state",
					            "race": "$race"
					        },
					        "stateCount": { "$sum": 1 }
					    }},
					    { "$group": {
					        "_id": "$_id.state",
					        "races": {
					            "$push": {
					                "race": "$_id.race",
					                "total": "$stateCount"
					            },
					        },
					        "total": { "$sum": "$stateCount" }
					    }},
					], function(err, result){
						callback(null, result);
					});
				});
		    },
		    usersByState: function(callback){
		    	User.native(function(err, collection){
					collection.aggregate([
						{
								$match:{createdAt:{$gt: delta}}
						},
						{
							$group: {
								_id: "$state", count: { $sum: 1 }
							}
						}
					], function(err, result){
						callback(null, result);
					});
				});
		    },
		    menByAge: function(callback){
		    	User.native(function(err, collection){
		    		collection.aggregate([
							{
									$match:{
										$and:
										[
											{gender: "M"}, {createdAt:{$gt: delta}}
										]
								}
							},
						{
					        $group: {
					            _id: {
					                state: "$state",
					                ageGroup: "$ageGroup"
					            },
					            "stateCount": { "$sum": 1 }
					        }
					    },
					    {
					        $group: {
					            _id: "$_id.state",
					            groups: {
					                $push:{
					                    ageGroup: "$_id.ageGroup",
					                    total: "$stateCount"
					                }
					            }
					        }
					    }
		    		], function(err, result){
		    			callback(null, result);
		    		});
		    	});
		    },
		    womenByAge: function(callback){
		    	User.native(function(err, collection){
		    		collection.aggregate([
							{
									$match:{
										$and:
										[
											{gender: "F"}, {createdAt:{$gt: delta}}
										]
								}
							},
						{
					        $group: {
					            _id: {
					                state: "$state",
					                ageGroup: "$ageGroup"
					            },
					            "stateCount": { "$sum": 1 }
					        }
					    },
					    {
					        $group: {
					            _id: "$_id.state",
					            groups: {
					                $push:{
					                    ageGroup: "$_id.ageGroup",
					                    total: "$stateCount"
					                }
					            }
					        }
					    }
		    		], function(err, result){
		    			callback(null, result);
		    		});
		    	});
		    },
		    newRegisters: function(callback){
		    	var json = {};
		    	User.count({createdAt: { $gte: new Date(current_week_of)}}).exec(function(err, docsUsersLastWeek){
						callback(null, docsUsersLastWeek);
					});
		    },
		    lastWeekRegisters: function(callback){
		    	User.count({createdAt: {$gte: new Date(rageOne.format('YYYY-MM-DD')), $lte: new Date(current_week_of) }}).exec(function(err, docsUsersLastWeek){
						callback(null, docsUsersLastWeek);
					});
		    },
		    deletedRegisters: function(callback){
					User.count({
						$and:[
								{updatedAt: {$gte: new Date(current_week_of)}},
								{deleted:true}
						]
					}).exec(function(err, deletedRegisters){
						callback(null, deletedRegisters);
					});
		    },
		    lasWeekdeleted: function(callback){
					User.count(
							{
								$and:[
									{updatedAt: {$gte: new Date(rageOne.format('YYYY-MM-DD')), $lt: new Date(current_week_of) }},
									{deleted:true}
								]
							}
						).exec(function(err, lasWeekdeletedDocs){
						callback(null, lasWeekdeletedDocs);
					});
		    },
		    menByAgeFunded: function(callback){
		    	User.native(function(err, collection){
		    		collection.aggregate([
							{
									$match:{
										$and:
										[
											{gender: "M"}, {createdAt:{$gt: delta}}
										]
								}
							},
							{
					        $group: {
					            _id: {
					                ageGroup: "$ageGroup"
					            },
					            "total": { "$sum": 1 }
					        }
					    }
		    		], function(err, result){
		    			callback(null, result);
		    		});
		    	});
		    },
		    womenByAgeFunded: function(callback){
		    	User.native(function(err, collection){
		    		collection.aggregate([
							{
									$match:{
										$and:
										[
											{gender: "F"}, {createdAt:{$gt: delta}}
										]
								}
							},
							{
					        $group: {
					            _id: {
					                ageGroup: "$ageGroup"
					            },
					            "total": { "$sum": 1 }
					        }
					    }
		    		], function(err, result){
		    			callback(null, result);
		    		});
		    	});
		    },
		    byRaceFunded: function(callback){
		    	User.native(function(err, collection){
		    		collection.aggregate([
							{
									$match:{ createdAt:{$gt: delta}}
							},
							{
					        $group: {
					            _id: {
					                race: "$race",
					                gender: "$gender"
					            },
					            "raceTotal": { "$sum": 1 }
					        }
					    },
					    {
					        $group: {
					            _id: "$_id.gender",
					            races: {
					                $push:{
					                    race: "$_id.race",
					                    total: "$raceTotal"
					                }
					            }
					        }
					    }
		    		], function(err, result){
		    			callback(null, result);
		    		});
		    	});
		    }
		},
		function(err, results) {
		    return res.json(results);
		});
	},

	getPins: function (req, res) {
        var lat = req.param('lat');
        var lon = req.param('lon');
        var address = req.param('q');
        var radius = req.param('radius') || 50000;
        var coord = [];
        var month = req.param('month');
        var weekOf = req.param('week_of');
        var minDate = req.param('min');
        var maxDate = req.param('max');
        if (month){
            var date = new Date(month);
            var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
            var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        }else if (weekOf){
            var firstDay = new Date(moment().day(1).format('YYYY-MM-DD'));
            var lastDay = new Date(moment().day(7).format('YYYY-MM-DD'));
        }else if (minDate && maxDate){
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
                    collection.aggregate([
                        {$match: { $and : [ {createdAt: {$gte: firstDay}} , {createdAt: {$lte: lastDay }}, {city: location.city }]}},
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

	summary: function (req, res) {
        var params = {};
        var address = req.param('q');
        var lat = req.param('lat');
        var lon = req.param('lon');
        var month = req.param('month');
        var weekOf = req.param('week_of');
        var minDate = req.param('min');
        var maxDate = req.param('max');
        if (month){
            var date = new Date(month);
            var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
            var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        }else if (weekOf){
            var firstDay = new Date(moment().day(1).format('YYYY-MM-DD'));
            var lastDay = new Date(moment().day(7).format('YYYY-MM-DD'));
        }else if (minDate && maxDate){
            var firstDay = new Date(minDate);
            var lastDay = new Date(maxDate);
        }else{
            var date = new Date();
            var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
            var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        }
        var result = {};
        Utils.getLocation(address, lon, lat, function (location) {
            var coord = [parseFloat(lon), parseFloat(lat)];
            Survey.native(function(err, collection){
                collection.find({ $and : [ {createdAt: {$gte: firstDay}} , {createdAt: {$lte: lastDay }}, {city: location.city }]}
                    ).toArray(function(err, surveys_total){
                    if (err){
                        res.serverError(err);
                    }
                    Survey.find({
                    	$and : [ {createdAt: {$gte: firstDay} , createdAt: {$lte: lastDay }}],
                    	city: location.city,
                        no_symptom: "Y"
                    }).exec(function (err, surveys_no_symptoms) {
                        if (err) return flash500(req, res, {
                            error: true,
                            message: 'There was an error processing your request: \n' + err
                        });
                        SurveyService.totalSurveysByDisease(location.city, firstDay, lastDay, function (data) {
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

    syndromeClusters: function(req, res){
		var params = {};
        var address = req.param('q');
        var lat = req.param('lat');
        var lon = req.param('lon');
        var month = req.param('month');
        var weekOf = req.param('week_of');
        var minDate = req.param('min');
        var maxDate = req.param('max');
        var coord = [parseFloat(lon), parseFloat(lat)];
        if (month){
            var date = new Date(month);
            var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
            var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        }else if (weekOf){
            var firstDay = new Date(moment().day(1).format('YYYY-MM-DD'));
            var lastDay = new Date(moment().day(7).format('YYYY-MM-DD'));
        }else if (minDate && maxDate){
            var firstDay = new Date(minDate);
            var lastDay = new Date(maxDate);
        }else{
            var date = new Date();
            var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
            var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        }
        async.series({
        	exantematica:function(callback){
        		Utils.getLocation(address, lon, lat, function (location) {
	            var coord = [parseFloat(lon), parseFloat(lat)];
	            console.log('firstDay', firstDay);
	            console.log('lastDay', lastDay);
	            Survey.native(function(err, collection){
	            	var query = {
									geolocation: {
										$near:{
											$geometry:{
												type:"Point", coordinates:[lon, lat]},
						            $maxDistance: 30000
										}
									},
									$and : [{createdAt: {$gte: firstDay} }, {createdAt: {$lte: lastDay }}, {city: location.city }, {exantematica:true}]
								};
	            	var exanResult = {}
		                collection.find(
		                	query
		                    ).toArray(function(err, exantematicas){
		                    	console.log('Exantematicas', exantematicas);
		                    if (err){
		                        res.serverError(err);
		                    }
		                    exanResult.surveys = exantematicas;
		                    exanResult.cluster = exantematicas.length;
		                    callback(null, exanResult);
	                	});
	            	});
        		});
        	},
        	diarreica:function(callback){
        		Utils.getLocation(address, lon, lat, function (location) {
	            var coord = [parseFloat(lon), parseFloat(lat)];
	            Survey.native(function(err, collection){
	            		var diaResult = {};
		                collection.find({ $and : [ {createdAt: {$gte: firstDay} }, {createdAt: {$lte: lastDay }}, {city: location.city }, {diarreica:true}]}
		                    ).toArray(function(err, diarreicas){
		                    if (err){
		                        res.serverError(err);
		                    }
		                    diaResult.surveys = diarreicas;
		                    diaResult.cluster = diarreicas.length;
		                    callback(null, diaResult);
	                	});
	            	});
        		});
        	},
        	respiratoria:function(callback){
        		Utils.getLocation(address, lon, lat, function (location) {
	            var coord = [parseFloat(lon), parseFloat(lat)];
	            Survey.native(function(err, collection){
	            		var resResult = {}
		                collection.find({ $and : [ {createdAt: {$gte: firstDay} }, {createdAt: {$lte: lastDay }}, {city: location.city }, {respiratoria:true}]}
		                    ).toArray(function(err, respiratorias){
		                    if (err){
		                        res.serverError(err);
		                    }
		                    resResult.surveys = respiratorias;
		                    resResult.cluster = respiratorias.length;
		                    callback(null, resResult);
	                	});
	            	});
        		});
        	},

        },function(err, result){
        	return res.json(result);
        });
    },
		kmeans: function(req, res){
			var minDate = req.param('min');
			var maxDate = req.param('max');
			var lat = Number(req.param('lat'));
			var lon = Number(req.param('lon'));
			var month = req.param('month');
			var coord = [parseFloat(lon), parseFloat(lat)];
			if (month){
					var date = new Date(month);
					var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
					var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
			}else if (minDate && maxDate){
					var firstDay = new Date(minDate);
					var lastDay = new Date(maxDate);
			}else{
					var date = new Date();
					var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
					var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
			}
			clusterMaker.k(1);
			clusterMaker.iterations(750);
			async.series({
				exantematicas: function(callback){
					var coordinates = [];
					var query = {
						$and : [{createdAt: {$gte: firstDay} }, {createdAt: {$lte: lastDay }}, {exantematica:true}],
						coordinates: {
							$near:{
								$geometry:{
									type:"Point", coordinates:[lon, lat]},
									$maxDistance: 30000
							}
						}
					};
					Survey.find(query,{select:['coordinates']}).exec(function(err, docs){
						for (var i = 0; i < docs.length; i++) {
							coordinates.push(docs[i].coordinates);
						}
						if (coordinates.length > 0){
							clusterMaker.data(coordinates);
							callback(null, clusterMaker.clusters());
						}else{
							callback(null, []);
						}
					});
				},
				diarreicas: function(callback){
					var coordinates = [];
					var query = {
						$and : [{createdAt: {$gte: firstDay} }, {createdAt: {$lte: lastDay }}, {diarreica:true}],
						coordinates: {
							$near:{
								$geometry:{
									type:"Point", coordinates:[lon, lat]},
									$maxDistance: 30000
							}
						}
					};
					Survey.find(query,{select:['coordinates']}).exec(function(err, docs){
						for (var i = 0; i < docs.length; i++) {
							coordinates.push(docs[i].coordinates);
						}
						if (coordinates.length > 0){
							clusterMaker.data(coordinates);
							callback(null, clusterMaker.clusters());
						}else{
							callback(null, []);
						}
					});
				},
				respiratorias: function(callback){
					var coordinates = [];
					var query = {
						$and : [{createdAt: {$gte: firstDay} }, {createdAt: {$lte: lastDay }}, {respiratoria:true}],
						coordinates: {
							$near:{
								$geometry:{
									type:"Point", coordinates:[lon, lat]},
									$maxDistance: 30000
							}
						}
					};
					Survey.find(query,{select:['coordinates']}).exec(function(err, docs){
						for (var i = 0; i < docs.length; i++) {
							coordinates.push(docs[i].coordinates);
						}
						if (coordinates.length > 0){
							clusterMaker.data(coordinates);
							callback(null, clusterMaker.clusters());
						}else{
							callback(null, []);
						}
					});
				}
			}, function(err, result){
				return res.json(result);
			});
		}
};
