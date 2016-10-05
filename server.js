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
        process.stdout.write('User at IP ' + request.address().address + ' joined as [' + data + '].\n');
      } else {
        process.stdout.write('User attempted to join with duplicate username and was immediately kicked. \n');
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
  if(chunk.toString().startsWith('/kick')) {
    let kicked = null;
    console.log('You have kicked ' + kicked + '.');
    usersOnline.forEach((usr) => {
      usr.write('[ADMIN]: ' + kicked + ' has been removed from chat by an admin.');
    });
  } else {
    usersOnline.forEach((usr) => {
      usr.write('[ADMIN]: ' + chunk);
    });
  }
});