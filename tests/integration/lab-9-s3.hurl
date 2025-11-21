# 1. POST a new text fragment to / (your endpoint)
POST http://localhost:8080/v1/fragments
Content-Type: text/plain
[BasicAuth]
user1@email.com:password1
`Hello S3!`

HTTP/1.1 201
[Captures]
url: header "Location"

# 2. GET the fragment using the captured URL
GET {{url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
header "Content-Type" matches "^text/plain(; charset=utf-8)?$"
body == "Hello S3!"

# 3. DELETE the fragment using the URL
DELETE {{url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200

# 4. GET again, expecting a 404
GET {{url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 404
