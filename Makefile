# dist/mac/Space.appが作られるのだが、動かないことが多い
# make enableすると動くようになる
make: clean
	npx electron-builder --mac --x64 --dir
	plutil -convert json dist/mac/Space.app/Contents/Info.plist -o - > /tmp/info.json
	ruby bin/droppable.rb /tmp/info.json > /tmp/info2.json
	plutil -convert binary1 /tmp/info2.json -o dist/mac/Space.app/Contents/Info.plist
	/bin/mv dist/mac/Space.app dist/mac/Masui_Space.app	

# /bin/mv dist/mac/masui-space.app/Contents/MacOS/Space dist/mac/masui-space.app/Contents/MacOS/masui-space

#mac:
#	electron-packager ./app serencast --overwrite --platform=darwin --arch=x64 --electronV

# これを動かすと dist/mac/Space.app が動くようになる
# ファイルに変更はないのだが、何の設定でそうなるのか全くわからない
enable:
	dist/mac/Space.app/Contents/MacOS/Space

# dist/Space....dmg が作られる
# dmgから作ったアプリを二度起動すると動く
build: clean
	npm run build --update

clean:
	-/bin/rm -r -f dist


