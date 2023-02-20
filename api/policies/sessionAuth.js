var findUserByToken = require('../services/findUserByToken');
var findAdminByToken = require('../services/findAdminByToken');
var flash403 = require('../services/flash403');
/**
 * sessionAuth
 *
 * @module      :: Policy
 * @description :: Simple policy to allow any authenticated user
 *                 Assumes that your login action in one of your controllers sets `req.session.authenticated = true;`
 * @docs        :: http://sailsjs.org/#!/documentation/concepts/Policies
 *
 */
module.exports = function (req, res, next) {
    // User is allowed, proceed to the next policy,
    // or if this is the last policy, the controller
    if (req.session.authenticated) {
        return next();
    } else {
        if (req.headers['user_token'] != null || req.headers['admin_token'] != null) {
            var user_token = req.headers['user_token'] || req.headers['admin_token'];
            if (user_token == req.headers['user_token']) {
                findUserByToken(user_token, function (result) {
                    if (result) {
                        req.session.authenticated = true;
                        req.session.User = result;
                        req.session.UserKind = 'user';
                        return next();
                    } else {
                        return flash403(req, res, {error: true, message: 'invalid user_token : sessionAuth'});
                    }
                });
            } else {
                console.log("request is from admin");
                findAdminByToken(user_token, function (result) {
                    if (result) {                        
                        req.session.authenticated = true;
                        req.session.User = result;
                        req.session.UserKind = 'admin';
                        return next();
                    } else {
                        return flash403(req, res, {error: true, message: 'invalid admin_token : sessionAuth'});
                    }
                });
            }
        } else {
            // User is not allowed
            //console.log('User is not allowed');
            var client = req.param('client') || 'dashboard';
            if (req.xhr) {
                return flash403(req, res, {error: true, message: 'Not Authorized : sessionAuth'});
            } else {
                var error = {error: true, message: 'Access Denied : sessionAuth'};
                console.log("URL", req.url);
                if (req.url.indexOf('user') >= 0) {
                    return res.clientAwareResponse(client, 'user/login', error);
                } else {
                    return res.clientAwareResponse(client, 'admin/login', error);
                }
            }
        }
    }
};
