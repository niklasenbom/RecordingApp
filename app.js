
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
var includeSysAudio = false;

document.querySelector('#recDesktop').addEventListener('click', recordDesktop);
document.querySelector('#recCamera').addEventListener('click', recordCamera);
document.querySelector('#recWindow').addEventListener('click', recordWindow);
document.querySelector('#recTab').addEventListener('click', recordTab);
document.querySelector('#Audio').addEventListener('click', audioCheck);
document.querySelector('#sysAudio').addEventListener('click', sysAudioCheck);
document.querySelector('#recStop').addEventListener('click', stopRecording);
document.querySelector('#playButton').addEventListener('click', play);
document.querySelector('#downloadButton').addEventListener('click', download);

if(getChromeVersion() < 51)
    document.querySelector('#sysAudioLabel').hidden=true;

  if(getChromeVersion() < 53)
    document.querySelector('#recTab').hidden=true;

function greyOutButtons(){
  document.querySelector('#recDesktop').disabled=true;
  document.querySelector('#recCamera').disabled=true;
  document.querySelector('#recWindow').disabled=true;
  document.querySelector('#recTab').disabled=true;
  document.querySelector('#recStop').hidden=false;
  document.querySelector('#playButton').hidden=true;
  document.querySelector('#downloadButton').hidden=true;
}

function enableButtons(){
  console.log('Enabling buttons')
  document.querySelector('#recDesktop').disabled=false;
  document.querySelector('#recCamera').disabled=false;
  document.querySelector('#recWindow').disabled=false;
  document.querySelector('#recTab').disabled=false;
  document.querySelector('#recStop').hidden=true;
  document.querySelector('#playButton').hidden=true;
  document.querySelector('#downloadButton').hidden=true;
  
}

function getChromeVersion () {     
    var raw = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./);

    return raw ? parseInt(raw[2], 10) : false;
}

function audioCheck() {

  includeSysAudio = false;
  document.querySelector('#sysAudio').checked =false;
  
  // Mute video so we don't play loopback audio
  var video = document.querySelector("video");
  video.muted = true;
  // Tooggle state
  includeMic = !includeMic;
  console.log('Audio =', includeMic)

  if (includeMic){
    if (document.getElementById("Audio").checked){
        navigator.webkitGetUserMedia({
        audio:true,
        video: false
    }, gotAudio, getUserMediaError);

    }
  }

};

function sysAudioCheck() {

  // Mute video so we don't play loopback audio
  var video = document.querySelector("video");
  video.muted = true;

  includeSysAudio = !includeSysAudio;
  includeMic = false;
  document.querySelector('#Audio').checked =false;
  console.log('System Audio =', includeSysAudio)

};



function recordDesktop(stream) {
  // Start Window picker with Desktop constraints
  recordedChunks = [];
  numrecordedChunks = 0;
  window.resizeTo(646, 565);
  sourceType = ["screen"];
  if (includeSysAudio)
    sourceType[1] = "audio"; 
  pending_request_id = chrome.desktopCapture.chooseDesktopMedia(
      sourceType, onAccessApproved);

};


function recordCamera(stream) {

  recordedChunks = [];
  numrecordedChunks = 0;
  
  navigator.webkitGetUserMedia({
      audio:false,
      video: { mandatory: { minWidth:1280,
                            minHeight:720 } }
  }, gotMediaStream, getUserMediaError);
};


function recordWindow(stream) {
  
  recordedChunks = [];
  numrecordedChunks = 0;
 // Start Window picker with Desktop constraints
  window.resizeTo(646, 565);

  pending_request_id = chrome.desktopCapture.chooseDesktopMedia(
      ["window"], onAccessApproved);

  // Check Audio inclusion, fire off GUM if needed

};


function recordTab(stream) {
  recordedChunks = [];
  numrecordedChunks = 0;
 // Start Window picker with Desktop constraints
  window.resizeTo(646, 565);

  sourceType = ["tab"];
  if (includeSysAudio)
    sourceType[1] = "audio"; 
  pending_request_id = chrome.desktopCapture.chooseDesktopMedia(
      sourceType, onAccessApproved);
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
 if (event.data && event.data.size > 0) {
    recordedChunks.push(event.data);
    numrecordedChunks += event.data.byteLength;
  }

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
  setTimeout(function() {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
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


function stopRecording() {
  //document.getElementById("btn").disabled = true;
  //document.getElementById("btn2").disabled = true;
  console.log('Stopping record and starting download');
  enableButtons();
  document.querySelector('#playButton').hidden=false;
  document.querySelector('#downloadButton').hidden=false;
  recorder.stop();
  localStream.getVideoTracks()[0].stop();

}

function play() {

  // Unmute video 
  var video = document.querySelector("video");
  video.muted = false;

  var blob = new Blob(recordedChunks, {type: "video/webm"});
  video.src = window.URL.createObjectURL(blob);

}

function download() {
  //document.getElementById("btn").disabled = true;
  //document.getElementById("btn2").disabled = true;
  console.log('Downloading file');
  
  saveByteArray(recordedChunks, 'test.webm');

}


function recorderOnStop() {
  console.log('recorderOnStop fired');
}

function gotMediaStream(stream) {

  console.log("Received local stream");
  var video = document.querySelector("video");
  video.src = URL.createObjectURL(stream);
  localStream = stream;
  stream.getTracks().forEach(function(track) {
    track.addEventListener('ended', function() {
      console.log(stream.id, 'track ended', track.kind, track.id);
      stopRecording();
    });
  });


  
  startTime = window.performance.now();
  var videoTracks = localStream.getVideoTracks();
  //var audioTracks = localStream.getAudioTracks();

  console.log('Checking audio')
  
  if(includeMic){
    console.log('Adding audio track')
    var audioTracks = audioStream.getAudioTracks();
    localStream.addTrack(audioTracks[0]);
  }
  if(includeSysAudio){
    console.log('Adding system audio track')
    var audioTracks = stream.getAudioTracks();
    if (audioTracks.length < 1) {
      console.log('No audio track in screen stream')
    }
  }
  else{
    console.log('Not adding audio track')
  }
  if (videoTracks.length > 0) {
    
  }


  try {
    console.log("Trying");
    recorder = new MediaRecorder(stream);
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
  stream.getTracks().forEach(function(track) {
    track.addEventListener('ended', function() {
      console.log(stream.id, 'track ended', track.kind, track.id);
    });
  });

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
      audio:{ mandatory: { chromeMediaSource: "desktop",
                            chromeMediaSourceId: id } },
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

