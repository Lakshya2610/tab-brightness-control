/*global chrome*/
import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Slider from "@material-ui/core/Slider";
import Brightness7Icon from "@material-ui/icons/Brightness7";
import { FormControlLabel, Switch, Button } from "@material-ui/core";
import "./App.css";

/**
 * @typedef {Object} ContentScriptResponse
 * @property {number} type
 * @property {number} brightness
 * @property {boolean} persist
 */

const MAX_CONNECTION_ATTEMPTS = 4;
const GLOBAL_BRIGHTNESS_OVERRIDE_NO_OVERRIDE = -1;

const MessageType = {
	RequestBackgroundState: 0,
	RequestState: 1,
	State: 2,
	UpdateBrightness: 3,
	TogglePersistence: 4,
	SaveBrightness: 5,
	Reset: 6,
};

const CustomSlider = withStyles({
	root: {
		color: "#4A90E2", // Soft blue for elegance
		height: 4,
		padding: "15px 0",
	},
	thumb: {
		height: 20,
		width: 20,
		backgroundColor: "#fff",
		border: "2px solid #4A90E2",
		marginTop: -8,
		marginLeft: -10,
		"&:focus,&:hover,&$active": {
			boxShadow: "0px 0px 8px rgba(74, 144, 226, 0.4)",
		},
	},
	active: {},
	valueLabel: {
		left: "calc(-50% + 4px)",
		color: "#fff",
	},
	track: {
		height: 4,
		borderRadius: 2,
	},
	rail: {
		height: 4,
		borderRadius: 2,
		backgroundColor: "#333",
	},
})(Slider);

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
		this.state = {
			sliderVal: 100,
			persist: false,
			globalBrightnessOverride: GLOBAL_BRIGHTNESS_OVERRIDE_NO_OVERRIDE,
		};
		this.port = null;
		this.connectionAttempts = 0;
	}

	componentDidMount() {
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			this.port = chrome.tabs.connect(tabs[0].id);
			this.port.onDisconnect.addListener(
				((_ev) => this.onDisconnectListener(tabs[0].id)).bind(this),
			);
			this.port.onMessage.addListener(this.contentScriptListener.bind(this));
			this.port.postMessage({ type: MessageType.RequestState, source: "App" });
		});

		chrome.storage.sync.get(
			{
				applyBrightnessGlobally: false,
				globalBrightnessValue: GLOBAL_BRIGHTNESS_OVERRIDE_NO_OVERRIDE,
			},
			(savedOpts) => {
				console.log(savedOpts);
				if (savedOpts.applyBrightnessGlobally === true) {
					const globalBrightness = savedOpts.globalBrightnessValue;
					if (globalBrightness >= 0 && globalBrightness <= 100) {
						this.setState({ globalBrightnessOverride: globalBrightness });
					}
				}
			},
		);
	}

	/**
	 * @param {ContentScriptResponse} response
	 */
	contentScriptListener(response) {
		if (response.type === MessageType.State) {
			if (response.brightness !== this.state.sliderVal) {
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
			this.connectionAttempts++;
			chrome.tabs.executeScript({ file: "/content.js" });
			this.port.onDisconnect.removeListener(this.onDisconnectListener.bind(this));

			this.port = chrome.tabs.connect(tabId);
			this.port.onDisconnect.addListener(this.onDisconnectListener.bind(this));
			this.port.postMessage({ type: MessageType.RequestState, source: "App" });
		}
	}

	isSliderDisabled() {
		return this.state.globalBrightnessOverride !== GLOBAL_BRIGHTNESS_OVERRIDE_NO_OVERRIDE;
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

	saveBrightnessForSite() {
		this.port.postMessage({
			type: MessageType.SaveBrightness,
			newValue: this.state.sliderVal,
			source: "App",
		});
	}

	resetBrightnessForSite() {
		this.port.postMessage({
			type: MessageType.Reset,
			source: "App",
		});

		this.setState({ persist: false, sliderVal: 100 });
	}

	render() {
		return (
			<div className="App">
				<div className="App-container">
					<h2 className="App-title">Brightness Control</h2>

					<div
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							width: "95%",
							marginBottom: "30px"
						}}
					>
						<div className="slider-container">
							<Brightness7Icon style={{ color: "#4A90E2", fontSize: "1.5rem" }} />
							<CustomSlider
								valueLabelDisplay="auto"
								defaultValue={100}
								value={this.state.sliderVal}
								onChange={this.handleChange.bind(this)}
								disabled={this.isSliderDisabled()}
							/>
						</div>

						{this.isSliderDisabled() && (
							<span>
								Global brightness set to {this.state.globalBrightnessOverride}%,
								change it in options
							</span>
						)}
					</div>

					<div className="settings-container">
						<FormControlLabel
							control={
								<Switch
									checked={this.state.persist}
									onChange={this.toggleBrightnessPersistence.bind(this)}
									color="primary"
								/>
							}
							label="Maintain Brightness"
							style={{ color: "#EAEAEA" }}
						/>

						<div className="settings-button-row">
							<Button
								variant="contained"
								style={{
									backgroundColor: "#4A90E2",
									color: "#fff",
									textTransform: "none",
								}}
								onClick={this.saveBrightnessForSite.bind(this)}
							>
								Save Brightness
							</Button>

							<Button
								variant="contained"
								style={{
									backgroundColor: "#4A90E2",
									color: "#fff",
									textTransform: "none",
									marginLeft: "5px",
								}}
								onClick={this.resetBrightnessForSite.bind(this)}
							>
								Reset
							</Button>
						</div>
					</div>

					<div className="settings-footer">
						<Button
							variant="outlined"
							style={{
								borderColor: "#4A90E2",
								color: "#4A90E2",
								textTransform: "none",
							}}
							onClick={OpenOptionsPage}
						>
							Options
						</Button>
					</div>
				</div>
			</div>
		);
	}
}

export default App;
