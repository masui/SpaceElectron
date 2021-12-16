#
# appをビルドしてから公証
# 時間がかかる
#
app: clean
	npx electron-builder --mac --x64 --dir

#
# 環境編集を指定して公証をスキップする
# notarize.jsでもこの環境変数を見ている
#
appnosign:
	CSC_IDENTITY_AUTO_DISCOVERY=false npx electron-builder --mac --x64 --dir

#
# electron-builderで公開用DMG作成
# 公証する
#
dmg: clean
	npx electron-builder --mac --x64

#
# 公証したappをhdutilでdmgにして大丈夫なのかは不明
# 公開は頻繁に行なうわけではないから、上の方法を使うのがよさそう
#
#dmg:
#	-/bin/rm -f dist/Space.dmg
#	hdiutil create dist/Space.dmg -volname "Space" -srcfolder dist/mac
#	scp dist/Space.dmg pitecan.com:/www/www.pitecan.com/tmp

masui: appnosign
	- /bin/rm -r -f /Applications/Masui_Space.app
	/bin/cp -r dist/mac/Space.app /Applications/Masui_Space.app

cli:
	dist/mac/Space.app/Contents/MacOS/Space

clean:
	-/bin/rm -r -f dist

npm:
	npm install
