# POST without authentication should produce 401
POST http://localhost:8080/v1/fragments
Content-Type: text/plain
`This is a Fragment`

HTTP/1.1 401
[Asserts]
body == "Unauthorized"
