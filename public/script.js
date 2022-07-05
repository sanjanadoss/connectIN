const socket = io('/');
const videoDisplay = document.getElementById('container');
const myVideo = document.createElement('video');
const peer = new Peer();
let myid;
peer.on('open', function(userid) { //connection established
  socket.emit('joined-room', ROOM_ID, userid, username);
  // console.log("my id " + userid);
  myid = userid;
});
let myVideoStream;
const peers = {};
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  myVideoStream = stream;
  myVideo.muted = true;
  addVideo(myVideo, stream);
  if (audioON.localeCompare("off") == 0) {
    muteUnmute();
  }
  if (videoON.localeCompare("off") == 0) {
    videoOnOff();
  }
  peer.on('call', (call) => {
    call.answer(stream);
    const video = document.createElement('video')
    call.on('stream', (userVideoStream) => {
      addVideo(video, userVideoStream)
    })
  })
  let msg = $('input');
  $('html').keydown(function(e) {
    if (e.which == 13 && msg.val().length != 0) { //if enter key is pressed and the text is not empty
      socket.emit('message', msg.val(), myid);
      msg.val(''); //after message is sent again the input value has to be set to empty
    }
  });
  socket.on('createMessage', function(message) {
    $('.messages').append(`<li class="message"><b>${message.username} </b><span class="chat__time">${currentTime().hm}</span></br>${message.text}</li>`);
    scrollToBottom();
  })

  socket.on('user-connected', userId => {
    //console.log('New User Connected: ' + userId)
    const fc = () => connectToNewUser(userId, stream)
    timerid = setTimeout(fc, 2500)
  })

});
socket.on('user-disconnected', function(userid) {
  if (peers[userid])
    peers[userid].close();
})
socket.on('user-info', function(users) {
  document.querySelector('.participants').innerHTML = '';
  users.forEach((user) => {
    const li = document.createElement('li');
    li.innerText = user.name;
    li.classList.add('plist');
    document.querySelector('.participants').appendChild(li);
  });
})
const connectToNewUser = (userid, stream) => {
  //console.log("new user joined in " + userid);
  const call = peer.call(userid, stream);
  const video = document.createElement('video');
  call.on('stream', (remoteStream) => {
    //  console.log(remoteStream);
    addVideo(video, remoteStream);
  });
  peers[userid] = call;
  call.on('close', function() {
    video.remove();
  })
}

function addVideo(video, stream) {
  video.srcObject = stream; //video to be streamed
  video.addEventListener('loadedmetadata', () => { //when metadata(duration,dimensions) of video is loaded then, play video
    video.play()
  })
  //video.mute=true;
  videoDisplay.append(video);
}
//time for message
function currentTime() {
  var currentTime = new Date()
  var hours = currentTime.getHours()
  var minutes = currentTime.getMinutes()
  var sec = currentTime.getSeconds()
  if (minutes < 10) {
    minutes = "0" + minutes
  }
  if (sec < 10) {
    sec = "0" + sec
  }
  if (hours < 10) {
    hours = "0" + hours;
  }
  var hm_str = hours + ":" + minutes;
  var t_str = hm_str + ":" + sec + " ";
  if (hours > 11) {
    t_str += "PM";
  } else {
    t_str += "AM";
  }
  var obj = {
    hm: hm_str,
    hms: t_str
  }
  return obj;
}

//stopwatch->time elapsed
var hr = 0;
var min = 0;
var sec = 0;
timerCycle();
function timerCycle() {
  sec = parseInt(sec);
  min = parseInt(min);
  hr = parseInt(hr);

  sec = sec + 1;

  if (sec == 60) {
    min = min + 1;
    sec = 0;
  }
  if (min == 60) {
    hr = hr + 1;
    min = 0;
    sec = 0;
  }

  if (sec < 10 || sec == 0) {
    sec = '0' + sec;
  }
  if (min < 10 || min == 0) {
    min = '0' + min;
  }
  if (hr < 10 || hr == 0) {
    hr = '0' + hr;
  }

  document.getElementById('time').innerHTML = hr + ':' + min + ':' + sec;
  setTimeout("timerCycle()", 1000);
}

function scrollToBottom() {
  var d = $('.chat-window');
  d.scrollTop(d.prop('scrollHeight'))
}

function muteUnmute() {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setMuteButton();
  } else {
    myVideoStream.getAudioTracks()[0].enabled = true;
    setUnmuteButton();
  }
}

function setMuteButton() {
  const html = `<i class="fas fa-microphone-slash"></i>`;
  $('.audio__controls').addClass('stop');
  document.querySelector('.audio__controls').innerHTML = html;
}

function setUnmuteButton() {
  const html = `<i class="fas fa-microphone"></i>`;
  $('.audio__controls').removeClass('stop');
  document.querySelector('.audio__controls').innerHTML = html;
}

function videoOnOff() {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setVideoOff();
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true;
    setVideoOn();
  }
}

function setVideoOff() {
  const html = `<i class="fas fa-video-slash"></i>`;
  $('.video__controls').addClass('stop');
  document.querySelector('.video__controls').innerHTML = html;
}

function setVideoOn() {
  const html = `<i class="fas fa-video"></i>`;
  $('.video__controls').removeClass('stop');
  document.querySelector('.video__controls').innerHTML = html;
}

function leaveMeeting() {
  socket.emit('force-disconnect');
  location.assign('/Chat/' + `${ROOM_ID}/` + `${username}`);
}
//particpants list
function showParticipants() {
  document.querySelector('.chat__heading').innerText = "Participants";
  $('#chat__message').hide();
  $('.messages').hide();
  $('.participants').show();
}

function showChat() {
  document.querySelector('.chat__heading').innerText = "In-call messages";
  $('.participants').hide();
  $('#chat__message').show();
  $('.messages').show();
}
