#!/bin/bash

# Library array
LIBS=("ccc-auth" "ccc-ui")

function pack_lib() {
    (cd dist/$1 && npm pack)
}

function install_lib() {
    npm install
    (cd projects/$1 && npm install)
}

function ci_lib() {
    (cd projects/$1 && npm ci)
}

function lint_lib() {
    (cd projects/$1 && ng lint)
}

function build_lib() {
    ng build "$1"
}

function publish_lib() {
    (cd dist/$1 && npm publish)
}

# Parse command-line arguments
if [ $# -eq 0 ]; then
    echo "Usage: $0 [pack|install|ci|lint|build|publish]"
    exit 1
fi

for target in "$@"; do
    # Composite action for all libraries
    case $target in
        pack)
            for lib in "${LIBS[@]}"; do
                pack_lib "$lib"
            done;;
        install)
            for lib in "${LIBS[@]}"; do
                install_lib "$lib"
            done;;
        ci)
            for lib in "${LIBS[@]}"; do
                ci_lib "$lib"
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
