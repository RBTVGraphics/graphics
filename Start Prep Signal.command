#!/bin/zsh
set -eu
cd -- "${0:A:h}"
if command -v node >/dev/null 2>&1; then
  node_bin="$(command -v node)"
elif [[ -x "$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node" ]]; then
  node_bin="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
elif [[ -x /opt/homebrew/bin/node ]]; then
  node_bin=/opt/homebrew/bin/node
elif [[ -x /usr/local/bin/node ]]; then
  node_bin=/usr/local/bin/node
else
  printf 'Node.js 18 or newer is required. Install it, then run this launcher again.\n'
  exit 1
fi
exec "$node_bin" studio.mjs "$@"
