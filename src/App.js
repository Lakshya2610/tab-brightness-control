/*global chrome*/
import React from "react";
import { withStyles, makeStyles } from "@material-ui/core/styles";
import Slider from "@material-ui/core/Slider";
import Brightness7Icon from "@material-ui/icons/Brightness7";
import { FormControlLabel, Switch } from "@material-ui/core";

import "./App.css";

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
				((_ev) => this.onDisconnectListener(tabs[0].id)).bind(this)
			);
			// ask content script for last state
			this.port.postMessage({ type: "requestState" });
			this.port.postMessage({ type: "togglePersistence", persist: true });
			this.port.onMessage.addListener(this.contentScriptListener.bind(this));
		});
	}

	contentScriptListener(response) {
		if (response.type === "state") {
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
			this.port.onDisconnect.removeListener(
				this.onDisconnectListener.bind(this)
			);

			this.port = chrome.tabs.connect(tabId);
			this.port.onDisconnect.addListener(this.onDisconnectListener.bind(this));
			// ask content script for last state
			this.port.postMessage({ type: "requestState" });
			this.port.postMessage({ type: "togglePersistence", persist: true });
			this.port.onMessage.addListener(this.contentScriptListener.bind(this));
		}
	}

	toggleBrightnessPersistence(_event, value) {
		this.port.postMessage({ type: "togglePersistence", persist: value });
		this.setState({ persist: value });
	}

	handleChange(_event, value) {
		this.port.postMessage({ type: "updateBrightness", newValue: value });
		this.setState({ sliderVal: value });
	}

	render() {
		return (
			<div className="App">
				<a
					style={{
						color: "white",
						fontSize: "200%",
						fontWeight: "lighter",
					}}
				>
					Brightness
				</a>

				<div id='slider-container'>
					<Brightness7Icon
						style={{ color: "white" }}
					/>

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
			</div>
		);
	}
}

export default App;
