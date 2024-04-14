import traceback
import names
from collections import defaultdict
from random import random, choice
# Game state is a global variable.
# This is reasonable for a game jam

# Plan is always one of below:
# Actions outside fight:
#  look for fight
#  wait
#  Answer "name"
# Actions in a fight:
#  Summon "name"
#  Request "name"
#  Request2 (waiting for an answer to the Request last turn)
#  Fire
#  Answer "name"
# surrender?
# In both cases Answer "name" requires "name" to be in the demon's requests

time = 0
MAXHEALTH = 10


def win(d):
    if d is None:
        print("surprising - a fight ending without any demons left")
    else:
        d.win()


class FightSide:
    def __init__(self):
        # a linked list of demons
        self.front = None
        self.back = None

    def __iter__(self):
        x = self.back
        while x is not None:
            yield x
            x = x.next

    def empty(self):
        if self.front is None:
            assert self.back is None
            return True
        assert self.back is not None, (self, list(self), self.front, self.back)
        return False

    def __bool__(self):
        return not self.empty()

    def __str__(self):
        return "[*"+",".join(d.name for d in self)+"*]"

    def serialize(self):
        return [d.serialize() for d in self]


class dset():
    """dictionary pretending to be a set to make it deterministic"""

    def __init__(self):
        self.d = {}

    def add(self, x):
        self.d[x] = None

    def remove(self, x):
        self.d.pop(x)

    def pop(self):
        k, v = self.d.popitem()
        return k

    def __bool__(self):
        return bool(self.d)

    def __iter__(self):
        return iter(self.d)


class Fight:
    fights = dset()

    def __init__(self):
        self.side0 = FightSide()
        self.side1 = FightSide()
        Fight.fights.add(self)

    def __getitem__(self, idx):
        if idx == 0:
            return self.side0
        if idx == 1:
            return self.side1
        raise IndexError(self, idx)

    def side(self, idx):
        return self[idx]

    def opp(self, idx):
        return self[1-idx]

    def serialize(self):
        return [side.serialize() for side in [self.side0, self.side1]]

    def end(self):
        print("Fight ended!", [d.name for d in self.side0], [
              d.name for d in self.side1])
        for side in [self.side0, self.side1]:
            for d in list(side):
                d.remove()
                if isinstance(d, Demon) and not d.acted:
                    d.plan = "wait"
                # (Toby: knowing the old plan might be helpful for UI)
            assert side.empty()
        print("removing", self)
        Fight.fights.remove(self)

    def __str__(self):
        return repr(self)+str(self.side0)+"vs"+str(self.side1)


class LinkedListElt():
    def __init__(self):
        self.next = None
        self.prev = None
        self.side = 2
        self.fight = None

    def insert_after(self, summoner, fight=None, side=None):
        assert self.fight is None
        if summoner is None:
            self.next = fight[side].back
            fight[side].back = self
        else:
            if fight is not None or side is not None:
                assert summoner.fight == fight
                assert summoner.side == side
            else:
                fight = summoner.fight
                side = summoner.side
            self.next = summoner.next
            summoner.next = self
        self.prev = summoner
        if self.next is not None:
            self.next.prev = self
        else:
            fight[side].front = self
        self.fight = fight
        self.side = side

    def remove(self):
        """remove self from the linked list that is its fight"""
        assert self.fight is not None
        if self.prev is None:
            assert self.fight[self.side].back is self
            self.fight[self.side].back = self.next
        else:
            self.prev.next = self.next
        if self.next is not None:
            self.next.prev = self.prev
        else:
            self.fight[self.side].front = self.prev

        self.fight = None
        self.next = None
        self.prev = None
        self.side = 2

    def replace(self, elt):
        assert elt.fight is None
        elt.next = self.next
        elt.prev = self.prev
        elt.fight = self.fight
        elt.side = self.side

        if self.prev is None:
            self.fight[self.side].back = elt
        else:
            self.prev.next = elt

        if self.next is None:
            self.fight[self.side].front = elt
        else:
            self.next.prev = elt

        self.next = None
        self.prev = None
        self.fight = None
        self.side = 2


class SummoningCircle(LinkedListElt):
    def __init__(self, summoner, time):
        super().__init__()

        self.summoner = summoner
        self.time = time
        self.name = f"{summoner.name}'s summoning circle"
        self.insert_after(summoner)

    def tick(self):
        self.time -= 1
        if self.time <= 0:
            self.remove()

    def serialize(self):
        return {"circle": self.summoner.serialize()}

    def hit(self):
        if self.prev:
            self.prev.hit()


class Demon(LinkedListElt):
    demons = {}
    summons = dset()
    looking = dset()

    def serialize(self):
        res = {}
        for k in ["name", "power", "score", "health", "plan", "summoned_this_turn"]:
            res[k] = getattr(self, k)
        return res

    def __init__(self):
        super().__init__()

        # Fixed data
        name = names.randname()
        while name in Demon.demons:
            name = names.randname()
            # with enough players, this loop could become very slow (and eventually never terminate), but I think other stuff becomes very slow long before that
        self.name = name
        Demon.demons[name] = self
        self.born = time

        # stats
        self.power = 1
        self.score = 0

        # summoning debts (map from demon names to number of times owed)
        # summoning debts owed to this demon by others.
        self.owed = defaultdict(int)
        # summoning debts owed by this demon to others. (needed to cancel debts when it dies
        self.owes = defaultdict(int)

        # fight data
        self.health = MAXHEALTH

        self.dead = False

        # transient data (doesn't last longer than a tick)
        self.requests = []
        self.plan = "wait"
        self.plan_target = None
        self.init_tick()

    def init_tick(self):
        self.last_requests = self.requests
        self.requests = {}
        self.summoner = None
        self.acted = False
        self.summoned_this_turn = False

    def die(self):
        print("Demon died!", self.name)
        self.remove()
        self.dead = True
        while self.owes:
            k, _ = self.owes.popitem()
            Demon.demons[k].owed.pop(self.name)
        while self.owed:
            k, _ = self.owed.popitem()
            Demon.demons[k].owes.pop(self.name)
        Demon.demons.pop(self.name)
        self.requests = []
        self.last_requests = []

    def hit(self):
        self.health -= 1
        if self.health <= 0:
            self.die()

    def owe_debt_to(self, other):
        self.owes[other.name] += 1
        other.owed[self.name] += 1
        assert self.owes[other.name] == other.owed[self.name]

    def be_owed_debt_by(self, other):
        other.owe_debt_to(self)

    def cancel_debt_owed_by(self, other):
        assert self.owed[other.name] >= 1
        self.owed[other.name] -= 1
        other.owes[self.name] -= 1
        assert self.owes[other.name] == other.owed[self.name]

    def try_summon(self, other, circle):
        """enact a Summon, unless the actor is not older than someone else trying to summon the same demon in the same tick"""
        s = other.summoner
        if s is None or s.summoner.born > self.born:
            other.summoner = circle
            if s is None:
                Demon.summons.add(other)

    def answer(self):
        assert self.plan_target in self.last_requests
        d = Demon.demons.get(self.plan_target)
        circle = self.last_requests[self.plan_target]
        if d is not None and circle.fight:  # the fight may be over
            d.try_summon(self, circle)
            self.be_owed_debt_by(d)

    def act(self):
        """Perform a planned action"""
        print(self, " plans ", self.plan, self.plan_target if self.plan in [
              "request", "answer", "summon"] else "")
        self.acted = True
        if self.fight is None:
            if self.plan == "wait":
                pass
            elif self.plan == "look":
                Demon.looking.add(self)
            elif self.plan == "answer":
                self.answer()
            else:
                raise Exception("Bad Plan: ", self.plan)
        else:
            if self.plan == "fire":
                if self.fight is not None:
                    opp = self.fight.opp(self.side).front
                    if opp is not None:
                        opp.hit()
            elif self.plan == "request":
                d = Demon.demons.get(self.plan_target)
                if d is not None and d != self:
                    d.requests[self.name] = SummoningCircle(self, 2)
                else:
                    self.plan = "request2"  # avoid forcing request2 to happen next turn
            elif self.plan == "request2":
                pass
            elif self.plan == "answer":
                self.answer()
            elif self.plan == "summon":
                d = Demon.demons.get(self.plan_target)
                if d is not None and self.owed[self.plan_target] >= 1:
                    self.try_summon(d, SummoningCircle(self, 1))
                    # should the debt still be canceled if the summon fails due to someone else summoning in the same tick?
                    self.cancel_debt_owed_by(d)
            elif self.plan == "concede":
                if self == self.fight[self.side].back:
                    opp = self.fight.opp(self.side).back
                    if isinstance(opp, Demon):
                        self.owe_debt_to(opp)
                        self.fight.end()
                        # jfb: ending the fight in the middle of the fight could mess with pending summons. test what happens (get summoned into an empty fight?)
                        # Toby: This should be handled by setting summoner.fight to None in d.remove()

            else:
                raise Exception("Bad Plan")

    def create_plan(self):
        raise Exception("abstract")

    def __str__(self):
        return "The Demon "+self.name

    def __repr__(self):
        return "<"+self.__class__.__name__+" "+self.name+">"


class AI(Demon):
    def create_plan(self):
        if self.requests:
            if random() < 0.75:
                self.plan = "answer"
                self.plan_target = choice(list(self.requests))
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
            self.plan_target = choice(Demon.dList)
            if self.plan_target is not self:
                return

        self.plan = "fire"


class Player(Demon):
    def create_plan(self):
        self.plan = "fire" if self.fight else "wait"


MIN_DEMONS = 100


def tick():
    global time
    time += 1
    Demon.summons = dset()
    Demon.looking = dset()
    Demon.dList = None

    for fight in list(Fight.fights):
        print(fight)

    print("Step", time)
    for d in Demon.demons.values():
        d.init_tick()

    # A lot of stuff happens per tick. TODO: Consider how to display it to a player
    # perform all actions (for AIs, these were planned in the previous tick)
    for d in list(Demon.demons.values()):
        if not d.dead:
            d.act()

    # handle summons
    for summoned in Demon.summons:
        if not summoned.dead and summoned.summoner.fight in Fight.fights:
            circle = summoned.summoner
            # Toby: Consider making a priority queue of summonings
            print(summoned, "summoned by", circle.summoner,
                  "in fight", circle.fight)
            if summoned.fight is not None:
                summoned.remove()
            print(summoned, "summoned by",
                  circle.summoner, "in fight", repr(circle.fight))
            circle.replace(summoned)
            summoned.summoned_this_turn = True
    Demon.summons = []

    for fight in list(Fight.fights):
        for side in [fight.side0, fight.side1]:
            for elt in list(side):
                if isinstance(elt, SummoningCircle):
                    elt.tick()

        if fight.side0.empty() or fight.side1.empty():
            # TODO: pay out any rewards for winning fights? (score at least)
            fight.end()

    find_matchups()

    # create new demons if there aren't enough
    if len(Demon.demons) < MIN_DEMONS:
        for i in range((MIN_DEMONS+10 - len(Demon.demons))//10):
            AI()
    # makes it faster to pick a random demon
    Demon.dList = list(Demon.demons)

    # AIs make their choices based on the info they have at the start of the turn (now)
    for d in Demon.demons.values():
        d.create_plan()


def create_fight(side0, side1):
    print(side0, "starts a fight against", side1)
    f = Fight()
    for d in [side0]:
        d.insert_after(None, f, 0)
    for d in [side1]:
        d.insert_after(None, f, 1)
    # print("Created fight!", [d.name for d in side0], [d.name for d in side1])
    return f


def find_matchups():
    looking = [d for d in Demon.looking if not d.fight]
    looking.sort(key=lambda d: d.name)
    Demon.looking = set()

    # temoprary - just pairs up demons looking demons as 1v1s
    # TODO: be more sophisticated

    # ideas: random matches, or try by age, power, score. Consider pulling some people who weren't looking for one into fights.
    # prioritise pairing humans
    # pair humans with AI after they've been looking for a certain number of turns, or if they check a box?
    # bigger fights than 1v1s
    # keep prior teams?

    for i in range(0, len(looking), 2):
        ds = looking[i:i+2]
        if len(ds) == 2:
            create_fight(ds[0], ds[1])


def init(num_demons=100):
    global MIN_DEMONS
    MIN_DEMONS = num_demons
    for i in range(num_demons):
        AI()


def build_data(d):
    """
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
    }"""
    result = d.serialize()
    if d.fight is None:
        result["fight"] = None
    else:
        result["fight"] = d.fight.serialize()
    result["requests"] = []
    for name in d.requests:
        if (req := Demon.demons.get(name)) and req.fight:
            result["requests"].append((name, req.fight.serialize()))
    result["owed"] = [(k, c) for k, c in d.owed.items() if c >= 1]
    result["changedFight"] = False
    result["tick"] = time
    return result
