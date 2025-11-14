# POST with charset in Content-Type header
POST http://localhost:8080/v1/fragments
Content-Type: text/plain; charset=utf-8
[BasicAuth]
user1@email.com:password1
`This is a Fragment`

HTTP/1.1 201
[Asserts]
jsonpath "$.fragment.type" == "text/plain; charset=utf-8"
[Captures]
url: header "Location"

# GET the fragment to confirm type with charset
GET {{url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
header "Content-Type" matches "^text/plain(; charset=utf-8)?$"
body == "This is a Fragment"
