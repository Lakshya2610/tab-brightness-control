/*global chrome*/
import React from "react";
import { Sun, Globe, Settings, RotateCcw } from "lucide-react";
import { Slider } from "./components/ui/slider";
import { Switch } from "./components/ui/switch";
import { Button } from "./components/ui/button";
import SuccessNotification from "./SuccessNotification";
import "./App.css";

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
      brightnessReason: "default",
      errored: false,
      successNotificationOpen: false,
    };
    this.port = null;
    this.connectionAttempts = 0;
    this.autoSaveTimer = null;
  }

  componentWillUnmount() {
    if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
  }

  componentDidMount() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      this.port = chrome.tabs.connect(tabs[0].id);
      this.port.onDisconnect.addListener(
        ((_ev) => this.onDisconnectListener(tabs[0].id)).bind(this)
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
        if (savedOpts.applyBrightnessGlobally === true) {
          const globalBrightness = savedOpts.globalBrightnessValue;
          if (globalBrightness >= 0 && globalBrightness <= 100) {
            this.setState({ globalBrightnessOverride: globalBrightness });
          }
        }
      }
    );
  }

  contentScriptListener(response) {
    if (response.type === MessageType.State) {
      this.setState({
        sliderVal: Math.round(Number(response.brightness)),
        persist: response.persist,
        brightnessReason: response.reason,
      });
    }
  }

  onDisconnectListener(tabId) {
    this.connectionAttempts++;
    if (this.connectionAttempts > MAX_CONNECTION_ATTEMPTS) {
      this.setState({ errored: true });
      return;
    }
    chrome.scripting.executeScript({
      target: { tabId },
      files: ["/content.js"],
    });
    this.port = chrome.tabs.connect(tabId);
    this.port.onDisconnect.addListener(
      ((_ev) => this.onDisconnectListener(tabId)).bind(this)
    );
    this.port.postMessage({ type: MessageType.RequestState, source: "App" });
    this.setState({ errored: false });
  }

  toggleBrightnessPersistence(_event, value) {
    this.port.postMessage({
      type: MessageType.TogglePersistence,
      persist: value,
      source: "App",
    });
    this.setState({ persist: value });
  }

  handleChange(value) {
    this.port.postMessage({
      type: MessageType.UpdateBrightness,
      newValue: value,
      source: "App",
    });
    this.setState({ sliderVal: value });

    if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
    this.autoSaveTimer = setTimeout(() => {
      this.saveBrightnessForSite();
    }, 600);
  }

  handleGlobalChange(value) {
    this.setState({ globalBrightnessOverride: value });
    chrome.storage.sync.set({ globalBrightnessValue: value }, () => {
      this.port.postMessage({
        type: MessageType.UpdateBrightness,
        newValue: value,
        source: "App",
      });
    });
  }

  saveBrightnessForSite() {
    this.port.postMessage({
      type: MessageType.SaveBrightness,
      newValue: this.state.sliderVal,
      source: "App",
    });
    this.setState({ successNotificationOpen: true });
  }

  resetBrightnessForSite() {
    this.port.postMessage({
      type: MessageType.Reset,
      source: "App",
    });
    this.setState({
      persist: false,
      sliderVal: 100,
      brightnessReason: "default",
    });
  }

  render() {
    const isGlobal = this.state.brightnessReason === "global_setting";
    const sliderValue = isGlobal
      ? this.state.globalBrightnessOverride
      : this.state.sliderVal;

    return (
      <div className="flex flex-col bg-surface p-4 text-white select-none">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/20">
            <Sun className="h-4 w-4 text-accent" />
          </div>
          <span className="text-sm font-semibold">Brightness Control</span>
        </div>

        {/* Slider section */}
        <div className="flex items-center gap-3 mb-1">
          {isGlobal ? (
            <Globe className="h-4 w-4 text-accent shrink-0" />
          ) : (
            <Sun className="h-4 w-4 text-muted shrink-0" />
          )}
          <Slider
            value={[sliderValue]}
            onValueChange={([v]) =>
              isGlobal ? this.handleGlobalChange(v) : this.handleChange(v)
            }
            max={100}
            step={1}
            disabled={this.state.errored}
          />
          <span className="text-xs text-muted tabular-nums w-8 text-right">
            {sliderValue}%
          </span>
        </div>

        {isGlobal && (
          <p className="text-xs text-accent/70 mt-0.5 mb-0">
            Adjusts brightness for all tabs
          </p>
        )}

        {this.state.errored && (
          <p className="text-xs text-red-400 mt-1 mb-0">
            Failed to inject brightness overlay. Please close and re-open the
            tab.
          </p>
        )}

        {/* Divider */}
        <div className="h-px bg-border my-3" />

        {/* Non-global controls */}
        {!isGlobal && (
          <>
            <div className="flex items-center justify-between mb-3">
              <label
                htmlFor="persist-switch"
                className="text-sm text-muted cursor-pointer"
              >
                Maintain Brightness
              </label>
              <Switch
                id="persist-switch"
                checked={this.state.persist}
                onCheckedChange={(v) =>
                  this.toggleBrightnessPersistence(null, v)
                }
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full mb-3"
              onClick={() => this.resetBrightnessForSite()}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Reset
            </Button>
          </>
        )}

        {/* Options link */}
        <button
          onClick={OpenOptionsPage}
          className="flex items-center justify-center gap-1.5 text-xs text-muted hover:text-white transition-colors"
        >
          <Settings className="h-3 w-3" />
          Options
        </button>

        <SuccessNotification
          open={this.state.successNotificationOpen}
          SetOpen={(v) => this.setState({ successNotificationOpen: v })}
        />
      </div>
    );
  }
}

export default App;
