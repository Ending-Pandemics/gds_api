var flash500 = require('../services/flash500');
var sendMail = require('../services/sendMail');
var findAdminByToken = require('../services/findAdminByToken');
/**
 * AdminController
 *
 * @description :: Server-side logic for managing platform Admins
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */


module.exports = {
    /**
     * `AdminController.create()`
     */
    create: function (req, res) {
        var client = req.body.client || 'api';
        delete req.body.client;
        var admin = req.body;
        Admin.create(admin).exec(function createCB(err, b) {
            if (err) {
                return flash500(req, res, {
                    error: true,
                    message: 'There was an error processing your request: \n' + err
                });
            } else {
                return res.clientAwareResponse(client, '/admin', {
                    error: false,
                    status: true,
                    message: "User Created",
                    user: b
                });
            }
        });
    },
    read: function (req, res) {
        var params = {};
        if (req.param('email') != null) {
            params = {email: req.param('email')};
        } else if (req.param('admin_id') != null) {
            params = {id: req.param('admin_id')};
        }
        Admin.find(params).populateAll().exec(function (err, user) {
            if (err) return flash500(req, res, {
                error: true,
                message: 'There was an error processing your request: \n' + err
            });
            return res.json({error: false, data: user});
        });
    },
    /**
     * `AdminController.list()`
     */
    list: function (req, res) {
        Admin.find({}).exec(function (err, users) {
            if (err) return flash500(req, res, {
                error: true,
                message: 'There was an error processing your request: \n' + err
            });
            return res.json({error: false, data: users});
        });
    },
    /**
     * `AdminController.update()`
     */
    update: function (req, res) {
        var client = req.body.client || 'api';
        delete req.body.client;
        var admin = req.body;
        Admin.update({
            id: admin.id
        }, admin).exec(function afterwards(err, upb) {
            if (err) {
                return flash500(req, res, {
                    error: true,
                    message: 'There was an error processing your request: \n' + err
                });
            }
            return res.clientAwareResponse(client, '/admin', {
                error: false,
                status: true,
                message: "User Updated",
                user: upb
            });
        });
    },
    edit: function (req, res) {
        var admin_id = req.param("admin_id");
        Admin.findOne(admin_id).exec(function (err, user) {
            if (err) return flash500(req, res, {
                error: true,
                message: 'There was an error processing your request: \n' + err
            });
            return res.view('admin/admin_edit', {
                user: user,
                error: false,
                page: 'admin_edit'
            });
        });
    },
    /**
     * `AdminController.index()`
     */
    index: function (req, res) {
        Admin.find({}).limit(10).exec(function (err, users) {
            if (err) return flash500(req, res, {
                error: true,
                message: 'There was an error processing your request: \n' + err
            });
            return res.view('admin/admin_index', {
                users: users,
                error: false,
                page: 'admin_index'
            });
        });
    },
    delete: function (req, res) {
        var admin_id = req.param("admin_id");
        var client = req.param("client") || 'dashboard';
        Admin.destroy({
            id: admin_id
        }).exec(function (err, users) {
            if (err) {
                return flash500(req, res, {
                    error: true,
                    message: 'There was an error processing your request: \n' + err
                });
            } else {
                return res.clientAwareResponse(client, '/admin', {status: true, message: "User Deleted"});
            }
        });
    },
    /**
     * `AdminController.login()`
     */
    login: function (req, res) {
        return res.view('admin/login', {page: 'admin_login'});
    },

    inviteAsAdmin: function(req, res){
        var email = req.param("email");
        findAdminByToken(req.headers['user_token'], function (result) {
            if (result) {
                User.update({email: email}, {isAdmin:true});
                sendMail.sendAdminInvite(email, hash, function (result) {
                    console.log('RESULT OF EMAIL inviteAsAdmin controller');
                    var response = {error: false, message: 'Mensagem enviada com sucesso!'};
                    if (result) {
                        response.error = true;
                        response.message = result;
                    }
                    return res.json(response);
                });
            } else {
                return res.json(errorResponse);
            }
        });
    },

    changeUserRole: function(req, res){
        var email = req.param("userId");
        var adminId = req.param("adminId");
        // checar se o usuario está o loga e se o adminID exite nobanco de admins
        findAdminByToken(req.headers['user_token'], function (result) {
            if (result) {
                User.update({email: email}, {isAdmin:true});
                response.error = true;
                response.message = result;
                return res.json(response);
            } else {
                return res.json(errorResponse);
            }
        });
    }
};

