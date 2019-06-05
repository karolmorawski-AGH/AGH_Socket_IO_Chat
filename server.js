const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const crypto = require('crypto');

//Configuration
var app = express();
var server = require('http').createServer(app);

//sockets
var io = require('socket.io').listen(server);

//body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

//session
app.use(session({
    secret: '$1$fsaf251$lcvxhxPhHFT9u1Tooytgd.',
    resave: false,
    saveUninitialized: false
}));

//Load password
const fs = require('fs');
var rawdata = fs.readFileSync('./data/password.json');  
var pwd = JSON.parse(rawdata);  

//TODO -> class
//Arrays of usernames, user avatars
class User {
    constructor(uname, uip) {
        this.uname = uname;
        this.uip = uip;
    }
}
let users = [];
let connections = [];

//TODO dont use it
userIp = [];
avatars = [];
ids = [];


//Starting server on default port
var port = 3000;
server.listen(process.env.PORT || port);
console.log('Server running on port ' + port);

var auth = function(request, response, next) {
    if (request.session && request.session.isValid === true)
      return next();
    else
      return response.sendFile(__dirname + '/login.html');
  };

//Routing
//Index page
app.get('/', auth, function(request, response){
    response.sendFile(__dirname + '/index.html');
});

//Password page
app.get('/login', function(request, response, next){
    response.sendFile(__dirname + '/login.html');
});

//Authorization
app.post('/submit', function(request, response){

    if (!request.body.password) {
        response.sendFile(__dirname + '/login.html');   
      } 

      var hashedPassword = crypto.createHash(pwd.type).update(request.body.password).digest(pwd.encoding);
      
      if(hashedPassword === pwd.password) {
        request.session.isValid = true;
        response.sendFile(__dirname + '/index.html');
      }
      else {
        response.sendFile(__dirname + '/login.html');   
      }
});

//Serving static files
app.use(express.static('public'))

//Connection handling
//On connection
io.sockets.on('connection', function(socket){

    //Timestamp
    var timestamp = new Date();

    connections.push(socket);
    var socketId = socket.id;
    var clientIp = socket.request.connection.remoteAddress;
  
    console.log(clientIp + '\tconnected' + '\t[' + connections.length + ']' + '\t' + timestamp);

    //On disconnect
    socket.on('disconnect', function(data){
        users.splice(users.indexOf(socket.username), 1);
        users.splice(userIp.indexOf(socket.userIp), 1);
        users.splice(avatars.indexOf(socket.avatar), 1);
        users.splice(ids.indexOf(socket.id), 1);
        updateUsernames();

        connections.splice(connections.indexOf(socket),1);
        //timestamp date
        var tstamp = new Date();

        console.log(clientIp + '\tdisconnected' + '\t[' + connections.length + ']' + '\t' + tstamp);
    });

    //Send message
    socket.on('send message', function(data){

        //Actual timestamp
        var timestamp = new Date();
        //timestamp date
        var tstamp = timestamp.toISOString();
        //Hours and minutes send back to client
        var minutes = timestamp.getMinutes();
        minutes = minutes > 9 ? minutes : '0' + minutes;    
        var hm = timestamp.getHours() + ':' + minutes;

        console.log('MESSAGE\t\t\t\t' + timestamp +'\t\t' +data);
        io.sockets.emit('new message', {msg: data, user: socket.username, ts: hm});
    });

    //Add user
    socket.on('new user', function(data, callback){
        callback(true);

        //Username
        socket.username = data;
        //User IP
        socket.userIp = socket.request.connection.remoteAddress;
        //Avatar
        socket.avatar = 'https://identicon.rmhdev.net/' + data + users.length + '.png';
        //ID
        socket.id = users.length;

        users.push(socket.username);
        userIp.push(socket.userIp);
        avatars.push(socket.avatar);
        ids.push(socket.id);

        updateUsernames();
    });

    function updateUsernames() {
        io.sockets.emit('get users', users, userIp, avatars, ids);
    }
    
});

//Get UTC Time
Date.prototype.getUnixTime = function() { 
    return this.getTime()/1000|0 
};

if(!Date.now) Date.now = function() { 
    return new Date(); 
}

Date.time = function() { 
    return Date.now().getUnixTime(); 
}

//Handle 404
app.use(function (req, res, next) {
    res.status(404).send("Not found")
  })