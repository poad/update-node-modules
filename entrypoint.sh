#!/usr/bin/env bash

set -eu

function main() {
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
    echo ${dev_modules}

    modules=$(echo -n $(cat package.json | jq -r ".dependencies | to_entries | .[].key"))
    echo ${modules}

    if [ "${INPUT_YARN}" == "true" ]; then
        yarn add --dev ${dev_modules}
        yarn add ${modules}
    else
        npm install --only=dev ${dev_modules}
        npm install ${modules}
	fi

    # To solve the problem of not being able to delete the node_modules directory
    rm -rf node_modules
}

main
