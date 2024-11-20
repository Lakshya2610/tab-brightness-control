/* global chrome */
import React from "react";
import "./OptionsPage.css";
import { Checkbox, Slider, TextField, Button } from "@material-ui/core";

const THROTTLED_WRITE_DELAY_MS = 500;

class ChromeStorageThrottledWrite {
	constructor(writeDelay) {
		this.delay = writeDelay;
		this.timeout = undefined;
	}

	Write(value, key, setfunc) {
		clearTimeout(this.timeout);

		this.timeout = setTimeout(() => {
			console.log(`[ChromeStorageThrottledWrite]: flushing ${key} : ${value}`);
			SaveAndApplyChange(value, key, setfunc);
		}, this.delay);

		setfunc(value);
	}
}

/**
 * Save and Apply changes to Chrome storage
 * @param {any} value
 * @param {string} key
 * @param {CallableFunction} setfunc
 */
function SaveAndApplyChange(value, key, setfunc) {
	const setobject = {};
	setobject[key] = value;
	chrome.storage.sync.set(setobject);

	setfunc(value);
}

/**
 * Save brightness for a specific website
 * @param {string} url
 * @param {number} brightness
 * @param {CallableFunction} setSavedBrightnesses
 */
function SaveSiteBrightness(url, brightness, setSavedBrightnesses) {
	chrome.storage.sync.get("savedBrightnesses", (result) => {
		const updatedBrightnesses = result.savedBrightnesses || {};
		updatedBrightnesses[url] = brightness;
		chrome.storage.sync.set({ savedBrightnesses: updatedBrightnesses });
		setSavedBrightnesses(updatedBrightnesses);
	});
}

/**
 * Delete saved brightness for a specific website
 * @param {string} url
 * @param {CallableFunction} setSavedBrightnesses
 */
function DeleteSiteBrightness(url, setSavedBrightnesses) {
	chrome.storage.sync.get("savedBrightnesses", (result) => {
		const updatedBrightnesses = result.savedBrightnesses || {};
		delete updatedBrightnesses[url];
		chrome.storage.sync.set({ savedBrightnesses: updatedBrightnesses });
		setSavedBrightnesses(updatedBrightnesses);
	});
}

function OptionsPage() {
	const [applyBrightnessGlobally, SetApplyBrightnessGlobally] = React.useState(false);
	const [globalBrightnessValue, SetGlobalBrightnessValue] = React.useState(100);
	const [savedBrightnesses, SetSavedBrightnesses] = React.useState({});
	const [newSiteUrl, SetNewSiteUrl] = React.useState("");
	const [newSiteBrightness, SetNewSiteBrightness] = React.useState(50);
	const [globalBrightnessWriter, _] = React.useState(
		new ChromeStorageThrottledWrite(THROTTLED_WRITE_DELAY_MS),
	);

	// Load options from Chrome storage
	React.useEffect(() => {
		chrome.storage.sync.get(
			{
				applyBrightnessGlobally: applyBrightnessGlobally,
				globalBrightnessValue: globalBrightnessValue,
				savedBrightnesses: savedBrightnesses,
			},
			(savedOpts) => {
				console.log(savedOpts);
				SetApplyBrightnessGlobally(savedOpts.applyBrightnessGlobally);
				SetGlobalBrightnessValue(savedOpts.globalBrightnessValue);
				SetSavedBrightnesses(savedOpts.savedBrightnesses || {});
			},
		);
	}, []);

	// Add or update the brightness for a specific website
	const handleAddSite = () => {
		if (!newSiteUrl) {
			return;
		}

		SaveSiteBrightness(newSiteUrl, newSiteBrightness, SetSavedBrightnesses);
		SetNewSiteUrl("");
		SetNewSiteBrightness(50); // reset the input fields
	};

	return (
		<div className="options-container">
			<div className="options-background"></div>
			<h1 style={{ fontSize: 36 }}>Extension Settings</h1>

			{/* Global Brightness Settings */}
			<div className="global-brightness-setting-container">
				<label>
					Apply Brightness Globally:
					<Checkbox
						checked={applyBrightnessGlobally}
						onChange={(_, v) =>
							SaveAndApplyChange(
								v,
								"applyBrightnessGlobally",
								SetApplyBrightnessGlobally,
							)
						}
					/>
				</label>

				<div
					className="global-brightness-value"
					style={{ color: applyBrightnessGlobally ? null : "darkgrey" }}
				>
					<label>
						Global Brightness Level:
						<Slider
							value={globalBrightnessValue}
							onChange={(_, v) =>
								globalBrightnessWriter.Write(
									v,
									"globalBrightnessValue",
									SetGlobalBrightnessValue,
								)
							}
							disabled={!applyBrightnessGlobally}
							min={0}
							max={100}
							step={1}
							valueLabelDisplay="auto"
						/>
					</label>
				</div>
			</div>

			{/* Saved Websites Brightness Settings */}
			<div className="saved-sites-container">
				<h2>Saved Brightness for Websites</h2>
				<div className="add-site-form">
					<TextField
						label="Website URL"
						value={newSiteUrl}
						onChange={(e) => SetNewSiteUrl(e.target.value)}
						fullWidth
					/>
					<Slider
						value={newSiteBrightness}
						onChange={(_, v) => SetNewSiteBrightness(v)}
						min={0}
						max={100}
						step={1}
						valueLabelDisplay="auto"
					/>
					<Button
						variant="contained"
						color="primary"
						onClick={handleAddSite}
						style={{ marginTop: 10 }}
					>
						Add/Update Site
					</Button>
				</div>

				{/* Display List of Saved Websites */}
				<div className="saved-sites-list">
					{Object.entries(savedBrightnesses).map(([url, brightness]) => (
						<div key={url} className="saved-site-item">
							<div>{url}</div>
							<div>Brightness: {brightness}</div>
							<Button
								variant="contained"
								color="secondary"
								onClick={() => DeleteSiteBrightness(url, SetSavedBrightnesses)}
							>
								Delete
							</Button>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

export default OptionsPage;
