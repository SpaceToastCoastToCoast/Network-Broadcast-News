const net = require('net');
const process = require('process');

let usersOnline = [];
let userCache = {};

function broadcastAll(data, sender) {
  usersOnline.forEach((usr) => {
    if(usr !== sender) {
      usr.write(data);
    }
  });
  process.stdout.write(data + "\n");
}

const server = net.createServer((request) => {
  //handles data received
  if(usersOnline.indexOf(request) < 0) {
    console.log('User at IP ' + request.address().address + ':' +
          request.remotePort + ' entered the chat.');
    usersOnline.push(request);
    usersOnline[usersOnline.indexOf(request)].lastMsgTime = 0;
  }

  request.on('data', (data) => {
    //flood check, if less than 15 ms since last message user will be kicked
    thisMsgTime = Date.now();
    if((thisMsgTime - usersOnline[usersOnline.indexOf(request)].lastMsgTime) < 200) {
      kick(usersOnline[usersOnline.indexOf(request)].username, 'flooding the chat.');
      return;
    }
    //if username
    if(data.toString().charCodeAt(0) === 02) {
      data = data.toString().slice(1);
      usersOnline[usersOnline.indexOf(request)].username = data;
      if(!data.includes('ADMIN') && !userCache.hasOwnProperty(data)) {
        userCache[data] = request;
        broadcastAll('User at IP ' + request.address().address + ':' +
          request.remotePort + ' is now known as [' + data + '].', request);
      } else {
        broadcastAll('User at IP ' + request.address().address + ':' +
          request.remotePort + ' attempted to join with duplicate username \'' +
          data + '\' and was immediately kicked.', request);
        request.write('[ADMIN] That username is reserved. Rejoin with a different username.',
         'UTF8', () => {request.end();});
      }
    } else {
      //if message
      broadcastAll(data, request);
    }
    usersOnline[usersOnline.indexOf(request)].lastMsgTime = thisMsgTime;
  });

  //request.end();
  //handles request ended
  request.on('end', () => {
    let indexToRemove = usersOnline.indexOf(request);
    usersOnline.splice(indexToRemove, 1);
    delete userCache[request.username];
    broadcastAll(request.username + ' has left.', request);
  });
});

//listen for events on port 8080
server.listen({port:6969, host: '0.0.0.0'}, () => {
  const address = server.address();
  console.log(`opened server on port ${address.port}`);
  console.log('You are [ADMIN]. Type \'/kick [username] [optional: /r reason]\' to remove someone from chat.');
});

process.stdin.on('readable', () => {
  var chunk = process.stdin.read();
  if(chunk !== null) {
    chunk = chunk.toString();
    if(chunk.startsWith('/kick')) {
      let kickedUsername = chunk.split(' ');
      kickedUsername.shift();
      kickedUsername = kickedUsername.join(' ').trim();
      let reason = kickedUsername.split('/r');
      reason.shift();
      if(kickedUsername.split('/r').length > 1) {
        kickedUsername = kickedUsername.split('/r').shift().trim();
      }
      reason = reason.join(' ').trim();
      kick(kickedUsername, reason);
      } else {
      usersOnline.forEach((usr) => {
        usr.write('[ADMIN]: ' + chunk.trim());
      });
    }
  }
});

function kick(kickedUsername, reason) {
  if(userCache.hasOwnProperty(kickedUsername)) {
    if(reason === undefined || reason.length <= 1) {
      reason = '.';
    } else {
      reason = '.\n[REASON: ' + reason + ']';
    }
    let kicked = userCache[kickedUsername];
    console.log('You have kicked ' + kicked.username + ' at ' +
    kicked.address().address + ':' + kicked.address().port + reason);
    usersOnline.forEach((usr) => {
      usr.write('[ADMIN]: user [' + kicked.username + '] at ' +
        kicked.address().address + ':' + kicked.address().port +
        ' has been removed from chat' + reason,
        () => {
          kicked.end();
        });
    });
  } else {
    console.log('No user called \'' + kickedUsername + '\' to kick.');
  }
}