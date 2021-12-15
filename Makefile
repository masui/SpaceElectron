make: clean
	npx electron-builder --mac --x64 --dir

disable:
	CSC_NAME= CSC_KEYCHAIN= CSC_IDENTITY_AUTO_DISCOVERY=false npx electron-builder --mac --x64 --dir

disable2:
	npx electron-builder --mac --x64 --dir -c.mac.identity=null

# DMG作成
make2: clean
	npx electron-builder --mac --x64

dmg: make
	hdiutil create dist/Space.dmg -volname "Space" -srcfolder dist/mac
	scp dist/Space.dmg pitecan.com:/www/www.pitecan.com/tmp

masui: make
	- /bin/rm -r -f /Applications/Masui_Space.app
	/bin/cp -r dist/mac/Space.app /Applications/Masui_Space.app

#mac:
#	electron-packager ./app serencast --overwrite --platform=darwin --arch=x64 --electronV

cli:
	dist/mac/Space.app/Contents/MacOS/Space

clean:
	-/bin/rm -r -f dist

npm:
	npm install


# electron-packager . YourAppName --platform=darwin --arch=x64 --extend-info=extend.plist
