# Attempt to POST with an unsupported Content-Type header
POST http://localhost:8080/v1/fragments
Content-Type: application/unsupported
[BasicAuth]
user1@email.com:password1
`This is a Fragment`

HTTP/1.1 415
[Asserts]
jsonpath "$.error.message" == "Invalid content-type. Received content type: application/unsupported"
