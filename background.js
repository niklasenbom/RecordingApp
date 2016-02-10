
/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */



chrome.app.runtime.onLaunched.addListener(function() {
  //chrome.tabs.create('index.html');
  chrome.app.window.create('index.html', {
    bounds: {
      width: 500,
      height: 320
    }
  });
});
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  chrome.desktopCapture.chooseDesktopMedia(
      ["screen", "window"],
      function(id) {
        sendResponse({"id": id});
      });
});

