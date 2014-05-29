#!/usr/bin/env node
"use strict";
var http = require('http');
var send = require('send');
var dronestream = require('dronestream');
var path = require('path');
var frontendBuild = path.join(__dirname, '..', 'frontend', 'build');
var ws = require('ws');
var drone = require('ar-drone').createClient();

var starfox = require('starfox')

var server = http.createServer(function(req, res) {
  send(req, req.url, {root: frontendBuild}).pipe(res);
});
dronestream.listen(process.env.WS_PORT || 3001);

var wsServer = new ws.Server({server: server});
wsServer.on('connection', function(conn) {
  function send(msg) {
    conn.send(JSON.stringify(msg));
  }

  conn.on('message', function(msg) {
    try {
      msg = JSON.parse(msg);
    } catch (err) {
      console.log('err: '+err+': '+msg);
    }
    var kind = msg.shift();
    switch (kind) {
      case 'on':
        var event = msg.shift();
        drone.on(event, function(data) {
          send(['on', event, data]);
        });
        break;
      case 'takeoff':
        drone.takeoff(function() {
          send(['takeoff']);
        });
        break;
      case 'land':
        drone.land(function() {
          send(['land']);
        });
        break;
      case 'right':
        drone.right(msg[0]);
        break;
      case 'stop':
        drone.stop();
        break;
      default:
        console.log('unknown msg: '+kind);
        break;
    }
  });
});

// Mount starfox on the HTTP server so it can serve resources/listen for
// events from the client
starfox.mount(server);

// Handle events for connected players
starfox.on('connection', function(player) {

    // Input event is emitted when the state of the controller changes
    player.on('input', function(gamepad) {
        console.log(gamepad);
    });

    // gamepadsChanged is fired when a gamepad is plugged or unplugged
    player.on('gamepadsChanged', function(gamepads) {
        console.log(gamepads);
    });
});

server.listen(process.env.PORT || 3000);
