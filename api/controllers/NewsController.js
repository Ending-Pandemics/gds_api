var twitter = require('../services/twitterClient');

module.exports = {

    get: function (req, res) {
        twitter.getClient(function (client) {
            client.get('search/tweets', {q: '%23+from:minsaude'}, function (error, tweets, response) {
                return res.json({error: error, data: tweets});
            });
        });
        // User.findOne(req.session.User.id).populateAll().exec(function (err, user) {
        //            if (err) {
        //                return flash500(req, res, {
        //                    error: true,
        //                    message: 'There was an error processing your request: \n' + err
        //                });
        //            }
        //            hashtags_list = [];
        //            _.forEach(user.hashtags, function (hashtag) {
        //                hashtags_list.push(hashtag.name);
        //            });
        //            if (hashtags_list.length){
        //            	var params = {q: '%23'+ hashtags_list.join('+OR+') +'+from:minsaude'};
        //            }else{
        //            	var params = {q: '%23+from:minsaude'};
        //            }
        //            twitter.getClient(function(client){
        //                client.get('search/tweets', {q: '%23+from:minsaude'}, function(error, tweets, response){
        //                    return res.json({error: error, data: tweets});
        //                });
        //            });

        //    });

    },

    listHashtags: function (req, res) {
        Hashtag.find().exec(function (err, hashtags) {
            if (err) return flash500(req, res, {
                error: true,
                message: 'There was an error processing your request: \n' + err
            });
            return res.json({error: false, data: hashtags});
        });
    },

    createHashtags: function (req, res) {
        Hashtag.create({name: req.body.name, code: req.body.code}).exec(function (err, hashtag) {
            if (err) {
                var error = {
                    error: true,
                    title: 'Validation Error',
                    message: 'There was an error processing your request: \n' + err
                };
                return flash500(req, res, error);
            }
            return res.json({error: false, data: hashtag});
        });
    }
}