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
    console.log(kind, msg);
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
      case 'flipRight':
        console.log('I am running');
        drone.animate('flipRight',msg[0]);
        break;
      case 'yawShake':
        drone.animate('yawShake',msg[0]);
        break;
      default:
        console.log('unknown msg: '+k);
        break;
    }
  });
});

var HID, devices, gamepad, gamepadMeta, _;

HID = require('node-hid');
_ = require('underscore');

devices = HID.devices();

gamepadMeta = _.find(devices, function(dev) {
  return dev.vendorId === 121;
});

gamepad = new HID.HID(gamepadMeta.path);

var controllerState = [];

gamepad.on('data', function(data) {
  // Analog controls
  [0, 1, 3, 4].forEach(function (i) {
    runInstruction(data[i], i);
  });

  // Digital controls
  [5, 6].forEach(function (i) {
    if (typeof controllerState[i] !== 'undefined' && controllerState[i] !== data[i]) {
      // console.log('RUN', controllerState[i], data[i], i);
      runInstruction(data[i], i);
    }
    controllerState[i] = data[i];
  });
});

var runInstruction = function (info, i) {
  stopPatrol();
  switch (i) {
    case 0: // L analog l-r
      var rollSpeed = (info-128)/128;
      // console.log('ROLL', rollSpeed);
      // if (rollSpeed === 0) {
      //   drone.stop();
      // } else {
      //   drone.right(rollSpeed);
      // }
      drone.right(rollSpeed);
      break;
    case 1: // L analog u-d
      var pitchSpeed = (info-128)/128;
      // console.log('PITCH', pitchSpeed);
      // if (pitchSpeed === 0) {
      //   // drone.stop();
      // } else {
        drone.back(pitchSpeed);
      // }
      break;
    case 3: // R analog l-r
      var clockwiseSpeed = (info-128)/128;
      // console.log('CLOCKWISE', clockwiseSpeed);
      // if (clockwiseSpeed === 0) {
      //   drone.stop();
      // } else {
        drone.clockwise(clockwiseSpeed);
      // }
      break;
    case 4: // R analog u-d
      var up = (info-128)/128;
      // console.log('UP', up);
      // if (up === 0) {
      //   drone.stop();
      // } else {
        drone.up(up);
      // }
      break;
    case 5: // D-Pad & Main Buttons
      switch (info) {
        case 16:
          console.log("DISABLE EMERGENCY");
          drone.disableEmergency();
          break;
      }
      break;
    case 6: // Start/Select/L 1-3/R 1-3
      switch (info) {
        case 16:
          console.log("LAND");
          drone.land(function() {
            send(['land']);
          });
          break;
        case 32:
          console.log("TAKEOFF");
          drone.takeoff(function() {
            send(['takeoff']);
          });
          break;
      }
      break;
  }
};

server.listen(process.env.PORT || 3000);


var spawn = require('child_process').spawn
var soxCmd = './sox';
var soxCmdArgs = [
  '-q',
  '-b','16',
  '-d','-t','aiff','-',
  'rate','16000','channels','1',
  'silence','1','0.1', '-30' + 'd','1','1.0', '-30' + 'd'
];

var listenForSound = function () {
  var rec = spawn(soxCmd, soxCmdArgs, 'pipe');
  var recRunning, recBuffer = []
  // Process stdout

  rec.stdout.on('readable', function() {
    console.log('listening...');
  });

  rec.stdout.setEncoding('binary');
  rec.stdout.on('data', function(data) {
    if(! recRunning) {
      console.log('BARREL ROLL!');
      drone.animate('flipRight', 1000);
      recRunning = true;
    }
    recBuffer.push(data);
  });

  // Process stdin

  rec.stderr.setEncoding('utf8');
  rec.stderr.on('data', function(data) {
    console.log('error')
    console.log(data)
  });

  rec.on('close', function(code) {
    recRunning = false;
    if(code) {
      console.log('error', 'sox exited with code ' + code);
    }
    console.log('not listening for 3 seconds...');
    setTimeout(function () {
      listenForSound()
    }, 3000)
  });
}

// listenForSound()

var time = 2000;
var goingLeft = false;
var patrolTimeout;
drone.takeoff();
var patrol = function () {
  if (!goingLeft) {
    console.log("LEFT");
    drone.left(.15);
    goingLeft = true;
  } else {
    console.log("RIGHT");
    drone.right(.15);
    goingLeft = false;
  }
  patrolTimeout = setTimeout(function(){
    console.log("Patrolling...");
    patrol();
  }, time);
}
var stopPatrol = function () {
  if (patrolTimeout) {
    console.log("Stopping patrol");
    clearTimeout(patrolTimeout);
    patrolTimeout = null;
  }
}
setTimeout(function () {
  patrol();
}, 3000)
