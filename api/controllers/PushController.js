/**
 * PushController
 *
 * @description :: Server-side logic for managing pushes
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var sendMail = require('../services/sendMail');
var gcm = require('node-gcm');

module.exports = {
	sendPush : function(req, res) {
		var token = req.body.gcm_token;
		var platform = req.body.platform;
		var title = req.body.title;
		var message = req.body.message;
		var registrationTokens = [];
		var query = {platform: platform};
		var sender = new gcm.Sender('AIzaSyDPVnLM8mqTGc-yrvZgQ7o360qAnGyo9YU');

		if (req.body.query){
			query = req.body.query;
		};
		var message = new gcm.Message({
			    priority: 'high',
			    contentAvailable: true,
			    delayWhileIdle: true,
			    timeToLive: 3,
			    // dryRun: true uncomment this line for tests,
			    notification: {
			        title: title,
			        body: message
			    }
		});
		User.find(query).populateAll().exec(function(error, docs){
			for (var i=0; i < docs.length ; i++){
				if (docs[i].gcmTokens){
					registrationTokens.push(docs[i].gcmToken[i]);
				}
			}
			if (registrationTokens.length > 0){
				sender.send(message, { registrationTokens: registrationTokens }, function (err, response) {
					if(err){
						return res.json({'error': error});
					} else {
						var emailContext  = {response: response, platform: platform, total: docs.length, content: {title: title, message: message}};
						sendMail.sendPushReport(emailContext, function (result) {
                var response = {error: false, message: 'Mensagem enviada com sucesso!'};
                if (result) {
                    response.error = true;
                    response.message = result;
                }
            });
						return res.json({'response': response});
					}
				});
			}else{
				return res.json({'response': "Users not found platform "+platform});
			}
		});
	}
};
