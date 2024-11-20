from typing import Dict
import os
import json

SCRIPT_PATH = os.path.abspath(__file__).rstrip("postbuild.py")
BASE_BUILD_PATH = os.path.join(SCRIPT_PATH, "build")

def parse_asset_manifest() -> Dict[str, str]:
	with open(os.path.join(BASE_BUILD_PATH, "asset-manifest.json"), "r") as f:
		manifest = json.load(f)
		assert "files" in manifest
		return manifest.get("files", {})

def main():
	manifest = parse_asset_manifest()
	options_js = manifest.get("options.js", None)
	runtime_options_js = manifest.get("runtime-options.js", None)
	assert options_js is not None
	assert runtime_options_js is not None

	print(f"inserting options.js path: {options_js}")
	print(f"inserting runtime_options.js path: {runtime_options_js}")

	options_html = ""
	with open(os.path.join(BASE_BUILD_PATH, "options.html"), "r") as f:
		options_html = "".join(f.readlines())

	options_html = options_html.replace("<runtime_options_js_path>", f".{runtime_options_js}")
	options_html = options_html.replace("<options_js_path>", f".{options_js}")

	with open(os.path.join(BASE_BUILD_PATH, "options.html"), "w") as f:
		f.write(options_html)

if __name__ == "__main__":
	main()
