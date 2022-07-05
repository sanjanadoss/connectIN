const chatusers = [];
const meetingusers = [];

function userJoined(roomid, id, name, flag) {
  const user = {
    roomid,
    id,
    name
  };
  if (flag.localeCompare("chat") == 0) {
    chatusers.push(user);
  } else {
    meetingusers.push(user);
  }
  return user;
}

function getCurrentUser(userid, flag) {
  if (flag.localeCompare("chat") == 0) {
    return chatusers.find(user => user.id === userid);
  } else {
    return meetingusers.find(user => user.id === userid);
  }
}

function userLeft(userid, flag) {
  if (flag.localeCompare("chat") == 0) {
    const idx = chatusers.findIndex(user => user.id == userid);
    if (idx !== -1)
      return chatusers.splice(idx, 1)[0];
  } else {
    const idx = meetingusers.findIndex(user => user.id == userid);
    if (idx !== -1)
      return meetingusers.splice(idx, 1)[0];
  }
}

function getParticipants(roomid, flag) {
  if (flag.localeCompare("chat") == 0) {
    return chatusers.filter(user => user.roomid == roomid);
  } else {
    return meetingusers.filter(user => user.roomid == roomid);
  }
}
module.exports = {
  userJoined,
  getCurrentUser,
  userLeft,
  getParticipants
};
