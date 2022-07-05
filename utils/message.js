const time=require('./time.js')
function formatMessage(username, text) {
  return {
    username,
    text,
    time: time.hm
  };
}
module.exports = formatMessage;
