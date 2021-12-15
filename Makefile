#
# ビルドしてから公証
# 時間がかかる
#
app: clean
	npx electron-builder --mac --x64 --dir

# 公証しないとき - デバッグ用
appnosign:
	CSC_IDENTITY_AUTO_DISCOVERY=false npx electron-builder --mac --x64 --dir

# これはうまくいかない
#appnosign:
#	npx electron-builder --mac --x64 --dir -c.mac.identity=null

# electron-builderでDMG作成
# 公証する
dmg: clean
	npx electron-builder --mac --x64

#
# 公証したappをhdutilでdmgにして大丈夫なのだろうか?
# そんな必要はないか...
#
#dmg:
#	-/bin/rm -f dist/Space.dmg
#	hdiutil create dist/Space.dmg -volname "Space" -srcfolder dist/mac
#	scp dist/Space.dmg pitecan.com:/www/www.pitecan.com/tmp

masui: appnosign
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
