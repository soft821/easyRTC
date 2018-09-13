// Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license. See LICENSE.txt in the project root for license information.
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', sessionChecker, async function(req, res, next) {
  let parms = { title: 'Home', active: { home: true }, layout: 'layout/video-room' };
  parms.isHost = req.session.isHost;
  parms.joinId = req.session.joinId || 0;
  parms.currentUser = req.session.user;
  res.render('meetingRoom', parms);
});

router.post('/', sessionChecker, async function(req, res, next) {
  let parms = { title: 'Home', active: { home: true }, layout: 'layout/video-room' };

  req.session.isHost = false;
  req.session.joinId = req.body.meetingId;
  parms.currentUser = req.session.user;
  parms.isHost = req.session.isHost;
  parms.joinId = req.session.joinId;
  res.render('meetingRoom', parms);
});

// middleware function to check for logged-in users
function sessionChecker(req, res, next) {
  if (req.session.user && req.cookies.user_sid) {
        next();
    } else {
        res.redirect('/auth/signin');
    }  
}

module.exports = router;
