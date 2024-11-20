#!/bin/bash
# need inlining disabled in react builds because of chrome extension security policy
INLINE_RUNTIME_CHUNK=false NODE_OPTIONS=--openssl-legacy-provider npm run build
BUILD_SUCCESS=$?

if [[ $BUILD_SUCCESS -eq 0 ]]; then
    python3 postbuild.py
fi
