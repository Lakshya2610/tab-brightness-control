#!/bin/bash
./build.sh
BUILD_SUCCESS=$?

if [[ $BUILD_SUCCESS -eq 0 ]]; then
	zip build.zip build/ -r
	zip build-firefox.zip build-firefox/ -r
fi

echo
echo "==== BUILD SUCCESS ===="
echo "Chrome build package created - build.zip"
echo "Firefox build package created - build-firefox.zip"
echo "======================="
echo
