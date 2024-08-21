#!/bin/sh
EXCLUDE_FILES=LICENSE README.md webxdc.js *~ *.xdc *.sh
MAX_SIZE=100000			# 100 kilobytes

rm application.xdc
zip -9 --recurse-paths application.xdc --exclude $EXCLUDE_FILES -- *
unzip -l application.xdc

# Check package size.
if [ $(wc -c < application.xdc) -ge $MAX_SIZE ]; then
    echo "WARNING: package size exceeded 100 kilobytes"
fi
