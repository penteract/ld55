from http.server import BaseHTTPRequestHandler,HTTPServer
from http.server import *

class Handler(BaseHTTPRequestHandler):
    def send_string(self,s):
        self.send_response(200,"okay")
        b = bytes(s,"utf-8")
        self.send_header("Content-Length",str(len(b)))
        self.end_headers()
        self.flush_headers()
        self.wfile.write(b)

    def do_PUT(self):
        print("starting repl, since noone actually uses put. Remember to remove this in final version (DoS issue, not risk of server compromise)")
        while True:
            print(">>",end=" ")
            print(eval(input()))
        #self.send_response(200,"hello")


with HTTPServer(("localhost",8080),Handler) as httpd:
    httpd.serve_forever()
