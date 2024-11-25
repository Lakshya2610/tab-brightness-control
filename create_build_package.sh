#!/bin/bash
./build.sh
BUILD_SUCCESS=$?

if [[ $BUILD_SUCCESS -eq 0 ]]; then
	zip build.zip build/ -r
fi

echo
echo "==== BUILD SUCCESS ===="
echo "Build package created - build.zip"
echo "======================="
echo
