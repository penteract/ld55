import names
from collections import defaultdict
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

class Demon():
    demons={}
    summons=[]
    looking=set()

    def __init__(self):
        # Fixed data
        name=names.randname()
        while name in Demon.demons:
            name=names.randname()
            #with enough players, this loop could become very slow (and eventually never terminate), but I think other stuff becomes very slow long before that
        self.name=name
        Demon.demons[name]=self
        self.born = time

        #stats
        self.power=1
        self.score=0

        #summoning debts (map from demon names to number of times owed)
        self.owed=defaultdict(int) # summoning debts owed to this demon by others.
        self.owes=defaultdict(int) # summoning debts owed by this demon to others. (needed to cancel debts when it dies

        #fight data
        self.fight=None # fight objects are pairs of linked lists of demons [[back0,front0],[back1,front1]]; the front and back of the line on each side of the fight.
        self.health=MAXHEALTH;
        self.side=2 #
        # The line is a linked list
        self.next=None
        self.prev=None

        self.dead=False

        # transient data (doesn't last longer than a tick)
        self.requests=[]
        self.plan = "wait"
        self.planTarget = None
        self.initTick()

    def initTick(self):
        self.targeting=set() # Demons that are about to appear in front of this one
        self.summoner=None

    def remove(self):
        """remove self from the linked list that is its fight"""
        assert self.fight is not None
        if self.prev is None:
            assert self.fight[self.side][0] is self
            self.fight[self.side][0]=self.next
        else:
            self.prev.next=self.next
        if self.next is not None:
            self.next.prev=self.prev
        else:
            fight[side][1]=self.prev
        while self.targeting:
            self.targeting.pop().setTarget(self.prev)
        self.fight=None
        self.next=None
        self.prev=None
        self.side=2
    def insertAfter(self,summoner,fight,side):
        assert self.fight is None
        if summoner is None:
            self.next=fight[side][0]
            fight[side][0]=self
        else:
            assert summoner.fight==fight
            assert summoner.side==side
            self.next=summoner.next
            summoner.next=self
        self.prev=summoner
        if self.next is not None:
            self.next.prev=self
        else:
            fight[side][1]=self
        self.fight=fight
        self.side=side

    def setTarget(other):
        """change the target location of a summoning"""
        if other is not None:
            other.targeting.add(self)
        self.summoner[0]=other
    def die(self):
        self.remove()
        self.dead=True
        while self.owes:
            k,_ = self.owes.popitem()
            Demon.demons[k].owed.pop(self.name)
        while self.owed:
            k,_ = self.owed.popitem()
            Demon.demons[k].owes.pop(self.name)
        Demon.demons.pop(self.name)
        self.requests=[]
    def hit(self):
        self.health-=1
        if self.health<=0:
            self.die()

    def trySummon(other):
        """enact a Summon, unless the actor is not older than someone else trying to summon the same demon in the same tick"""
        s = other.summoner
        if s is None or s[0].born>self.born:
            other.summoner=[self,self.fight,self.side]
            other.setTarget(self)
            if s is None:
                Demon.summons.append(other)
    def answer(self):
        assert self.planTarget in self.requests
        d = Demon.demons.get(self.planTarget)
        if d is not None and d.fight: #the fight may be over or d may be dead
            d.trySummon(self)
            d.owes[self.name]+=1
            self.owed[d.name]+=1

    def act(self):
        """Perform a planned action"""
        if self.fight is None:
            if self.plan=="wait":
                pass
            elif self.plan=="look":
                Demon.looking.append(self)
            elif self.plan=="answer":
                self.answer()
            else:
                raise Exception("Bad Plan")
        else:
            if self.plan=="fire":
                if self.fight is not None:
                    opp = self.fight[1-self.side][1]
                    if opp is not None:
                        opp.hit()
            elif self.plan=="request":
                d = Demon.demons.get(self.planTarget)
                if d is not None:
                    d.requests.append(self.name)
                else:
                    self.plan="request2"#avoid forcing request2 to happen next turn
            elif self.plan=="request2":
                pass
            elif self.plan=="answer":
                self.answer()
            elif self.plan=="summon":
                d = Demon.demons.get(self.planTarget)
                if d is not None and self.planTarget in self.owed:
                    self.trySummon(d)
                    d.owes[self.name]-=1
                    self.owed[d.name]-=1
            else:
                raise Exception("Bad Plan")
class AI(Demon):
    pass
class Player(Demon):
    pass

def tick():
    global time
    time+=1
    Demon.summons=set()
    Demon.looking=set()
    #A lot of stuff happens per tick. TODO: Consider how to display it to a player
    # perform all actions (for AIs, these were planned in the previous tick)
    for d in list(Demon.demons.values()):
        if not d.dead: d.act()
    #handle summons
    for summoned in Demon.summons:
        if not summoned.dead:
            if summoned.fight is not None: summoned.remove()
            summoned.insertAfter(*summoned.summoner)
    Demon.summons=[]
    #find fights to match up (TODO)
    # ideas: random matches, or try by age, power, score. Consider pulling some people who weren't looking for one into fights.
    Demon.looking=[]

    # create new demons if there aren't enough
    if len(Demon.demons)<100:
        for i in range( (110 - len(Demon.demons))//10 ):
            AI()
    # AIs make their choices based on the info they have at the start of the turn (now)
    for d in Demon.demons.values():
        d.plan()



for i in range(100):
    AI()
