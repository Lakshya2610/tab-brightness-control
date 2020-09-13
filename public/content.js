const tag = document.createElement("div");
document.body.appendChild(tag);

tag.style.backgroundColor = "black";
tag.style.position = "fixed";
tag.style.width = "100%";
tag.style.height = "100%";
tag.style.opacity = "0.0";
tag.style.top = "0";
tag.style.left = "0";
tag.style.pointerEvents = "none";
tag.style.zIndex = String(Number.MAX_SAFE_INTEGER) + "";

var persist = false;
var rawBrightnessVal = 100;

function updateBrightness(newValue) {
  if (newValue) {
    rawBrightnessVal = newValue;
    tag.style.opacity = String(1 - newValue / 100.0);
  }
}

chrome.runtime.sendMessage(
  { type: "requestBackgroundState" },
  function responseCallback(res) {
    if (res.persist !== null) persist = res.persist;
    if (persist) updateBrightness(res.brightness);
  }
);

chrome.runtime.onConnect.addListener(function (p) {
  p.onMessage.addListener(function (msg) {
    if (msg.type === "requestState") {
      // report state to extension popup
      p.postMessage({
        type: "state",
        brightness: (1 - tag.style.opacity) * 100,
        persist,
      });
    }
    if (msg.type === "updateBrightness") {
      updateBrightness(msg.newValue);

      if (msg.source === undefined && persist) {
        chrome.runtime.sendMessage(
          { type: msg.type, value: msg.newValue, persist },
          function responseCallback() {}
        );
      }
    }
    if (msg.type === "togglePersistence") {
      persist = msg.persist;
      msg.brightness = rawBrightnessVal;
      chrome.runtime.sendMessage(msg, function responseCallback() {});
    }
  });
});
