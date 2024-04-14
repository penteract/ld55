from http.server import SimpleHTTPRequestHandler, HTTPServer
# from http.server import *
from urllib.parse import urlparse, parse_qs
import game
import time
import json
import random

STATIC_FILES = ["/index.html", "/", "/render.js", "/gameloop.js",
                "/serverComms.js", "/style.css", "/summoningCircle.png"]

TICK_TIME = 10


class Handler(SimpleHTTPRequestHandler):
    """subclassing seems the simplest way to send files"""

    def send_string(self, s, hs={"Content-Type": "text/plain; charset=utf-8"}):
        self.send_response(200, "okay")
        b = bytes(s, "utf-8")
        self.send_header("Content-Length", str(len(b)))
        for k, v in hs.items():
            self.send_header(k, v)
        self.end_headers()
        self.flush_headers()
        self.wfile.write(b)

    def empty_ok(self, hs={}):
        self.send_response(200, "okay")
        for k, v in hs.items():
            self.send_header(k, v)
        self.end_headers()
        self.flush_headers()

    def do_PUT(self):
        print("starting repl, since noone actually uses put. Remember to remove this in final version (DoS issue, not risk of server compromise)")
        while True:
            print(">>", end=" ")
            print(eval(input()))
        # self.send_response(200,"hello")

    def do_POST(self):
        url = urlparse(self.path)
        if url.path == "/newDemon":
            newPlayer = game.Player()
            self.send_string(newPlayer.name+"\n"+game.names.randname())
            print("new Player", newPlayer)
        elif url.path == "/setPlan":
            qs = parse_qs(urlparse(self.path).query)
            if ("name" not in qs) or len(qs["name"]) != 1:
                self.send_error(400, "No name")
                return
            elif not (d := game.Demon.demons.get(name := qs["name"][0])):
                print("Couldn't find ", name, game.Demon.demons)
                self.send_error(400, "Unknown Name")
                return
            if "tick" not in qs or len(qs["tick"]) != 1 or qs["tick"][0] != str(game.time):
                print(game.time)
                self.send_error(400, "Wrong tick")
                return
            if "plan" not in qs or len(qs["plan"]) != 1:
                self.send_error(400, "No Plan")
                return
            plan = qs["plan"][0]
            if plan not in [["wait", "look", "answer"], ["fire", "request", "summon", "request2", "answer", "concede"]][bool(d.fight)]:
                self.send_error(400, "bad plan")
                return
            elif plan in ["answer", "request", "summon"]:
                if "target" not in qs or len(qs["target"]) != 1:
                    self.send_error(400, "No Target")
                    return
                target = qs["target"][0]
                if plan == "request" and target == "Unknown":
                    target = random.choice(game.Demon.dList)
                d.plan_target = target
            d.plan = plan
            self.empty_ok()
        else:
            self.send_error(400)

    def do_GET(self):
        global last_tick
        t = time.time()
        if t > last_tick+TICK_TIME:
            game.tick()
            last_tick = t
        url = urlparse(self.path)
        if url.path in STATIC_FILES:
            return super().do_GET()
        elif url.path == "/update":
            qs = parse_qs(urlparse(self.path).query)
            if ("name" not in qs) or len(qs["name"]) != 1:
                self.send_error(400, "No name")
                print(qs)
            elif (name := qs["name"][0]) not in game.Demon.demons:
                print(name, game.Demon.demons)
                self.send_error(400, "Unknown Name")
            else:
                dat = game.build_data(game.Demon.demons[name])
                headers = {}
                headers["Content-Type"] = "application/json; charset=utf-8"
                dat["nexttick"] = (last_tick - time.time() + TICK_TIME + 0.1)
                self.send_string(json.dumps(dat), headers)
        else:
            self.send_error(404)

    def do_HEAD(self):
        url = urlparse(self.path)
        if url.path in STATIC_FILES:
            return super().do_HEAD()
        elif url.path == "/update":
            self.send_error(404)
        else:
            self.send_error(404)


if __name__ == "__main__":
    game.init(100)
    with HTTPServer(("localhost", 8080), Handler) as httpd:
        global last_tick
        last_tick = time.time()
        httpd.serve_forever()

"""API:

GET index.html
response: file

GET update?name= &truename=
response: json
type side=[{name:string,
     plan:string,
     target?:string,
     success:boolean,
     finalState:"here"|"gone"|"dead",
     health:number,
     power:number,
     human:boolean
    }]
type fight = [side,side]
{fight: null | fight,
 requests: [[name,fight]],
 debts:[string],
 changedFight:boolean,
 nexttick:number /* number of seconds until next tick*/
 tick: number
}

POST newDemon
response: name\ntruename

POST setPlan?name= &truename= &tick= &plan= &target= (request unknown)

"""
