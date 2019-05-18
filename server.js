var express = require('express');

var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

var identicon = require('identicon');
var fs = require('fs');

//Arrays of usernames, user avatars
users = [];
users
connections = [];

//Starting server on default port
var port = 3000;
server.listen(process.env.PORT || port);
console.log('Server running on port ' + port);

//Routing
//Index page
app.get('/', function(request, response){
    response.sendFile(__dirname + '/index.html');
});

//Serving static files
app.use(express.static('public'))

//Connection handling
//On connection
io.sockets.on('connection', function(socket){

    //Actual timestamp
    var timestamp = new Date();
    //timestamp date
    var tstamp = timestamp.toISOString();

    connections.push(socket);
    var socketId = socket.id;
    var clientIp = socket.request.connection.remoteAddress;
  
    console.log(clientIp + '\tconnected' + '\t[' + connections.length + ']' + '\t' + timestamp);

    //On disconnect
    socket.on('disconnect', function(data){
        users.splice(users.indexOf(socket.username), 1);
        updateUsernames();

        //timestamp date
        var tstamp = new Date().toISOString();

        connections.splice(connections.indexOf(socket),1);
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

        console.log('USER\t\t' + tstamp +'\t\t' +data);
        io.sockets.emit('new message', {msg: data, user: socket.username, ts: hm});
    });

    //Add user
    socket.on('new user', function(data, callback){
        callback(true);
        socket.username = data;
        //var socket.buffer = identicon.generateSync({ id: 'ajido', size: 40 });
        users.push(socket.username);
        updateUsernames();
    });

    function updateUsernames() {
        io.sockets.emit('get users', users);
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
    res.status(404).send("404 Not found")
  })

