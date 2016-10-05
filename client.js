const net = require('net');
const process = require('process');
let username;

const options = {
  'port' : 6969,
  'host' : '0.0.0.0'
};

//creates socket connection to a server
const client = net.connect(options, (connection) => {
  var addr = client.address();
  console.log('CONNECTED:', addr.address + ':' + addr.port);
  console.log('[ADMIN]: Enter a username. Type \'/nick\' to change username later: ');
});

//handles data received
client.on('data', (data) => {
  console.log(data.toString());
});

client.on('end', () => {
  console.log('Your session has ended.');
});

process.stdin.on('readable', () => {
  var chunk = process.stdin.read();
  if(chunk !== null) {
    chunk = chunk.toString().trim();
    if(username === undefined) {
      username = chunk;
      console.log('Username set to \'' + username + '\'.');
      client.write(String.fromCharCode(02) + username);
    } else {
      if(chunk.startsWith('/nick')) {
        username = chunk.split(' ');
        username.shift();
        username = username.join(' ');
        console.log('Username set to \'' + username + '\'.');
        client.write(String.fromCharCode(02) + username);
      } else if(chunk.startsWith('/flood')) {
        let msg = chunk.split(' ');
        msg.shift();
        msg = msg.join(' ');
        let flood = setInterval(() => {
          client.write(username + ": " + msg);
        }, 10);
      } else {
        client.write(username + ": " + chunk);
      }
    }
  }
});