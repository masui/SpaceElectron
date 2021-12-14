make: clean
	npx electron-builder --mac --x64 --dir
	plutil -convert json dist/mac/Space.app/Contents/Info.plist -o - > /tmp/info.json
	ruby droppable.rb /tmp/info.json > /tmp/info2.json
	plutil -convert binary1 /tmp/info2.json -o dist/mac/Space.app/Contents/Info.plist

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


