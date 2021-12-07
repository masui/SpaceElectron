#
# アプリケーションアイコンでDrag&Dropを許す
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

