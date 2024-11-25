/* global chrome */
import React from "react";
import "./OptionsPage.css";
import { Checkbox, Slider, TextField, IconButton } from "@material-ui/core";
import { Delete as DeleteIcon, Add as AddIcon } from "@material-ui/icons";

const DEFAULT_INIT_BRIGHTNESS = 75;
const THROTTLED_WRITE_DELAY_MS = 500;

class ChromeStorageThrottledWriter {
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

function PageBrightnessTable({ savedBrightnesses, SetSavedBrightnesses }) {
	const [newSiteUrl, SetNewSiteUrl] = React.useState("");
	const [newSiteBrightness, SetNewSiteBrightness] = React.useState(DEFAULT_INIT_BRIGHTNESS);

	// Add or update the brightness for a specific website
	const handleAddSite = () => {
		if (!newSiteUrl || newSiteUrl in savedBrightnesses) {
			return;
		}

		SaveSiteBrightness(newSiteUrl, newSiteBrightness, SetSavedBrightnesses);
		SetNewSiteUrl("");
		SetNewSiteBrightness(DEFAULT_INIT_BRIGHTNESS); // Reset input fields
	};

	return (
		<div className="saved-sites-container">
			<h2>Website Brightness</h2>

			{/* Tabular Display of Saved Websites */}
			<table className="saved-sites-table">
				<thead>
					<tr>
						<th>Website URL</th>
						<th>Brightness</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{Object.entries(savedBrightnesses).map(([url, brightness]) => (
						<tr key={url}>
							<td>{url}</td>
							<td>
								<Slider
									value={brightness}
									onChange={(_, v) =>
										SaveSiteBrightness(url, v, SetSavedBrightnesses)
									}
									min={0}
									max={100}
									step={1}
									valueLabelDisplay="auto"
								/>
							</td>
							<td>
								<IconButton
									color="secondary"
									onClick={() => DeleteSiteBrightness(url, SetSavedBrightnesses)}
								>
									<DeleteIcon />
								</IconButton>
							</td>
						</tr>
					))}
					<tr key={"newsite"}>
						<td>
							<TextField
								label="URL"
								value={newSiteUrl}
								onChange={(e) => SetNewSiteUrl(e.target.value)}
								fullWidth
								sx={{
									"& .MuiInputBase-root": {
										color: "beige", // Text input color
									},
									"& .MuiInputLabel-root": {
										color: "beige", // Label color
									},
									"& .MuiOutlinedInput-root": {
										"& fieldset": {
											borderColor: "beige", // Default border color
										},
										"&:hover fieldset": {
											borderColor: "lightblue", // Hover border color
										},
										"&.Mui-focused fieldset": {
											borderColor: "blue", // Focused border color
										},
									},
								}}
								InputLabelProps={{
									style: { color: "beige" }, // Label color explicitly
								}}
								InputProps={{
									style: { color: "beige" }, // Ensures the text color is explicitly set
								}}
							/>
						</td>

						<td>
							<Slider
								value={newSiteBrightness}
								onChange={(_, v) => SetNewSiteBrightness(v)}
								min={0}
								max={100}
								step={1}
								valueLabelDisplay="auto"
							/>
						</td>

						<td>
							<IconButton
								color="primary"
								onClick={handleAddSite}
								style={{ marginLeft: 8 }}
							>
								<AddIcon />
							</IconButton>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	);
}

function OptionsPage() {
	const [applyBrightnessGlobally, SetApplyBrightnessGlobally] = React.useState(false);
	const [globalBrightnessValue, SetGlobalBrightnessValue] = React.useState(100);
	const [savedBrightnesses, SetSavedBrightnesses] = React.useState({});
	const [chromeStorageWriter, _] = React.useState(
		new ChromeStorageThrottledWriter(THROTTLED_WRITE_DELAY_MS),
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

	return (
		<div className="options-container">
			<div className="options-background"></div>
			<h1 style={{ fontSize: 36 }}>Extension Settings</h1>
			<h2>Note: page refresh is required to see changes made here</h2>

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
					<Slider
						value={globalBrightnessValue}
						onChange={(_, v) =>
							chromeStorageWriter.Write(
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
				</div>
			</div>

			{/* Saved Websites Brightness Settings */}
			<PageBrightnessTable
				savedBrightnesses={savedBrightnesses}
				SetSavedBrightnesses={SetSavedBrightnesses}
			/>
		</div>
	);
}

export default OptionsPage;
