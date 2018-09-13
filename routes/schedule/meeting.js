// Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license. See LICENSE.txt in the project root for license information.
var express = require('express');
var router = express.Router();
var authHelper = require('../helpers/auth');
var graph = require('@microsoft/microsoft-graph-client');
var request = require('request');
var outlook = require('node-outlook');

router.get("/create",async function(req, res, next){
  let parms = { title: 'Calendar', active: { create_meeting: true } };
  const accessToken = await authHelper.getAccessToken(req.cookies, res);
  const userName = req.cookies.graph_user_name;
  parms.outlook_user = userName;
  res.render('createMeeting', parms);
});




/* POST /event schedule */
router.post('/store', isLoggedIn, async function(req, res, next) {
  let parms = { title: 'Calendar', active: { calendar: true } };
  var subject = req.body.subject;
  var body = req.body.description;
  var timezone = req.body.timezone;
  var startTime = req.body.startTime;
  var endTime = req.body.endTime;
  var location = req.body.location;
  var attendees = req.body.attendees;

  const accessToken = await authHelper.getAccessToken(req.cookies, res);
  const userName = req.cookies.graph_user_name;

  if (accessToken && userName) {
    parms.outlook_user = userName;

    // Set the API endpoint to use the v2.0 endpoint
    outlook.base.setApiEndpoint('https://outlook.office.com/api/v2.0');

    var newEvent = {
      "Subject": "Discuss the Calendar REST API",
      "Body": {
        "ContentType": "HTML",
        "Content": "I think it will meet our requirements!"
      },
      "Start": {
        "DateTime": "2019-09-03T18:00:00",
        "TimeZone": "Eastern Standard Time"
      },
      "End": {
        "DateTime": "2019-09-03T19:00:00",
        "TimeZone": "Eastern Standard Time"
      },
      "Attendees": [
        {
          "EmailAddress": {
            "Address": "allieb@contoso.com",
            "Name": "Allie Bellew"
          },
          "Type": "Required"
        }
      ]
    };

    // Pass the user's email address
    var userInfo = {
      email: 'soft821@outlook.com'
    };

    outlook.calendar.createEvent({token: accessToken, event: newEvent, user: userInfo},
      function(error, result){
        if (error) {
          console.log('createEvent returned an error: ' + error);
        }
        else if (result) {
          console.log(JSON.stringify(result, null, 2));
        }
      });
    
  } else {
    // Redirect to home
    res.redirect('/outlook');
  }
});

function isLoggedIn(req, res, next) {

  // if user is authenticated in the session, carry on
  if (req.isAuthenticated())
    return next();

  // if they aren't redirect them to the home page
  res.redirect('/');
}

module.exports = router;