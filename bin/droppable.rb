#
# アプリケーションアイコンでDrag&Dropを許すようにInfo.plistを修正
#
require 'json'

json = ARGV.shift

data = JSON.parse(File.read(json))

d = {}
d['CFBundleTypeName'] = "All Files"
d['LSHandlerRank'] = "Owner"
d['LSItemContentTypes'] = [
  "public.text",
  "public.data",
  "public.content"
]
data['CFBundleDocumentTypes'] = [d]

puts data.to_json

