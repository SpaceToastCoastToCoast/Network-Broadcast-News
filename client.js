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
  console.log('Enter a username: ');
});

//handles data received
client.on('data', (data) => {
  console.log(data.toString());
});

process.stdin.on('readable', () => {
  var chunk = process.stdin.read();
  if(chunk !== null) {
    if(username === undefined) {
      username = chunk.toString().trim();
      console.log('Username set to \'' + username + '\'.');
      client.write(String.fromCharCode(02) + username);
    } else {
      chunk = chunk.toString().trim();
      client.write(username + ": " + chunk);
    }
  }
});