/* global chrome */
const MessageType = {
	RequestBackgroundState: 0,
	RequestState: 1,
	State: 2,
	UpdateBrightness: 3,
	TogglePersistence: 4,
	SaveBrightness: 5,
	Reset: 6,
};

const tag = document.createElement("div");

tag.style.backgroundColor = "black";
tag.style.position = "fixed";
tag.style.width = "100%";
tag.style.height = "100%";
tag.style.opacity = "0.0";
tag.style.top = "0";
tag.style.left = "0";
tag.style.pointerEvents = "none";
tag.style.zIndex = String(Number.MAX_SAFE_INTEGER) + "";
tag.className = "control-tab-brightness-overlay";

var persist = false;
var rawBrightnessVal = 100;

function InjectOverlay() {
	const body = document.body;
	if (body) {
		document.body.appendChild(tag);
	} else {
		requestAnimationFrame(InjectOverlay);
	}
}

function LogInfo(string, ...args) {
	console.log(`[ControlTabBrightness]: ${string}`, ...args);
}

function UpdateBrightness(newValue) {
	LogInfo(`Got new value ${newValue}`);
	if (newValue) {
		rawBrightnessVal = newValue;
		tag.style.opacity = String(1 - newValue / 100.0);
	}
}

async function SaveBrightnessForPage(brightness) {
	const url = window.location.host;
	const settings = await chrome.storage.sync.get("savedBrightnesses");
	LogInfo("Settings - ", settings);

	let perPageValues = settings.savedBrightnesses;
	if (perPageValues === undefined) {
		LogInfo("Init per page values");
		perPageValues = {};
	}
	perPageValues[url] = brightness;
	settings.savedBrightnesses = perPageValues;

	chrome.storage.sync.set(settings);
}

async function Reset() {
	const url = window.location.host;
	const settings = await chrome.storage.sync.get("savedBrightnesses");

	LogInfo("Reset: resetting for page", url);

	let perPageValues = settings.savedBrightnesses;
	if (perPageValues !== undefined && url in perPageValues) {
		LogInfo("Reset: deleting saved brightness for ", url);
		delete perPageValues[url];
		await chrome.storage.sync.set(settings);
	}

	RespectGlobalPrefsAndUpdateBrightness(100, false);

	chrome.runtime.sendMessage(
		{ type: MessageType.Reset },
		function responseCallback(res) {},
	);
}

function RespectGlobalPrefsAndUpdateBrightness(brightness, shouldPersist) {
	LogInfo(`RespectGlobalPrefsAndUpdateBrightness: set ${brightness}, persist=${shouldPersist}`);
	const keys = ["applyBrightnessGlobally", "globalBrightnessValue", "savedBrightnesses"];

	chrome.storage.sync.get(keys, (opts) => {
		LogInfo("Opts ", opts);

		const applyGlobally = opts["applyBrightnessGlobally"];
		let globalValue = opts["globalBrightnessValue"];

		const perPageValues = opts["savedBrightnesses"];
		const url = window.location.host;

		if (applyGlobally === true && typeof globalValue === "number") {
			globalValue = Math.max(globalValue, 0);
			globalValue = Math.min(globalValue, Number.MAX_SAFE_INTEGER);

			UpdateBrightness(globalValue);
			persist = true;
		} else if (url in perPageValues) {
			const savedValue = perPageValues[url];
			UpdateBrightness(savedValue);
			persist = shouldPersist;
		} else {
			UpdateBrightness(brightness);
			persist = shouldPersist;
		}
	});
}

chrome.runtime.sendMessage(
	{ type: MessageType.RequestBackgroundState },
	function responseCallback(res) {
		LogInfo(`Response: `, res);
		if (res.persist !== null) {
			persist = res.persist;
		}

		if (persist) {
			RespectGlobalPrefsAndUpdateBrightness(res.brightness, persist);
		}
	},
);

chrome.runtime.onConnect.addListener(function (channel) {
	LogInfo(`Connected to service worker on channel `, channel);
	channel.onMessage.addListener(function (msg) {
		LogInfo(`Message `, msg);
		switch (msg.type) {
			case MessageType.RequestState: {
				// report state to extension popup
				channel.postMessage({
					type: MessageType.State,
					brightness: (1 - Number(tag.style.opacity)) * 100,
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

			case MessageType.SaveBrightness: {
				SaveBrightnessForPage(msg.newValue);
				break;
			}

			case MessageType.Reset: {
				Reset();
				break;
			}

			default:
				break;
		}
	});
});

InjectOverlay();
RespectGlobalPrefsAndUpdateBrightness(100, false);
