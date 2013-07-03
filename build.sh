#!/bin/sh

ver=`node -e 'console.log(JSON.parse(require("fs").readFileSync("src/manifest.json"))["version"])' | tr -d '\n'`
mkdir -p pkgs
crx=pkgs/add-to-zaim-$ver.crx
zip=pkgs/add-to-zaim-$ver.zip
crxmake --pack-extension src --extension-output $crx  --pack-extension-key add-to-zaim.pem && echo $crx
crxmake --pack-extension src --zip-output $zip  --pack-extension-key add-to-zaim.pem && echo $zip
