#!/usr/bin/env bash
ts-node ./src/index.ts --dump-state-machine
dot -Tpng ./state-machine.dot -o ./state-machine.png
rm ./state-machine.dot
echo "Generated state-machine.png"