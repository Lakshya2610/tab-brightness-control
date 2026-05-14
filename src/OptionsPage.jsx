/* global chrome */
import React from "react";
import "./OptionsPage.css";
import { Slider } from "./components/ui/slider";
import { Checkbox } from "./components/ui/checkbox";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Globe, Monitor, Trash2, Plus, Sun } from "lucide-react";

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
      SaveAndApplyChange(value, key, setfunc);
    }, this.delay);
    setfunc(value);
  }
}

function SaveAndApplyChange(value, key, setfunc) {
  const setobject = {};
  setobject[key] = value;
  chrome.storage.sync.set(setobject);
  setfunc(value);
}

function SaveSiteBrightness(writer, url, brightness, setSavedBrightnesses) {
  chrome.storage.sync.get("savedBrightnesses", (result) => {
    const updatedBrightnesses = result.savedBrightnesses || {};
    updatedBrightnesses[url] = brightness;
    writer.Write(updatedBrightnesses, "savedBrightnesses", setSavedBrightnesses);
  });
}

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
  const [chromeStorageWriter] = React.useState(
    new ChromeStorageThrottledWriter(THROTTLED_WRITE_DELAY_MS)
  );

  const handleAddSite = () => {
    if (!newSiteUrl || newSiteUrl in savedBrightnesses) return;
    savedBrightnesses[newSiteUrl] = newSiteBrightness;
    SaveAndApplyChange(savedBrightnesses, "savedBrightnesses", SetSavedBrightnesses);
    SaveSiteBrightness(chromeStorageWriter, newSiteUrl, newSiteBrightness, SetSavedBrightnesses);
    SetNewSiteUrl("");
    SetNewSiteBrightness(DEFAULT_INIT_BRIGHTNESS);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleAddSite();
  };

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10">
          <Monitor className="h-3.5 w-3.5 text-accent" />
        </div>
        <h2 className="text-base font-semibold">Per-Site Brightness</h2>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {/* Header row */}
        <div className="grid grid-cols-[1fr_140px_52px] gap-2 border-b border-border bg-surface/50 px-4 py-2.5">
          <span className="text-xs font-medium text-muted uppercase tracking-wider">URL</span>
          <span className="text-xs font-medium text-muted uppercase tracking-wider">Brightness</span>
          <span></span>
        </div>

        {/* Existing sites */}
        {Object.entries(savedBrightnesses).length > 0 ? (
          Object.entries(savedBrightnesses).map(([url, brightness]) => (
            <div
              key={url}
              className="grid grid-cols-[1fr_140px_52px] gap-2 items-center border-b border-border/50 last:border-0 px-4 py-2 hover:bg-white/[0.02] transition-colors"
            >
              <span className="text-sm text-muted truncate">{url}</span>
              <div className="py-1">
                <Slider
                  value={[brightness]}
                  onValueChange={([v]) =>
                    SaveSiteBrightness(chromeStorageWriter, url, v, SetSavedBrightnesses)
                  }
                  max={100}
                  step={1}
                />
              </div>
              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => DeleteSiteBrightness(url, SetSavedBrightnesses)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-400" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="px-4 py-6 text-center text-sm text-muted">
            No saved sites yet. Add one below.
          </div>
        )}

        {/* Add new site row */}
        <div className="grid grid-cols-[1fr_140px_52px] gap-2 items-center border-t border-border px-4 py-2.5 bg-surface/30">
          <Input
            placeholder="Enter URL..."
            value={newSiteUrl}
            onChange={(e) => SetNewSiteUrl(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="py-1">
            <Slider
              value={[newSiteBrightness]}
              onValueChange={([v]) => SetNewSiteBrightness(v)}
              max={100}
              step={1}
            />
          </div>
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleAddSite}
              disabled={!newSiteUrl}
            >
              <Plus className="h-4 w-4 text-accent" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OptionsPage() {
  const [applyBrightnessGlobally, SetApplyBrightnessGlobally] = React.useState(false);
  const [globalBrightnessValue, SetGlobalBrightnessValue] = React.useState(100);
  const [savedBrightnesses, SetSavedBrightnesses] = React.useState({});
  const [chromeStorageWriter] = React.useState(
    new ChromeStorageThrottledWriter(THROTTLED_WRITE_DELAY_MS)
  );
  const [forceUpdateTrigger, SetForceUpdateTrigger] = React.useState(0);

  React.useEffect(() => {
    if (!chrome || !chrome.storage || !chrome.storage.sync) return () => {};
    try {
      chrome.storage.sync.get(
        {
          applyBrightnessGlobally: false,
          globalBrightnessValue: 100,
          savedBrightnesses: {},
        },
        (savedOpts) => {
          SetApplyBrightnessGlobally(savedOpts.applyBrightnessGlobally);
          SetGlobalBrightnessValue(savedOpts.globalBrightnessValue);
          SetSavedBrightnesses(savedOpts.savedBrightnesses || {});
        }
      );
    } catch (e) {
      console.log(e);
    }
    return () => {};
  }, [forceUpdateTrigger]);

  React.useEffect(() => {
    const t = setTimeout(() => SetForceUpdateTrigger(1), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-surface text-white">
      <div className="mx-auto max-w-2xl px-5 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/20">
            <Sun className="h-4 w-4 text-accent" />
          </div>
          <h1 className="text-xl font-bold">Extension Settings</h1>
        </div>
        <p className="text-sm text-muted ml-11 mb-9">
          Note: page refresh is required to see changes
        </p>

        {/* Global Brightness */}
        <div className="rounded-xl border border-border bg-card p-5 mb-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10">
              <Globe className="h-3.5 w-3.5 text-accent" />
            </div>
            <h2 className="text-base font-semibold">Global Brightness</h2>
          </div>

          <label className="flex items-center gap-3 text-sm cursor-pointer mb-5">
            <Checkbox
              checked={applyBrightnessGlobally}
              onCheckedChange={(v) =>
                SaveAndApplyChange(v, "applyBrightnessGlobally", SetApplyBrightnessGlobally)
              }
            />
            <span className={applyBrightnessGlobally ? "text-white" : "text-muted"}>
              Apply Brightness Globally
            </span>
          </label>

          <div className="flex items-center gap-3 pl-7">
            <span className="text-xs text-muted w-8 text-right tabular-nums">0%</span>
            <Slider
              value={[globalBrightnessValue]}
              onValueChange={([v]) =>
                chromeStorageWriter.Write(v, "globalBrightnessValue", SetGlobalBrightnessValue)
              }
              disabled={!applyBrightnessGlobally}
              max={100}
              step={1}
            />
            <span className="text-xs text-muted w-8 tabular-nums">100%</span>
          </div>
        </div>

        {/* Per-Site Brightness */}
        <PageBrightnessTable
          savedBrightnesses={savedBrightnesses}
          SetSavedBrightnesses={SetSavedBrightnesses}
        />
      </div>
    </div>
  );
}

export default OptionsPage;
