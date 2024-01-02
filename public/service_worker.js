const tabBrightnesses = {};

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type === "updateBrightness") {
        if (tabBrightnesses[sender.tab.id]) {
            tabBrightnesses[sender.tab.id].brightness = request.value;
        }
        else tabBrightnesses[sender.tab.id] = { brightness: request.value, persist: false };

        sendResponse();
    }
    else if (request.type === "requestBackgroundState") {

        var temp = tabBrightnesses[sender.tab.id];
        sendResponse({
            brightness: temp ? temp.brightness : null,
            persist: temp ? temp.persist : null
        });
    }
    else if (request.type === "togglePersistence") {
        if (tabBrightnesses[sender.tab.id]) {
            tabBrightnesses[sender.tab.id].persist = request.persist;
            tabBrightnesses[sender.tab.id].brightness = request.brightness;
        }
        else tabBrightnesses[sender.tab.id] = { brightness: request.brightness, persist: request.persist };

        sendResponse();
    }
});

chrome.tabs.onUpdated.addListener(function (tabId, _changeInfo, _tab) {
    chrome.tabs.sendMessage(tabId, {
        type: "updateBrightness",
        value: tabBrightnesses[tabId],
        source: "background"
    }).catch((err) => {
        console.warn(err);
    });
});
