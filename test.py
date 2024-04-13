import sys
import game
from random import random, choice


class TestAI(game.AI):
    def create_plan(self):
        if self.requests:
            if random() < 0.75:
                self.plan = "answer"
                self.plan_target = choice(self.requests)
                return

        if self.fight is None:
            self.plan = "look"
            return

        if (self.fight[self.side].back == self and random() < 0.05) or random() < 0.01:
            self.plan = "concede"
            return

        if random() < 0.3:
            self.plan = "summon"
            targets = [d for d, c in self.owed.items() if c >= 1]
            if targets:
                self.plan_target = choice(targets)
                return

        if random() < 0.5:
            self.plan = "request"
            self.plan_target = choice(list(game.Demon.demons))
            return

        self.plan = "fire"


game.AI = TestAI

num_iters=10
num_demons=10
usage = """python test.py [num_iters [num_demons]]"""

if __name__=="__main__":
    if len(sys.argv)>1:
        try:
            num_iters = int(sys.argv[1])
            if len(sys.argv)==3:
                num_demons = int(sys.argv[2])
            elif len(sys.argv)>3:
                raise Exception("Too many arguments")
        except e:
            print(usage,file=sys.stderr)
            raise e
    game.init(num_demons)


    for i in range(num_iters):
        game.tick()
