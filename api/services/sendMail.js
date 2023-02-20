var path = require('path');

var init = function () {
    return {
        service: 'SES',
        // auth: {
        //   user: 'AKIAJPGJSC2Y3AWPPO5A',
        //   pass: 'Ao0ebjIlhF4rlrwPu3OK+FuYzH2G8ei1wp4TrG7QbT1K'
        // },
        transporter: {
            host: 'email-smtp.us-east-1.amazonaws.com',
            port: 465,
            secure: true,
            auth: {
                user: "AKIAJMQBDXC76EE3NVBQ",
                pass: "Aje5LVXY40XoH9fG7P3gz7qmXvtb9NCu7YZW7tecJq6A"
            }
        },
        templateDir: path.resolve(sails.config.appPath, 'views/emailTemplates'),
        from: 'contato@guardioesdasaude.org',
        // alwaysSendTo: 'contato@guardioesdasaude.org',
        testMode: true
    };
}

module.exports = {
    logErrorService: function (email, subject, message, cb) {
        //sails.config.email = init();
        sails.hooks.email.send(
            "logError",
            {
                from: email,
                text: message,
            },
            {
                to: "contato@guardioesdasaude.org",
                subject: "[GDS - Mobile] " + subject
            },
            function (err) {
                console.log('EMAIL ERROR logErrorService', err);
                cb(err || false);
            }
        )
    },

    sendMailContact: function (email, subject, message, cb) {
        //sails.config.email = init();
        sails.hooks.email.send(
            "contactMail",
            {
                from: email,
                text: message,
            },
            {
                to: "contato@guardioesdasaude.org",
                subject: "[GDS - Contato] " + subject
            },
            function (err) {
                sails.log.info('EMAIL ERROR sendMailContact', err);
                cb(err || false);
            }
        )
    },

    sendMailForgotPassword: function (email, hash, lang, cb) {
        var subject = {
          'en': '[GDS] – Forgot the password',
          'pt_BR': '[GDS] - Esqueci minha senha',
          'fr': '[GDS] - Esqueci minha senha',
          'es': '[GDS] - Ha olvidado la contraseña',
          'ar': 'نسيت كلمة المرور',
          'ch': '[GDS] - 忘记密码',
          'fr': '[GDS] - Vous avez oublié le mot de passe',
          'ru': '[GDS] - Забыл пароль'
        }
        sails.hooks.email.send(
            "forgotMail",
            {
                lang: lang,
                hash: hash
            },
            {
                to: email,
                subject: subject[lang]
            },
            function (err) {
                sails.log.info('EMAIL ERROR sendMailForgotPassword', err);
                cb(err || false);
            }
        )
    },
    sendAdminInvite: function (email, hash, cb) {
        sails.hooks.email.send(
            "adminInvite",
            {
                hash: hash,
            },
            {
                to: email,
                subject: "[GDS] - Convite para o dashboard"
            },
            function (err) {
                sails.log.info('EMAIL ERROR sendAdminInvite', err);
                cb(err || false);
            }
        )
    },
    sendPushReport: function (emailContext, cb) {
        sails.hooks.email.send(
            "pushBoard",
            {
                response: emailContext.response,
                platform: emailContext.platform,
                total: emailContext.total,
                content: emailContext.content
            },
            {
                to: sails.config.boardMailing,
                subject: "[GDS] - Push report"
            },
            function (err) {
                sails.log.info('EMAIL ERROR sendPushReport', err);
                cb(err || false);
            }
        )
    }

}
