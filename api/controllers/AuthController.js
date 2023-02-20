var bcrypt = require('bcrypt-nodejs');
var createAndSendToken = require('../services/createSendToken.js');
var flash500 = require('../services/flash500');
var flash403 = require('../services/flash403');
var passport = require('passport');
var async = require('async');
var jwt = require('jwt-simple');
var moment = require('moment');
/**
 * AuthController
 *
 * @description :: Server-side logic for managing Auths
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
    /**
     * `AuthController.loginUser()`
     */
    loginUser: function (req, res) {
        var client = req.body.client || 'api';
        var email = req.body.email;
        var password = req.body.password;
        var gcmTokem = req.body.gcm_token;
        if (!email || !password) {
            return flash403({
                message: 'email and password required'
            });
        }
        User.findOne({email:email}).populateAll().exec(function (err, foundUser) {
            if (!foundUser) {
                error = {error: true, message: 'Unrecognized E-mail'};
                return res.clientAwareResponse(client, 'user/login', error);
            }

            // if user was deleted, not logon
            if (foundUser.deleted) {
                foundUser.reactivation = true;
                foundUser.deleted = false;
            };
            if (gcmTokem){
                if (foundUser.gcmTokens == undefined) {
                    foundUser.gcmTokens = [gcmTokem];
                } else {
                    foundUser.gcmTokens = [];
                    foundUser.gcmTokens.push(gcmTokem);
                }
                foundUser.save(function(err, s){
                    if (err) throw err;
                });
            }
            if (foundUser.fb || foundUser.gl || foundUser.tw){
                req.session.authenticated = true;
                req.session.User = foundUser;
                req.session.UserKind = 'user';
                var payload = {
                    sub: foundUser.id,
                    exp: moment().add(1, 'days').unix()
                };
                foundUser.token = jwt.encode(payload, '69fce38b3f603d7ec895f7838b37c2f3#!@69fce38b3f603d7ec895f7838b37c2f3'); //TODO REPLACE INSERT_APP_SECRET WITH REAL APP SECRET
                foundUser.lastLogin = new Date();
                foundUser.deleted = false;
                foundUser.save(function(err, s){
                    if (err) throw err;
                });
                if (client == 'api') {
                    return createAndSendToken(foundUser, res);
                } else {
                    return res.redirect("/user");
                }
            }
            bcrypt.compare(password, foundUser.password, function (err, valid) {

                if (err) {
                    error = {error: true, message: 'There was an error processing your request: \n' + err};
                    return res.clientAwareResponse(client, 'user/login', error);
                }
                if (!valid) {
                    var error = {error: true, message: 'Access Denied'};
                    return res.clientAwareResponse(client, 'user/login', error);
                }
                req.session.authenticated = true;
                req.session.User = foundUser;
                req.session.UserKind = 'user';
                var payload = {
                    sub: foundUser.id,
                    exp: moment().add(1, 'days').unix()
                };
                foundUser.token = jwt.encode(payload, '69fce38b3f603d7ec895f7838b37c2f3#!@69fce38b3f603d7ec895f7838b37c2f3'); //TODO REPLACE INSERT_APP_SECRET WITH REAL APP SECRET
                foundUser.lastLogin = new Date();
                foundUser.save(function(err, s){
                    if (err) throw err;
                });
                if (client == 'api') {
                    return createAndSendToken(foundUser, res);
                } else {
                    return res.redirect("/user");
                }
            });
        });
    },
    /**
     * `AuthController.loginAdmin()`
     */

    loginAdmin: function (req, res) {
        if (req.method == 'POST') {

            var email = req.body.email;
            var password = req.body.password;
            var client = req.body.client || 'api';

            if (!email || !password) {
                error = {error: true, message: 'Email and password required'};
                return res.clientAwareResponse(client, 'admin/login', error);
            }
            async.series({
                superUser: isSuperUser,
                userAdmin: isAdmin,
                }, function(error, result){
                    var passwd;
                    var foundUser;
                    if (error) throw error;
                    if (result.superUser){
                        passwd = result.superUser.password;
                        foundUser = result.superUser.password;
                    }else {
                        passwd = result.userAdmin.password;
                        foundUser = result.userAdmin.password;
                    }
                    bcrypt.compare(password, passwd, function (err, valid) {
                        if (err) {
                            error = {error: true, message: 'There was an error processing your request: \n' + err};
                            return res.clientAwareResponse(client, 'user/login', error);
                        }
                        if (!valid) {
                            var error = {error: true, message: 'Access Denied'};
                            return res.clientAwareResponse(client, 'user/login', error);
                        }
                    });
                    req.session.authenticated = true;
                    req.session.User = foundUser;
                    req.session.UserKind = 'admin';
                    if (client == 'api') {
                        return createAndSendToken(foundUser, res);
                    } else {
                        return res. redirect("/user");
                    }
            });
            function isSuperUser(callback){
                Admin.findOneByEmail(email).populateAll().exec(function (err, foundUser) {
                    callback(null, foundUser);
                });
            }
            function isAdmin(callback){
                User.findOne({email: email, isAdmin: true}).populateAll().exec(function (err, foundUser) {
                    callback(null, foundUser);
                });
            }
        } else {
            return res.view('admin/login', {error: false});
        }
    },

    /**
     * `AuthController.logout()`
     */
    logout: function (req, res) {
        req.session.destroy();
        return res.redirect('/');
    },

    loginFacebook: function (req, res, next) {
        passport.authenticate('facebook', {scope: ['email']},
            function (err, user) {
                req.logIn(user, function (err) {
                    if (err) {
                        console.log(err);
                        req.view('500');
                        return;
                    }
                    res.redirect('/');
                    return;
                });
            })(req, res, next);
    },

    facebookCallback: function (req, res, next) {
        passport.authenticate('facebook-token',
            function (err, user) {
                if (user) {
                    User.findOneByEmail(user.email).populateAll().exec(function (err, foundUser) {
                        if (!foundUser) {
                            error = {error: true, message: 'Unrecognized E-mail'};
                            return res.clientAwareResponse(client, 'user/login', error);
                        }
                        req.session.authenticated = true;
                        req.session.User = foundUser;
                        req.session.UserKind = 'user';
                        return createAndSendToken(foundUser, res);
                    });
                } else {
                    return res.json({error: true, message: 'Usuário não encontrado.'});
                }
            })(req, res, next);
    },

    twitterCallback: function (req, res, next) {
        passport.authenticate('twitter-token',
            function (err, user, info) {
                console.log('user', user);
                if (user) {
                    req.session.authenticated = true;
                    req.session.User = user;
                    req.session.UserKind = 'user';
                    return createAndSendToken(user, res);
                } else {
                    return res.json({error: true, message: 'Usuário não encontrado.'});
                }
            })(req, res, next);
    },

    googleCallback: function (req, res, next) {
        passport.authenticate('google-plus-token',
            function (err, user, info) {
                if (user) {
                    req.session.authenticated = true;
                    req.session.User = user;
                    req.session.UserKind = 'user';
                    return createAndSendToken(user, res);
                } else {
                    return res.json({error: true, message: 'Usuário não encontrado.'});
                }
            })(req, res, next);
    },

};
