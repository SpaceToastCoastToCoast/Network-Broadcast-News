const net = require('net');
const process = require('process');

let usersOnline = [];

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
    if(data.toString().charCodeAt(0) === 02) {
      data = data.toString().slice(1);
      process.stdout.write('User at IP ' + request.address().address + ' joined as [' + data + '].\n');
    } else {
      broadcastAll(data, request);
    }
  });

  //request.end();
  //handles request ended
  request.on('end', () => {
    let indexToRemove = usersOnline.indexOf(request);
    usersOnline.splice(indexToRemove, 1);
    console.log('connection closed');
  });
});

//listen for events on port 8080
server.listen({port:6969, host: '0.0.0.0'}, () => {
  const address = server.address();
  console.log(`opened server on port ${address.port}`);
});