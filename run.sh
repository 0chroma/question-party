#!/bin/sh

cd persevereJSGI/narwhal
bin/sea
cd ../../qp
../persevereJSGI/narwhal/bin/sea
../persevereJSGI/narwhal/bin/jackup
node start-node.js
