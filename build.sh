# need inlining disabled in react builds because of chrome extension security policy
INLINE_RUNTIME_CHUNK=false NODE_OPTIONS=--openssl-legacy-provider npm run build