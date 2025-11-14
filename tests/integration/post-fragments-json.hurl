# POST JSON fragment
POST http://localhost:8080/v1/fragments
Content-Type: application/json
[BasicAuth]
user1@email.com:password1
`{"message":"This is a fragment"}`

HTTP/1.1 201
[Asserts]
jsonpath "$.fragment.type" == "application/json"
[Captures]
url: header "Location"

# GET the fragment, expect JSON content
GET {{url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
header "Content-Type" matches "^application/json(; charset=utf-8)?$"
jsonpath "$.message" == "This is a fragment"
