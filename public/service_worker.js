/* global chrome */
const MessageType = {
	RequestBackgroundState: 0,
	RequestState: 1,
	State: 2,
	UpdateBrightness: 3,
	TogglePersistence: 4,
	SaveBrightness: 5,
	Reset: 6
};

const tabBrightnesses = {};

function SendMessage(recv, msg) {
	chrome.tabs.sendMessage(recv, msg).catch((err) => {
		console.warn(err);
	});
}

chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
	let response = null;
	switch (request.type) {
		case MessageType.RequestBackgroundState: {
			var targetTabID = sender.tab.id;

			var temp = tabBrightnesses[targetTabID];
			response = {
				brightness: temp ? temp.brightness : null,
				persist: temp ? temp.persist : null,
			};

			sendResponse(response);
			return;
		}

		case MessageType.UpdateBrightness: {
			if (!request.persist) {
				if (sender.tab.id in tabBrightnesses) {
					delete tabBrightnesses[sender.tab.id];
				}
			}

			if (sender.tab.id in tabBrightnesses) {
				tabBrightnesses[sender.tab.id].brightness = request.value;
			} else {
				tabBrightnesses[sender.tab.id] = {
					brightness: request.value,
					persist: request.persist,
				};
			}

			sendResponse();
			return;
		}

		case MessageType.TogglePersistence: {
			if (sender.tab.id in tabBrightnesses) {
				tabBrightnesses[sender.tab.id].persist = request.persist;
				tabBrightnesses[sender.tab.id].brightness = request.brightness;
			} else {
				tabBrightnesses[sender.tab.id] = {
					brightness: request.brightness,
					persist: request.persist,
				};
			}

			sendResponse();
			return;
		}

		case MessageType.Reset: {
			if (sender.tab.id in tabBrightnesses) {
				delete tabBrightnesses[sender.tab.id];
			}

			sendResponse();
			return;
		}

		default:
			sendResponse();
			return;
	}
});

chrome.tabs.onUpdated.addListener(function (tabId, _changeInfo, _tab) {
	chrome.tabs
		.sendMessage(tabId, {
			type: MessageType.UpdateBrightness,
			value: tabBrightnesses[tabId],
			source: "background",
		})
		.catch((err) => {
			console.warn(err);
		});
});
