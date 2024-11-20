/*global chrome*/
import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Slider from "@material-ui/core/Slider";
import Brightness7Icon from "@material-ui/icons/Brightness7";
import SettingsIcon from "@material-ui/icons/Settings";
import { FormControlLabel, Switch } from "@material-ui/core";

import "./App.css";

/**
 * @typedef {Object} ContentScriptResponse
 * @property {number} type
 * @property {number} brightness
 * @property {boolean} persist
 */

const MAX_CONNECTION_ATTEMPTS = 4;

const PrettoSlider = withStyles({
	root: {
		color: "#52af77",
		height: 8,
	},
	thumb: {
		height: 24,
		width: 24,
		backgroundColor: "#fff",
		border: "2px solid currentColor",
		marginTop: -8,
		marginLeft: -12,
		"&:focus,&:hover,&$active": {
			boxShadow: "inherit",
		},
	},
	active: {},
	valueLabel: {
		left: "calc(-50% + 4px)",
	},
	track: {
		height: 8,
		borderRadius: 4,
	},
	rail: {
		height: 8,
		borderRadius: 4,
	},
})(Slider);

const MessageType = {
	RequestBackgroundState: 0,
	RequestState: 1,
	State: 2,
	UpdateBrightness: 3,
	TogglePersistence: 4,
};

function OpenOptionsPage() {
	if (chrome.runtime.openOptionsPage) {
		chrome.runtime.openOptionsPage();
	} else {
		window.open(chrome.runtime.getURL("options.html"));
	}
}

class App extends React.Component {
	constructor() {
		super();
		this.state = { sliderVal: 100, persist: true };
		this.port = null;
		this.connectionAttempts = 0;
	}

	componentDidMount() {
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			this.port = chrome.tabs.connect(tabs[0].id);
			this.port.onDisconnect.addListener(
				((_ev) => this.onDisconnectListener(tabs[0].id)).bind(this),
			);
			// ask content script for last state
			this.port.onMessage.addListener(this.contentScriptListener.bind(this));
			this.port.postMessage({ type: MessageType.RequestState, source: "App" });
			this.port.postMessage({
				type: MessageType.TogglePersistence,
				persist: true,
				source: "App",
			});
		});
	}

	/**
	 * @param {ContentScriptResponse} response
	 */
	contentScriptListener(response) {
		if (response.type === MessageType.State) {
			if (response.brightness !== this.state.sliderVal) {
				// set slider value according to the tab brightness
				this.setState({
					sliderVal: Math.round(Number(response.brightness)),
					persist: response.persist,
				});
			}
		}
	}

	onDisconnectListener(tabId) {
		if (this.connectionAttempts > MAX_CONNECTION_ATTEMPTS) return;
		if (chrome.runtime.lastError) {
			// connection failed. Most likely, the content script hasn't been executed, so inject it
			this.connectionAttempts++;
			chrome.tabs.executeScript({ file: "/content.js" });
			this.port.onDisconnect.removeListener(this.onDisconnectListener.bind(this));

			this.port = chrome.tabs.connect(tabId);
			this.port.onDisconnect.addListener(this.onDisconnectListener.bind(this));
			// ask content script for last state
			this.port.postMessage({ type: MessageType.RequestState, source: "App" });
			this.port.postMessage({
				type: MessageType.TogglePersistence,
				persist: true,
				source: "App",
			});
			this.port.onMessage.addListener(this.contentScriptListener.bind(this));
		}
	}

	toggleBrightnessPersistence(_event, value) {
		this.port.postMessage({
			type: MessageType.TogglePersistence,
			persist: value,
			source: "App",
		});
		this.setState({ persist: value });
	}

	handleChange(_event, value) {
		this.port.postMessage({
			type: MessageType.UpdateBrightness,
			newValue: value,
			source: "App",
		});
		this.setState({ sliderVal: value });
	}

	render() {
		return (
			<div className="App">
				<span
					style={{
						color: "white",
						fontSize: "200%",
						fontWeight: "lighter",
					}}
				>
					Brightness
				</span>

				<div id="slider-container">
					<Brightness7Icon style={{ color: "white" }} />

					<PrettoSlider
						valueLabelDisplay="auto"
						style={{
							width: "70%",
							color: "#1976d2",
						}}
						defaultValue={100}
						value={this.state.sliderVal}
						onChange={this.handleChange.bind(this)}
					/>
				</div>

				<div className="second-row">
					<FormControlLabel
						style={{ color: "white" }}
						control={
							<Switch
								checked={this.state.persist}
								onChange={this.toggleBrightnessPersistence.bind(this)}
								value={this.state.persist}
								color="secondary"
							/>
						}
						label="Persist"
					/>

					<SettingsIcon
						style={{
							color: "white",
							cursor: "pointer",
							alignSelf: "center"
						}}
						onClick={OpenOptionsPage}
					/>
				</div>
			</div>
		);
	}
}

export default App;
