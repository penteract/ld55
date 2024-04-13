Hi Joe,
Apologies in advance for not writing enough comments :)

PLAN:
1. Complain about the theme (written before learing what the theme will be)
?. ?
99. Leave ~24 hours at the end for polish

Summoning - Turn based strategy
 - Where were the things summoned from? can they be summoned away from you? Do they arrive at full health? Can you be summoned?
 - able to summon allies(monsters?) of different sizes, from a pool of 2^(10 - N) of size N
 - contracts?
 - recursive summoning? longish term game where you can make contracts allowing you or your minions to be summoned by greater powers in exchange for the ability to summon them when needed?
    - server side stuff for persistent accounts?
    - 2 forms of summoning: (a) you can ask if someone wants to be summoned. If they say yes, they gain the ability to summon you. (b) You can summon someone who has previously agreed to owe you a debt (because they
    - conflicts start randomly. You can offer to concede in exchange for owing them a summoning debt?
    - Summons are resolved in order: summoning someone in a combat removes them from that combat (particularly fun if you can summon someone from your opponent's side).
    - Your summons always appear in front of you
      - whoever's at the back is responsible for the fight and may surrender.
    - Problems:
      - AI is necessary and not straightforward, but could be quite stupid.
 - Names are important?


## Actual plan

### Combat
2 lines facing each other, damage from everyone dealt to the front of the enemy line.
Choices per turn (5 seconds?): summon known(someone who owes you a debt) , summon unknown/request help (someone who you will then owe a debt; takes twice as long to arrive), attack (deal damage). Summon unknown does not always succeed; should be a bad enough option that combat terminates.
1 damage per attack, 10 health? If the damage kills,

### Flavour
Arise qungavdrux, you have been spawned on the scorched plains of Hell. It is dangerous place and you should seek to gain power over others if you hope to survive, but that cannot be done without risking yourself in their service.

### Implementation
Server in python. I got a basic version up in main.py and it's not worth trying to add concurrency.
20-100 AI demons + active players
Only act in response to an HTTP request: If at least 4 seconds (4=N-1 where N is how often ticks are supposed to happen) have passed since the previous tick, then execute a tick for all characters.


### Graphics
Whatever gets tried first for graphics might end up being concerningly close to the final version.
ideas: use name as rng seed for drawing the demons. maybe just draw them as 3 or 4 circles with random variation in position, radius and colour.


Each tick the client will get info from the server about (a) what the people that were in the current fight at the start of the tick tried to do, and (b) what actually happened (who died, who arrived, who left, and where) Animations here would be nice. Any animations shouldn't take too long to give the player

### UI
Could use regular html elements - there need to be ~3 main buttons; some way of specifying the desired target (choose name from dropdown or enter as text?) and a variable number extra buttons for received requests.


## sound
Would be nice to have
