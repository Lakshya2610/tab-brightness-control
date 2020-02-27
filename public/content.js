var tag = document.createElement('div');
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

function updateBrightness(newValue) {
    if(newValue)
        tag.style.opacity = String(1 - (newValue / 100.0));
}

chrome.runtime.sendMessage({ type: "requestBackgroundState" }, function responseCallback(res) {
    updateBrightness(res);
});

chrome.runtime.onConnect.addListener(function (p) {

    p.onMessage.addListener(function(msg) {
        if(msg.type === "requestState") {
            // report state to extension popup
            p.postMessage({ type: "state", brightness: (1 - tag.style.opacity) * 100 });
        }
        if(msg.type === "updateBrightness") {
            updateBrightness(msg.newValue);

            if(msg.source === undefined) {
                chrome.runtime.sendMessage({ type: msg.type, value: msg.newValue }, function responseCallback() {});
            }
        }
    });
});
