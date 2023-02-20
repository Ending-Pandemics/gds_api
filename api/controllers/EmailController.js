var flash500 = require('../services/flash500');
var email = require('../services/sendMail');

module.exports = {

    logError: function (req, res) {
        var data = req.body;
        console.log('data EMAIL', data);
        if (data.title && data.text) {
            var user_email = null;
            if (req.session.User) {
                user_email = req.session.User.email
            }else{
                user_email = data.email;
            }
            console.log('email', user_email);
            email.logErrorService(user_email, data.title, data.text, function (result) {
                var response = {error: false};
                if (result) {
                    response.error = true;
                    response.data = result;
                }
                return res.json(response);
            });
        } else {
            return res.json({error: true, data: 'title or text is missing'});
        }
    },

    contact: function (req, res) {
        var data = req.body;
        if (data.email && data.subject && data.message) {
            email.sendMailContact(data.email, data.subject, data.message, function (result) {
                var response = {error: false, message: 'Mensagem enviada com sucesso!'};
                if (result) {
                    response.error = true;
                    response.message = result;
                }
                return res.json(response);
            });
        } else {
            return res.json({error: true, message: 'fields is obrigatory'});
        }
    }

}
