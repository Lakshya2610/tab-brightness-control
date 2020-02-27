const tabBrightnesses = {};

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if(request.type === "updateBrightness") {
        tabBrightnesses[sender.tab.id] = request.value;
        sendResponse();
    }
    else if(request.type === "requestBackgroundState") {
        sendResponse(tabBrightnesses[sender.tab.id]);
    }
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    chrome.tabs.sendMessage(tabId, { 
        type: "updateBrightness",
        value: tabBrightnesses[tabId],
        source: "background"
    });
});
