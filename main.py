from http.server import SimpleHTTPRequestHandler,HTTPServer
#from http.server import *
from urllib.parse import urlparse, parse_qs
import game
import time
import json

class Handler(SimpleHTTPRequestHandler):
    """subclassing seems the simplest way to send files"""
    def send_string(self,s,hs={}):
        self.send_response(200,"okay")
        b = bytes(s,"utf-8")
        self.send_header("Content-Length",str(len(b)))
        for k,v in hs.items():
            self.send_header(k,v)
        self.end_headers()
        self.flush_headers()
        self.wfile.write(b)

    def do_PUT(self):
        print("starting repl, since noone actually uses put. Remember to remove this in final version (DoS issue, not risk of server compromise)")
        while True:
            print(">>",end=" ")
            print(eval(input()))
        #self.send_response(200,"hello")
    def do_GET(self):
        global last_tick
        url = urlparse(self.path)
        if url.path in ["/index.html","/"]:
            return super().do_GET()
        elif url.path=="/update":
            qs = parse_qs(urlparse(self.path).query)
            if name not in qs:
                self.send_error
            headers={}
            headers["Content-Type"]="application/json"
            self.send_string(json.dumps() ,headers)
        else:
            self.send_error(404)
    def do_HEAD(self):
        url = urlparse(self.path)
        if url.path in ["/index.html","/"]:
            return super().do_HEAD()
        elif url.path=="/update":
            self.send_error(404)
        else:
            self.send_error(404)





with HTTPServer(("localhost",8080),Handler) as httpd:
    global last_tick
    last_tick=time.time()
    httpd.serve_forever()

"""API:

GET index.html
response: file

GET update?name= &truename=
response: json
type side=[{name:string,
     action:string,
     target?:string,
     success:boolean,
     finalState:"here"|"gone"|"dead",
     hp:number,
     power:number,
     human:boolean
    }]
type fight = [side,side]
{fight: null | fight,
 requests: [[name,fight]],
 debts:[string]
 nexttick:number /* number of seconds until next tick*/
 tick: number
}

POST newDemon
response: name

POST setPlan?tick= &plan= &target= (request unknown)

"""
