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

        if (self.fight[self.side].back == self and random() < 0.05) or random < 0.01:
            self.plan = "concede"
            return

        if random() < 0.3:
            self.plan = "summon"
            targets = [d for d, c in self.owed.items() if c >= 1]
            self.plan_target = choice(targets)
            return

        if random < 0.5:
            self.plan = "request"
            self.plan_target = choice(game.Demon.demons)
            return

        self.plan = "fire"


game.AI = TestAI

game.init()

for i in range(100000):
    game.tick()
