var spawn = require('child_process').spawn

var cmd = 'sox';
var cmdArgs = [
  '-q',
  '-b','16',
  '-d','-t','aiff','-',
  'rate','16000','channels','1',
  'silence','1','0.1', '-30' + 'd','1','1.0', '-30' + 'd'
];

var listenForSound = function () {
  var rec = spawn(cmd, cmdArgs, 'pipe');
  var recRunning, recBuffer = []
  // Process stdout

  rec.stdout.on('readable', function() {
    console.log('speechReady');
  });

  rec.stdout.setEncoding('binary');
  rec.stdout.on('data', function(data) {
    if(! recRunning) {
      console.log('speechStart');
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
    console.log('speechStop');
    listenForSound()
  });
}

listenForSound()