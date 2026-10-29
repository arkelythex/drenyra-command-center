#!/usr/bin/env bash
# Polyglot runtime gate: runs the Go modules under services/ and, when present,
# any Rust crates under engines/. Fails on the first non-zero exit.
set -euo pipefail

cd "$(dirname "$0")/../.."

status=0

if command -v go >/dev/null 2>&1; then
  while IFS= read -r gomod; do
    module_dir="$(dirname "$gomod")"
    echo "== go test ${module_dir}"
    if ! (cd "$module_dir" && go test ./...); then
      status=1
    fi
  done < <(find services -name go.mod -not -path '*/node_modules/*' | sort)
else
  echo "== go toolchain not found; skipping Go modules"
fi

if command -v cargo >/dev/null 2>&1; then
  while IFS= read -r manifest; do
    crate_dir="$(dirname "$manifest")"
    echo "== cargo test ${crate_dir}"
    if ! (cd "$crate_dir" && cargo test); then
      status=1
    fi
  done < <(find engines -name Cargo.toml -not -path '*/target/*' | sort)
else
  echo "== rust toolchain not found; skipping Rust crates"
fi

exit "$status"
