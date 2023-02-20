/**
 * GameController
 *
 * @description :: Server-side logic for managing games
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var _ = require('underscore');
var async = require('async');
var findUserByToken = require('../services/findUserByToken');
var countries = require('../../var/olympicsCountries.json');

module.exports = {
	getQuestions: function(req, res){
		var lang = req.query.lang;
		findUserByToken(req.headers['user_token'], function (result) {
			var query = {'lang': lang};
			if (result.questions){
					query = { "$and": [ { 'lang': lang }, { 'id' : {"$nin": result.questions } }]};
			}
			var queryQuestion = Question.find(query);
			queryQuestion.exec(function(err, docs){
				if (err) throw err;
				var	questionsShuffle = _.shuffle(docs);
				var questions = _.map(questionsShuffle.slice(0,9), function(question){
					var q = {
						"title": question.title,
						"alternatives": _.shuffle(question.alternatives),
						"lang": question.lang,
						"id": question.id
					}
					return q
					}
				)
				return res.json(questions);
			});
		});
	},


	ranking: function(req, res){
		var platform = req.query.platform || "web";
		var queryRanking = Ranking.find({select:['country']});
		queryRanking.sort('level DESC');
		queryRanking.sort('secondsBetweenDates ASC');

		queryRanking.exec(function(err, docs){
				if (err) throw err;
				var ranking = _.map(docs, function(ranking){
					var q = {
						"country": ranking.country,
						"flag": countries[ranking.country],
						"flagURL": "https://s3.amazonaws.com/olympicsflags/"+countries[ranking.country]+".png",
					}
					return q
				});
				return res.json(ranking);
		});
	},

	answer: function(req, res){
	var userLevel = req.body.level;
	var userAnswers = req.body.puzzleMatriz;
	var questionId = req.body.questionId;
	var userXP = req.body.xp;
	var userAttemps = req.body.userAttemps;
	async.waterfall([
			getUser,
			getLevel,
			toRank,
			], function (err, result) {
					res.json(result);
			});

		function getUser(callback){
			findUserByToken(req.headers['user_token'], function (result) {
					if (result) {
							User.findOne({'id':result.id}).exec(function(err, userDoc){
								userDoc.level = userLevel;
								userDoc.answers = userAnswers;
								userDoc.xp = userXP;
								userDoc.userAttemps = userAttemps;
								if (userDoc.questions){
									userDoc.questions.push(questionId);
								}else{
									userDoc.questions = [questionId];
								}
								userDoc.save(function(err, s){
									if (err) throw err;
									callback(null, userDoc);
								});
							})
					} else {
							callback(null, null);
					}
			});
		}

		function getLevel(user, callback) {
			// get level
			var queryUsers = User.find({level: {'$gte': 0}});
			queryUsers.sort('level DESC');
			queryUsers.limit(1);
			queryUsers.exec(function(err, docs){
				callback(null, user.country, docs[0].level);
			});
    }

		function toRank(country, level, callback){
			var criteria = { country: country };
			Ranking.findOne(criteria).exec(function(err, doc){
				if (!doc){
					var rankingObj = {
						'country': country,
						'level': level,
						'secondsBetweenDates': getSeconds(new Date(), new Date()),
					}
					Ranking.create(rankingObj).exec(function(err, rs){
							if (err) throw err;
							callback(null, rankingObj);
					});
				}else{
					Ranking.findOne(criteria).exec(function(err, ranking){
						ranking.level = level;
						ranking.secondsBetweenDates = getSeconds(ranking.createdAt, new Date());
						ranking.save(function(err,s){
							if (err) throw err;
							callback(null, ranking);
						});
					});
				}
			});
		}

		function getSeconds(d1, d2){
			var dif = d1.getTime() - d2.getTime();
			var difSeconds = dif / 1000;
			var secondsBetweenDates = Math.abs(difSeconds);
			return secondsBetweenDates
		}

	}
};
