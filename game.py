import traceback
import names
from collections import defaultdict
from random import random, choice
from dataclasses import dataclass, asdict
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


@dataclass
class Stats:
    direct_kills: int = 0
    team_kills: int = 0
    wins: int = 0
    max_influence: int = 1
    age: int = 0

    def serialize(self):
        return asdict(self)


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
        back = self.back
        while isinstance(back, SummoningCircle):
            back = back.next
        return back is None

    def __bool__(self):
        return not self.empty()

    def __str__(self):
        return "[*"+",".join(d.name for d in self)+"*]"

    def serialize(self):
        return [d.serialize() for d in self]
    def store_len(self):
        self.count_demons=0
        self.count_circles=0
        for item in self:
            item.demons_in_front = self.count_demons
            item.circles_in_front = self.count_circles
            self.count_demons+=isinstance(item,Demon)
            self.count_circles+=isinstance(item,SummoningCircle)


class Fight:
    fights = dset()

    def __init__(self):
        self.side0 = FightSide()
        self.side1 = FightSide()
        self.status = "ongoing"
        self.loser = None
        Fight.fights.add(self)

    def init_tick(self):
        self.sidesAtStart = (list(self[0]), list(self[1]))

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

    def make_data(self):
        """Serialization of what happened on the most recent turn"""
        self.long_data = [[x.long_serialize() for x in side]
                          for side in self.sidesAtStart]
        self.sidesAtStart = None

    def long_serialize(self):
        return {"sides": self.long_data,
                "status": self.status,
                "loser": self.loser}

    def serialize(self):
        """Serialization of the current state"""
        return [side.serialize() for side in [self.side0, self.side1]]

    def end(self, reason, loser):
        print("Fight ended! because", reason, [d.name for d in self.side0], [
              d.name for d in self.side1])
        for side in [self.side0, self.side1]:
            for d in list(side):
                d.remove()
                if d.side != loser and isinstance(d, Demon):
                    d.stats.wins += 1
                if isinstance(d, Demon) and not d.acted:
                    d.plan = "wait"
                if isinstance(d, Player):
                    d.history.append(("fight ended", reason, loser, d.side))
                # (Toby: knowing the old plan might be helpful for UI)
            assert side.empty()
        self.status = reason
        self.loser = loser
        print("removing", self)
        Fight.fights.remove(self)

    def reward_kill(self, loser):
        for demon in self.opp(loser):
            if isinstance(demon, Demon):
                demon.stats.team_kills += 1
                # demon.heal(1)
                if demon.plan == "fire":
                    demon.stats.direct_kills += 1
                    demon.heal(1)
    def store_len(self):
        self.side0.store_len()
        self.side1.store_len()

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
        # self.side = 2

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
    def get_side(self):
        return self.fight[self.side]
    def other_side(self):
        return self.fight[1-self.side]

class SummoningCircle(LinkedListElt):
    def __init__(self, summoner, time):
        super().__init__()
        self.summoner = summoner
        self.summoner_name = summoner.name
        self.name = "circle of "+summoner.name
        self.summoner_born = summoner.born
        self.time = time
        self.type = time
        self.summoning = None
        # self.name = f"{summoner.name}'s summoning circle"
        self.insert_after(summoner)

    def tick(self):
        self.time -= 1
        if self.time <= 0:
            self.remove()

    def serialize(self):
        return {"circle": {"name": self.summoner_name}, "type": "circle"}

    def long_serialize(self):
        r = self.serialize()
        r["type"] = "circle"
        if self.summoning:
            r["summoning"] = self.summoning.serialize()
        return r

    def hit(self):
        if self.prev:
            return self.prev.hit()

    def replace(self, elt):
        self.summoner = None
        return super().replace(elt)

    def remove(self):
        self.summoner = None
        return super().remove()


class Demon(LinkedListElt):
    demons = {}
    summons = dset()
    looking = dset()
    dead_demons = []

    def serialize(self):
        res = {}
        for k in ["name", "influence", "score", "health", "plan", "summoned_this_turn", "dead"]:
            res[k] = getattr(self, k)
        res["type"] = "demon"
        res["stats"] = self.stats.serialize()
        return res

    def long_serialize(self):
        r = self.serialize()
        r["fired"] = self.fired
        if self.summoning:
            r["summoning"] = self.summoning.serialize()
        return r

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
        self.influence = 1
        self.score = 0

        # summoning debts (map from demon names to number of times owed)
        # summoning debts owed to this demon by others.
        self.owed = defaultdict(int)
        # summoning debts owed by this demon to others. (needed to cancel debts when it dies
        self.owes = defaultdict(int)

        # fight data
        self.health = MAXHEALTH

        self.dead = False

        self.stats = Stats()

        # transient data (doesn't last longer than a tick)
        self.requests = {}
        self.plan = "wait"
        self.plan_target = None
        self.init_tick()

    def init_tick(self):
        self.fired = None
        self.summoning = None
        self.last_requests = self.requests
        self.requests = {}
        self.circle = None
        self.acted = False
        self.summoned_this_turn = False

    def die(self):
        print("Demon died!", self.name)
        self.fight.reward_kill(self.side)
        self.remove()
        self.dead = True
        while self.owes:
            k, _ = self.owes.popitem()
            Demon.demons[k].owed.pop(self.name)
        while self.owed:
            k, _ = self.owed.popitem()
            Demon.demons[k].owes.pop(self.name)
        Demon.demons.pop(self.name)
        self.requests = {}
        self.last_requests = {}
        Demon.dead_demons.append(self)  # for cleanup next tick

    def cleanup(self):
        assert self.dead
        self.init_tick()
        self.last_requests = {}

    def hit(self):
        self.health -= 1
        if self.health <= 0:
            self.die()
        return self

    def heal(self, amt=1):
        self.health += amt
        self.health = min(self.health, MAXHEALTH)

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

    def try_summon(self, circle):
        """enact a Summon (prepare to move self to the circle), unless the creator of the circle is not older than someone else trying to summon the same demon in the same tick"""
        c = self.circle
        if c is None or c.summoner_born > circle.summoner_born:
            self.circle = circle
            if c is None:
                Demon.summons.add(self)
            return True

    def answer(self):
        assert self.plan_target in self.last_requests
        # We can count on this being the same demon that initiated the summoning if it's in a fight, since a newly born demon with the same name wouldn't have had a chance to enter a fight.
        d = Demon.demons.get(self.plan_target)
        circle = self.last_requests.get(self.plan_target)
        if d is not None and circle.fight:  # the fight may be over
            self.try_summon(circle)
            self.be_owed_debt_by(d)

    def make_circle(self, n):
        c = SummoningCircle(self, n)
        return c

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
                return self.answer()
            else:
                raise Exception("Bad Plan: ", self.plan)
        else:
            if self.plan == "fire":
                if self.fight is not None:
                    opp = self.fight.opp(self.side).front
                    if opp is not None and (target := opp.hit()):
                        self.fired = target.name
            elif self.plan == "request":
                d = Demon.demons.get(self.plan_target)
                if d is not None and d != self:
                    self.summoning = self.make_circle(2)
                    d.requests[self.name] = self.summoning
                    return True
                else:
                    self.plan = "request2"  # avoid forcing request2 to happen next turn
            elif self.plan == "request2":
                pass
            elif self.plan == "answer":
                self.answer()
            elif self.plan == "summon":
                d = Demon.demons.get(self.plan_target)
                if d is not None and self.owed[self.plan_target] >= 1:
                    d.try_summon(self.make_circle(1))
                    # should the debt still be canceled if the summon fails due to someone else summoning in the same tick?
                    self.cancel_debt_owed_by(d)
            elif self.plan == "concede":
                if self == self.fight[self.side].back:
                    opp = self.fight.opp(self.side).back
                    if isinstance(opp, Demon):
                        self.owe_debt_to(opp)
                        self.fight.end("concede", self.side)
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

    def end_tick(self):
        #print([(Demon.demons[name].influence,n )for name, n in self.owed.items()])
        self.influence = 1+sum(k**0.5/(i+1)
                               for i,k in enumerate(sorted((n*Demon.demons[name].influence for name, n in self.owed.items()), reverse=True)))
        #print(self.influence)
        self.stats.max_influence = max(
            self.stats.max_influence, self.influence)
        self.stats.age += 1
        self.create_plan()


class AI(Demon):
    def create_plan(self):
        {r:self.rate_summon(circ) for r,circ in self.requests.items() if circ.fight}
        if self.requests:
            if random() < 0.75:
                self.plan = "answer"
                self.plan_target = choice(list(self.requests))
                return
        if self.fight is None:
            self.plan = "look"
            return

        if (self.fight[self.side].back == self and self.should_concede()):
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
    def rate_summon(self,circle):
        return circle.demons_in_front*0.9+0.5+circle.get_side().count_demons*0.1 - circle.other_side().count_demons
    def should_concede(self):
        opp = list(self.fight.opp(self.side))
        # if I don't concede now, maximum damage that could be incoming before i get a chance to next turn?
        # could be smarter regarding age of demons. but for now humans don't easily hve access to that, so it's fairer for AIs to not consider it
        danger = len(opp) + sum(1 for o in opp if isinstance(o, Demon))
        shield = 0
        x = self.next
        while x is not None:
            if isinstance(x, Demon):
                shield += x.health
            x = x.next

        if danger < shield*0.9:  # if someone in front gets summoned away we could be in more danger than we expect
            return False

        if danger-shield > self.health:
            print(self, "is facing death and is likely to concede!")
            return random() < 0.7

        safety = (self.health - max(danger-shield, 0)) / MAXHEALTH
        # lower safety = higher chance to concede
        # this is between 0.1-1

        chance = (1-safety)*(1-safety)*0.2
        # 1hp remaining - 16% chance
        # 2hp remaining - 12% chance
        #
        # 6hp remaining - 3% chance (typical at the start of a fight that's become a 1v2)

        # print(
        #     f"{self} has a {chance} chance to concede {danger=} {shield=} {self.health=} {safety=}")
        return random() < chance


class Player(Demon):
    players = {}

    def __init__(self, *args):
        super().__init__(*args)
        self.truename = names.randname()
        Player.players[(self.name, self.truename)] = self

    def create_plan(self):
        self.plan = "fire" if self.fight else "wait"

    def init_tick(self):
        self.initial_fight = self.fight
        self.history = []
        return super().init_tick()

    def act(self):
        self.history.append(("attempted action", self.plan, self.plan_target))
        return super().act()
    """def make_circle(self,n):
        c = super().make_circle(n)
        self.history.append(("made circle",c))
        return c"""

    def try_summon(self, circle):
        changed = super().try_summon(circle)
        self.history.append(("summon attempt", circle.type,
                            circle.summoner_name, changed))
        return changed

    def build_data(self):
        result = self.serialize()
        if self.initial_fight is not None:
            result["initialFight"] = self.initial_fight.long_serialize()
        result["requests"] = []
        for (name, circle) in self.requests.items():
            if circle.fight:
                result["requests"].append((name, circle.fight.serialize()))
        result["owed"] = [(k, c) for k, c in self.owed.items() if c >= 1]
        result["owes"] = [(k, c) for k, c in self.owes.items() if c >= 1]
        result["changedFight"] = (self.fight is not self.initial_fight)
        if result["changedFight"] and self.fight is not None:
            result["newFight"] = self.fight.serialize()
        result["inFight"] = bool(self.fight)
        result["tick"] = time
        result["history"] = self.history
        return result


MIN_DEMONS = 100


def tick():
    global time
    time += 1
    Demon.summons = dset()
    Demon.looking = dset()
    Demon.dList = None
    while Demon.dead_demons:
        d = Demon.dead_demons.pop()
        d.cleanup()
    flist = list(Fight.fights)
    for fight in flist:
        fight.init_tick()
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
        if not summoned.dead and summoned.circle.fight in Fight.fights:
            circle = summoned.circle
            # Toby: Consider making a priority queue of summonings
            print(summoned, "summoned by", circle.summoner_name,
                  "in fight", circle.fight)
            if summoned.fight is not None:
                summoned.remove()
            print(summoned, "summoned by",
                  circle.summoner_name, "in fight", repr(circle.fight))
            if circle.type == 2:
                circle.summoning = summoned
            else:
                assert circle.type == 1
                circle.summoner.summoning = summoned
            circle.replace(summoned)
            summoned.summoned_this_turn = True
    Demon.summons = []

    for fight in flist:  # include fights that have been conceded
        fight.make_data()  # serialize start-of-turn data to help avoid memory leaks
    for fight in list(Fight.fights):
        for side in [fight.side0, fight.side1]:
            for elt in list(side):
                if isinstance(elt, SummoningCircle):
                    elt.tick()

        if fight.side0.empty() or fight.side1.empty():
            # TODO: pay out any rewards for winning fights? (score at least)
            fight.end("side eliminated", int(fight.side1.empty()))
    # makes it faster to pick a random demon
    Demon.dList = list(Demon.demons)
    find_matchups()

    # create new demons if there aren't enough
    if len(Demon.demons) < MIN_DEMONS:
        for i in range((MIN_DEMONS+10 - len(Demon.demons))//10):
            Demon.dList.append(AI().name)
    for fight in Fight.fights:
        fight.store_len()
    # AIs make their choices based on the info they have at the start of the turn (now)
    for d in Demon.demons.values():
        d.end_tick()


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
    for d in Demon.looking:
        for i in range(2):
            if d.fight:
                break
            target = Demon.demons[choice(Demon.dList)]
            if target is not d and not target.fight:
                if target.plan == "look" or random()<0.1:
                    print(d.fight,target.fight)
                    create_fight(d,target)


def init(num_demons=100):
    global MIN_DEMONS
    MIN_DEMONS = num_demons
    for i in range(num_demons):
        AI()


"""
type demon = { name:string,
        health:number,
        power:number,
        human:boolean,
        type:"demon"
        }
type circle = {
        type:"circle",
        summoning?:"circle"|demon,
        }
type side = [demon+{
        summoning?:"circle"|demon,
        died:boolean,
        fired: null|string,
        summoned_this_turn:boolean,
        } | circle
]
"""


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
    return d.build_data()
