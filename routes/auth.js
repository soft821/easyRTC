// Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license. See LICENSE.txt in the project root for license information.
var express = require('express');
var router = express.Router();
var User = require('../models/user');
var bcrypt = require('bcrypt');

router.get('/signin', sessionChecker, async function(req, res, next) {
  let parms = { title: 'Home', active: { home: true } };
  parms.errMsg = req.session.errMsg;
  req.session.errMsg = null; // resets session variable
  res.render('signin', parms);
});

router.post('/signin', async function(req, res, next) {
    var email = req.body.email,
        password = req.body.password;
        console.log(email);

    User.findOne({ where: { email: email } }).then(function (user) {
        console.log(user);
        if (!user) {
            req.session.errMsg = "User email not found!";
            res.redirect('/auth/signin');
        } else if (!bcrypt.compareSync(password, user.password)) {
            req.session.errMsg = "Invalid passowrd!";
            res.redirect('/auth/signin');
        } else {
            req.session.user = user.dataValues;
            res.redirect('/');
        }
    });
});

router.get('/signup', sessionChecker, async function(req, res, next) {
  let parms = { title: 'Home', active: { home: true } };
  parms.errMsg = req.session.errMsg;
  req.session.errMsg = null; // resets session variable
  res.render('signup1', parms);
});

router.post('/signup', async function(req, res, next) {
    var username = req.body.username;
    var email = req.body.email;
    var password = req.body.password;

    User.findOne({ where: { email: email } }).then(function (user) {
        if (user) {
            req.session.errMsg = "This email is already taken!";
            res.redirect('/auth/signup');
        } 
    });

    User.findOne({ where: { username: username } }).then(function (user) {
        if (user) {
            req.session.errMsg = "This username is already taken!";
            res.redirect('/auth/signup');
        } 
    });

    User.create({
            username: req.body.username,
            email: req.body.email,
            password: req.body.password
        })
        .then(user => {
            req.session.user = user.dataValues;
            res.redirect('/');
        })
        .catch(error => {
            res.redirect('/signup');
        });
});

router.get('/signout', async function(req, res, next) {
    if (req.session.user && req.cookies.user_sid) {
        res.clearCookie('user_sid');
        res.redirect('/');
    } else {
        res.redirect('/auth/signin');
    }
});

// middleware function to check for logged-in users
function sessionChecker(req, res, next) {
  if (req.session.user && req.cookies.user_sid) {
        res.redirect('/');
    } else {
        next();
    }  
}


module.exports = router;
