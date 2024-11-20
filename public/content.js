/* global chrome */
const MessageType = {
	RequestBackgroundState: 0,
	RequestState: 1,
	State: 2,
	UpdateBrightness: 3,
	TogglePersistence: 4,
};

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

function UpdateBrightness(newValue) {
	console.log(`[ControlTabBrightness]: Got new value ${newValue}`);
	if (newValue) {
		rawBrightnessVal = newValue;
		tag.style.opacity = String(1 - newValue / 100.0);
	}
}

function RespectGlobalPrefsAndUpdateBrightness(brightness, shouldPersist) {
	const keys = ["applyBrightnessGlobally", "globalBrightnessValue"];

	chrome.storage.sync.get(keys, (opts) => {
		console.log("[ControlTabBrightness]: Opts ", opts);

		const applyGlobally = opts["applyBrightnessGlobally"];
		let globalValue = opts["globalBrightnessValue"];

		if (applyGlobally === true && typeof globalValue === "number") {
			globalValue = Math.max(globalValue, 0);
			globalValue = Math.min(globalValue, Number.MAX_SAFE_INTEGER);

			UpdateBrightness(globalValue);
			persist = true;
		} else {
			UpdateBrightness(brightness);
			persist = shouldPersist;
		}
	});
}

chrome.runtime.sendMessage(
	{ type: MessageType.RequestBackgroundState },
	function responseCallback(res) {
		console.log(`[ControlTabBrightness]: Response: `, res);
		if (res.persist !== null) {
			persist = res.persist;
		}

		if (persist) {
			RespectGlobalPrefsAndUpdateBrightness(res.brightness, persist);
		}
	},
);

chrome.runtime.onConnect.addListener(function (channel) {
	console.log(`[ControlTabBrightness]: Connected to service worker on channel `, channel);
	channel.onMessage.addListener(function (msg) {
		console.log(`[ControlTabBrightness]: Message`, msg);
		switch (msg.type) {
			case MessageType.RequestState: {
				// report state to extension popup
				channel.postMessage({
					type: MessageType.State,
					brightness: (1 - tag.style.opacity) * 100,
					persist,
				});
				break;
			}

			case MessageType.UpdateBrightness: {
				RespectGlobalPrefsAndUpdateBrightness(msg.newValue, persist);

				if (msg.source === "App" && persist) {
					chrome.runtime.sendMessage(
						{ type: msg.type, value: msg.newValue, persist },
						function responseCallback() {},
					);
				}

				break;
			}

			case MessageType.TogglePersistence: {
				RespectGlobalPrefsAndUpdateBrightness(rawBrightnessVal, msg.persist);
				msg.brightness = rawBrightnessVal;
				chrome.runtime.sendMessage(msg, function responseCallback() {});
				break;
			}

			default:
				break;
		}
	});
});

RespectGlobalPrefsAndUpdateBrightness(100, true);
