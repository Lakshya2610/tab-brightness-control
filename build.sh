#!/bin/bash
npm run build
BUILD_SUCCESS=$?

if [[ $BUILD_SUCCESS -eq 0 ]]; then
    echo "Creating Firefox build..."
    rm -rf build-firefox
    cp -r build build-firefox
    cp public/manifest.firefox.json build-firefox/manifest.json
    rm -f build-firefox/manifest.firefox.json
    echo "Firefox build created at build-firefox/"
fi
