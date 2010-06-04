#!/bin/sh

cd persevereJSGI/narwhal
./bin/sea
echo "lol"
cd ../../qp
../persevereJSGI/narwhal/bin/sea
../persevereJSGI/narwhal/bin/jackup
node start-node.js
