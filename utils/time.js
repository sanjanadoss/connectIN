module.exports=new currentTime();
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
