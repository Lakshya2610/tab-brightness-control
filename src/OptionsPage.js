/* global chrome */
import React from "react";
import "./OptionsPage.css";
import { Checkbox, Slider } from "@material-ui/core";

async function PrintOptions() {
	const keys = await chrome.storage.sync.getKeys();
	chrome.storage.sync.get(keys, (opts) => {
		console.log("Saved Options: ", opts);
	});
}

/**
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

function OptionsPage() {
	const [applyBrightnessGlobally, SetApplyBrightnessGlobally] = React.useState(false);
	const [globalBrightnessValue, SetGlobalBrightnessValue] = React.useState(100);

	React.useEffect(() => {
		chrome.storage.sync.get(
			{
				applyBrightnessGlobally: applyBrightnessGlobally,
				globalBrightnessValue: globalBrightnessValue,
			},
			(savedOpts) => {
				SetApplyBrightnessGlobally(savedOpts.applyBrightnessGlobally);
				SetGlobalBrightnessValue(savedOpts.globalBrightnessValue);
			},
		);
	}, [applyBrightnessGlobally, globalBrightnessValue]);

	React.useEffect(() => {
		PrintOptions();
	}, []);

	return (
		<div className="options-container">
			<div className="options-background"></div>
			<h1 style={{ fontSize: 36 }}>
				Extension Settings
			</h1>

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

				<div className="global-brightness-value" style={{
					color: applyBrightnessGlobally ? null : "darkgrey"
				}}>
					<label>
						Global Brightness Level:
						<Slider
							value={globalBrightnessValue}
							onChange={(_, v) =>
								SaveAndApplyChange(
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
		</div>
	);
}

export default OptionsPage;
