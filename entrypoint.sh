#!/usr/bin/env bash

set -eu

HUSKY_SKIP_INSTALL_ORG="${HUSKY_SKIP_INSTALL:+1}"
export HUSKY_SKIP_INSTALL="1"

function main() {
    if [ "${INPUT_DEBUG}" == "true" ]; then
        set -x
    fi
    if [ -d "${INPUT_PATH}" ]; then
    	cd ${INPUT_PATH}
    else
        if [ -f "${INPUT_PATH}" ]; then
            DIR=$(dirname "${INPUT_PATH}")
            cd "${DIR}"
            if [ -n "package.json" ]; then
                echo "no package.json found"
                exit 1;
            fi
        else
            echo "Invalid path ${INPUT_PATH}"
            exit 1;
        fi
    fi
    # parse package.json
    dev_modules=$(echo -n $(cat package.json | jq -r ".devDependencies | to_entries | .[].key"))
    echo -e -n "dev modules: ${dev_modules}\n"

    modules=$(echo -n $(cat package.json | jq -r ".dependencies | to_entries | .[].key"))
    echo ${modules}
    echo -e -n "modules: ${modules}\n"

    if [ "${INPUT_YARN}" == "true" ]; then
        if [ -n "${dev_modules}" ]; then
            yarn add --dev ${dev_modules}
        else
            echo "Skip the dev module update"
        fi
        if [ -n "${dev_modules}" ]; then
            yarn add ${modules}
        else
            echo "Skip the module update"
        fi
    else
        npm update
        if [ -n "${dev_modules}" ]; then
            npm install --only=dev ${dev_modules}
        else
            echo "Skip the dev module update"
        fi
        if [ -n "${dev_modules}" ]; then
            npm install ${modules}
        else
            echo "Skip the module update"
        fi
	fi

    # To solve the problem of not being able to delete the node_modules directory
    rm -rf node_modules
}

main

if [ -n ${HUSKY_SKIP_INSTALL_ORG} ]; then
    export HUSKY_SKIP_INSTALL=${HUSKY_SKIP_INSTALL_ORG}
else
    unset HUSKY_SKIP_INSTALL
fi
