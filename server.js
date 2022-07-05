require('dotenv').config()
const express = require('express');
const app = express();
const server = require('http').Server(app); //helps in creating a server to be used with socket.io
const io = require('socket.io')(server); //for socket.io to know which server we are using
const mongoose = require("mongoose");
mongoose.connect(`mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.jqejq.mongodb.net/messagesDB`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});
const {
  v4: uuidv4
} = require('uuid'); //version 4 of uuid used

const {
  ExpressPeerServer
} = require('peer');

const peerServer = ExpressPeerServer(server, { //peer server handles webRTC signalling for us
  debug: true
});

const bodyParser = require("body-parser");
const {
  userJoined,
  getCurrentUser,
  userLeft,
  getParticipants
} = require('./utils/user.js')
const formatMessage = require('./utils/message.js');
const time = require("./utils/time.js");

app.use('/peerjs', peerServer);
app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({
  extended: true
}));
//database schema and model
const messageSchema = mongoose.Schema({
  text: String,
  username: String,
  time: String
});
const MessageItem = mongoose.model("MessageItem", messageSchema);
const item1 = new MessageItem({
  text: "Welcome to Chat Room",
  username: "Bot",
  time: time.hm
});
const defaultItems = [item1];

const roomsSchema = mongoose.Schema({
  roomName: String,
  messages: [messageSchema]
});
const RoomItem = mongoose.model("RoomItem", roomsSchema);

app.get('/', function(req, res) {
  const rid = uuidv4(); //unique room id
  res.render('home', {
    roomid: rid
  });
});

app.get('/:roomid', function(req, res) {
  const name=req.query.username;
  res.render('userDetails', {
    roomid: req.params.roomid,
    username:name
  });
})

app.get('/Chat/:roomid', function(req, res) {
  res.render('chat-login', {
    roomid: req.params.roomid
  });
})

app.get('/Chat/:roomid/:username', function(req, res) {
  RoomItem.findOne({
    roomName: req.params.roomid
  }, function(err, foundRoom) {
    if (!err) {
      if (!foundRoom) {
        const room = new RoomItem({
          roomName: req.params.roomid,
          messages: defaultItems
        });
        room.save();
        res.redirect('/Chat/' + `${req.params.roomid}/` + `${req.params.username}`);
      } else {
        res.render('chat', {
          roomid: foundRoom.roomName,
          username: req.params.username,
          newListItems: foundRoom.messages
        });
      }
    }
  });
});

app.post('/:roomid', function(req, res) {
  const name = req.body.name;
  let audioCheck = "on";
  if ("on".localeCompare(req.body.audio) == 0)
    audioCheck = "off";
  let videoCheck = "on";
  if ("on".localeCompare(req.body.video) == 0)
    videoCheck = "off";
  res.render('room', {
    roomid: req.params.roomid,
    username: name,
    audioON: audioCheck,
    videoON: videoCheck
  });
});

app.post('/Chat/:roomid', function(req, res) {
  const name = req.body.name;
  const roomid = req.params.roomid;
  res.redirect('/Chat/' + `${roomid}/` + `${name}`);
});

//post request of message
app.post('/Chat/:roomid/:username', function(req, res) {
  if (req.body.msg.length != 0) {
    const item = new MessageItem({
      text: req.body.msg,
      username: req.params.username,
      time: time.hm
    });
    item.save();
    RoomItem.findOne({
      roomName: req.params.roomid
    }, function(err, foundRoom) {
      if (!err) {
        foundRoom.messages.push(item);
        foundRoom.save();
        res.redirect('/Chat/' + `${foundRoom.roomName}/` + `${req.params.username}`);
      }
    });
  }
})

io.on('connection', function(socket) { //handshake pipeline for bidirectional communication b/w client and server
  socket.on('joined-room', function(roomid, userid, username) { //listen to message sent by client ROOM_ID info
    const user = userJoined(roomid, userid, username,"meeting");
    socket.join(roomid);
    socket.broadcast.to(roomid).emit('user-connected', userid); //braodcast will emit message to all the clients except to the new user
    //send participants list
    io.to(roomid).emit('user-info', getParticipants(roomid,"meeting"));
    //chatting
    socket.on('message', function(message, userid) {
      const user = getCurrentUser(userid,"meeting");
      const item = new MessageItem({
        text: message,
        username: user.name,
        time: time.hm
      });
      item.save();
      RoomItem.findOne({
        roomName: user.roomid
      }, function(err, foundRoom) {
        if (!err) {
          foundRoom.messages.push(item);
          foundRoom.save();
        }
      });
      io.to(user.roomid).emit('createMessage', formatMessage(user.name, message));
    });
    //disconnect
    socket.on('force-disconnect', function() {
      const user = userLeft(userid,"meeting");
      if (user) {
        io.to(roomid).emit('user-info', getParticipants(roomid,"meeting"));
      }
      socket.broadcast.to(roomid).emit('user-disconnected', userid);
    })
    socket.on('disconnect', function() {
      const user = userLeft(userid,"meeting");
      if (user) {
        io.to(roomid).emit('user-info', getParticipants(roomid,"meeting"));
      }
      socket.broadcast.to(roomid).emit('user-disconnected', userid);
    })
  })
  //chat room
  //join chat room
  socket.on('joinChatRoom', function(username, roomid, rname) {
    const user = userJoined(roomid, socket.id, username,"chat");
    socket.join(user.roomid);
    //user info being Send
    io.to(user.roomid).emit('roomUsers', {
      room: user.roomid,
      users: getParticipants(user.roomid,"chat")
    });
  })
  //message from client to server
  socket.on('chat-message', function(msg) {
    const user = getCurrentUser(socket.id,"chat");
    //console.log(user);
    io.to(user.roomid).emit('message-send', user.roomid);
  })
  socket.on('disconnect', function() {
    const user = userLeft(socket.id,"chat");
    if (user) {
      io.to(user.roomid).emit('roomUsers', {
        room: user.roomid,
        users: getParticipants(user.roomid,"chat")
      });
    }
  })
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
server.listen(port, function() {
  console.log("server is running on port 3000");
});
