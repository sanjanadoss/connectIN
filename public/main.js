const socket=io();
const textInput=document.getElementById('chat-form');
const chatMessages=document.querySelector('.chat-messages');
chatMessages.scrollTop=chatMessages.scrollHeight;
//join chat room
socket.emit('joinChatRoom',username,roomid);
//get participants and ROOM_ID
socket.on('roomUsers',function(user){
  outputRoomName(user.room);
  outputRoomUsers(user.users);
})

socket.on('message-send',function(room){
  setTimeout(function(){
    window.location.replace("/Chat/"+`${room}/`+`${username}`);
  }, 2000);
})
textInput.addEventListener('submit',function(e){
  let msg=$('#msg').val();
  socket.emit('chat-message',msg);
})

function outputRoomName(room){
  document.getElementById("room-name").innerText=room;
}

function outputRoomUsers(users){
  document.getElementById('users').innerHTML = '';
  users.forEach((user) => {
    const li = document.createElement('li');
    li.innerText = user.name;
    document.getElementById('users').appendChild(li);
  });
}
