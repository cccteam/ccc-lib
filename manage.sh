#!/bin/bash

# Library array
LIBS=("ccc-auth" "ccc-ui")

function pack_lib() {
    (cd dist/$1 && npm pack)
}

function install_lib() {
    (cd projects/$1 && npm install)
}

function lint_lib() {
    npx ng lint "$1"
}

function build_lib() {
    npx ng build "$1"
}

function publish_lib() {
    (cd dist/$1 && npm publish)
}

# Parse command-line arguments
if [ $# -eq 0 ]; then
    echo "Usage: $0 [pack|install|lint|build|publish]"
    exit 1
fi

for target in "$@"; do
    case $target in
        pack)
            for lib in "${LIBS[@]}"; do
                pack_lib "$lib"
            done;;
        install)
            npm install
            for lib in "${LIBS[@]}"; do
                install_lib "$lib"
            done;;
        lint)
            for lib in "${LIBS[@]}"; do
                lint_lib "$lib"
            done;;
        build)
            for lib in "${LIBS[@]}"; do
                build_lib "$lib"
            done;;
        publish)
            for lib in "${LIBS[@]}"; do
                publish_lib "$lib"
            done;;
        *)
            echo "Unknown target: $target";;
    esac
done
