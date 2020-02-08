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

chrome.runtime.onConnect.addListener(function (p) {
    p.onMessage.addListener(function(msg) {
        if(msg.type === "requestState") {
            // report state to extension popup
            p.postMessage({ type: "state", brightness: (1 - tag.style.opacity) * 100 });
        }
        if(msg.type === "updateBrightness") {
            tag.style.opacity = String(1 - (msg.newValue / 100.0));
        }
    });
})
