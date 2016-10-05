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
    usersOnline.push(request);
  }

  request.on('data', (data) => {
    //if username
    if(data.toString().charCodeAt(0) === 02) {
      data = data.toString().slice(1);
      usersOnline[usersOnline.indexOf(request)].username = data;
      if(data !== '[ADMIN]' && !userCache.hasOwnProperty(data)) {
        userCache[data] = request;
        process.stdout.write('User at IP ' + request.address().address + ':' + request.localPort + ' joined as [' + data + '].\n');
      } else {
        process.stdout.write('User attempted to join with duplicate username \'' + data + '\' and was immediately kicked. \n');
        request.write('[ADMIN] That username is reserved. Rejoin with a different username.',
         'UTF8', () => {request.end();});
      }
    } else {
      //if message
      broadcastAll(data, request);
    }
  });

  //request.end();
  //handles request ended
  request.on('end', () => {
    let indexToRemove = usersOnline.indexOf(request);
    usersOnline.splice(indexToRemove, 1);
    delete userCache[request.username];
    console.log(request.username + ' has left.');
  });
});

//listen for events on port 8080
server.listen({port:6969, host: '0.0.0.0'}, () => {
  const address = server.address();
  console.log(`opened server on port ${address.port}`);
});

process.stdin.on('readable', () => {
  var chunk = process.stdin.read();
  if(chunk !== null) {
    chunk = chunk.toString();
    if(chunk.startsWith('/kick')) {
      let kickedUsername = chunk.split(' ');
      kickedUsername = kickedUsername[1].trim();
      if(userCache.hasOwnProperty(kickedUsername)) {
        let kicked = userCache[kickedUsername];
        console.log('You have kicked ' + kicked.username + '.');
        usersOnline.forEach((usr) => {
          usr.write('[ADMIN]: ' + kicked.username + ' has been removed from chat by an admin.',
            () => {
              kicked.end();
            });
        });
      } else {
        console.log('No user called \'' + kickedUsername + '\' to kick.');
      }
    } else {
      usersOnline.forEach((usr) => {
        usr.write('[ADMIN]: ' + chunk.trim());
      });
    }
  }
});