
/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

var mediaStream; // Contains video, and possibly added audio track
var audioStream; // Mic only
var recordedChunks = [];
var numrecordedChunks = 0;
var recorder;
var includeMic = false;

document.querySelector('#recDesktop').addEventListener('click', recordDesktop);
document.querySelector('#recCamera').addEventListener('click', recordCamera);
document.querySelector('#recWindow').addEventListener('click', recordWindow);
//document.querySelector('#recTab').addEventListener('click', recordTab);
document.querySelector('#Audio').addEventListener('click', audioCheck);
document.querySelector('#recStop').addEventListener('click', stopStreamsAndDownloadData);


function greyOutButtons(){
  document.querySelector('#recDesktop').disabled=true;
  document.querySelector('#recCamera').disabled=true;
  document.querySelector('#recWindow').disabled=true;
  document.querySelector('#recStop').hidden=false;
}

function enableButtons(){
  console.log('Enabling buttons')
  document.querySelector('#recDesktop').disabled=false;
  document.querySelector('#recCamera').disabled=false;
  document.querySelector('#recWindow').disabled=false;
  document.querySelector('#recStop').hidden=true;
}

function audioCheck() {

  // this won't work in extension
  
  // Mute video so we don't play loopback audio
  var video = document.querySelector("video");
  video.muted = true;
  // Tooggle state
  includeMic = !includeMic;

  if (includeMic){
    if (document.getElementById("Audio").checked){
        navigator.webkitGetUserMedia({
        audio:true,
        video: false
    }, gotAudio, getUserMediaError);

    }
  }

};


function recordDesktop(stream) {
  // Start Window picker with Desktop constraints
  window.resizeTo(646, 565);
  pending_request_id = chrome.desktopCapture.chooseDesktopMedia(
      ["screen"], onAccessApproved);

};


function recordCamera(stream) {

  navigator.webkitGetUserMedia({
      audio:false,
      video: { mandatory: { minWidth:1280,
                            minHeight:720 } }
  }, gotMediaStream, getUserMediaError);
};


function recordWindow(stream) {
 // Start Window picker with Desktop constraints
  window.resizeTo(646, 565);
  pending_request_id = chrome.desktopCapture.chooseDesktopMedia(
      ["window"], onAccessApproved);

  // Check Audio inclusion, fire off GUM if needed

};


function recordTab(stream) {
  // Invoke Tab Capture API
};



function gotTab(stream) {


};

function createButton(id, text, onClick) {
  const button = document.createElement("input");
  button.id = id;
  button.type = "button";
  button.value = text;
  button.onclick = onClick;
  document.body.appendChild(button);
  console.log("Button " + id + " created");
}

function recorderOnDataAvailable(event) {
  if (event)
    console.assert(event.data.length > 0, 'Recorded data size should be > 0',event.data.length);
  console.assert(recorder.state == "recording", "State should be 'recording'");

  // Use |byteLength| instead of |length| for event.data;
  recordedChunks.push(event.data);
  numrecordedChunks += event.data.byteLength;
}

function saveByteArray(data, name) {
  var blob = new Blob(data, {type: "video/webm"});
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  document.body.appendChild(a);
  a.style = "display: none";
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function stopStreamsAndPlaybackData() {
  //document.getElementById("btn").disabled = true;
  //document.getElementById("btn2").disabled = true;
  console.log('Stopping record and starting playback');
  recorder.stop();
  localStream.getVideoTracks()[0].stop();
  
  // sourceBuffer.appendBuffer(recordedChunks);
  // Or...
  var superBuffer = new Blob(recordedChunks);
  document.getElementById("video").src = window.URL.createObjectURL(superBuffer);
}


function stopStreamsAndDownloadData() {
  //document.getElementById("btn").disabled = true;
  //document.getElementById("btn2").disabled = true;
  console.log('Stopping record and starting download');
  enableButtons();
  recorder.stop();
  localStream.getVideoTracks()[0].stop();
  
  saveByteArray(recordedChunks, 'test.webm')();
  

}

function recorderOnStop() {
  console.log('recorderOnStop fired');
}

function gotMediaStream(stream) {

  console.log("Received local stream");
  var video = document.querySelector("video");
  video.src = URL.createObjectURL(stream);
  localStream = stream;
  stream.onended = function() { console.log("Ended"); };


  
  startTime = window.performance.now();
  var videoTracks = localStream.getVideoTracks();
  if(includeMic){
    var audioTracks = audioStream.getAudioTracks();
    localStream.addTrack(audioTracks[0]);
  }
  if (videoTracks.length > 0) {
    
  }


  try {
    console.log("Trying");
    recorder = new MediaRecorder(stream, "video/vp8");
  } catch (e) {
    console.assert(false, 'Exception while creating MediaRecorder: ' + e);
    return;
  }
  console.assert(recorder.state == "inactive");
  recorder.ondataavailable = recorderOnDataAvailable;
  recorder.onstop = recorderOnStop;
  recorder.start();
  console.log("Recorder is started");
  console.assert(recorder.state == "recording");
  greyOutButtons();
  //
};

function gotAudio(stream) {
  console.log("Received audio stream");
  audioStream = stream;
  stream.onended = function() { console.log("Audio Ended"); };

};

function getUserMediaError() {
  console.log("getUserMedia() failed");
};


function onAccessApproved(id) {
  window.resizeTo(500, 320);
  if (!id) {
    console.log("Access rejected.");
    return;
  }
  console.log('Window ID: ', id);

  navigator.webkitGetUserMedia({
      audio:false,
      video: { mandatory: { chromeMediaSource: "desktop",
                            chromeMediaSourceId: id,
                            maxWidth:window.screen.width,
                            maxHeight:window.screen.height } }
  }, gotMediaStream, getUserMediaError);

}
/*
var pending_request_id = null;
document.querySelector('#newTab').addEventListener('click', function(e) {
  chrome.tabs.create({url: chrome.extension.getURL('index.html#window')});
    window.resizeTo(500, 280);
});



document.querySelector('#start').addEventListener('click', function(e) {
  navigator.webkitGetUserMedia({
      audio:true,
      video: false
  }, gotAudio, getUserMediaError);

  window.resizeTo(800, 900);
  pending_request_id = chrome.desktopCapture.chooseDesktopMedia(
      ["screen", "window"], onAccessApproved);
  // "screen", "window"
  //  chrome.tabCapture.capture({
  //    audio:false,
  //    video: true
  //}, gotStream);
});

document.querySelector('#cancel').addEventListener('click', function(e) {
  if (pending_request_id != null) {
    chrome.desktopCapture.cancelChooseDesktopMedia(pending_request_id);
  }
});


*/

