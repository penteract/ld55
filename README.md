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

 - incentive to attack? 
 - - reward for killing? 
 - - inherit contracts? could reduce potential strategy in hoping debtors get killed / attempting to get them killed
 - - contracts have random chance to be inherited?
 - - potential reward outside of contracts: extra max hp?
 - - who gets reward? lander of killing blow; everyone on team; commander (back); everyone who attacked?
 - - if contracts are part of reward, how to divide? are fractional contracts meaningful? (build up to full contract for a summon). any way to share fractional contracts with teammates?
 - - probably don't want to dupicate contracts?

 - incentive for player to not disconnect and reconnect? 
 - - any sort of cookies used to track players could be cleared, so cannot easily do something like give new player debts based on anything involving old player (e.g. to who they abandoned)
 - - disconnecting is basically equiv to death - reward to opponents? is "making the average demon stronger" much of a deterent - you could be fighting with them as well as against them
 - - being in a strictly worse off position currently than at the start is difficult to deter disconnects (e.g. owe debts, not owed any)
 - - if you can get improvements outside of contracts such as maxhp there's incentive not to lose that 

 - incentive to concede a losing fight? which incurrs debt to enemy leader (back)
 - - ofc there's not dying; incentives for that are similar to incentives for not disconnecting
 - - if not yourself in immediete danger of death? could want to preserve lives of teammates if they owe you
 - - could deny enemy reward for killing 
 - - loyalty reward for saving life of teammates? probably don't want to incentivies conceding even or just slightly behind fights or fights that have just started; so full contract maybe too much. fractional contracts? if AIs, more likely to accept your requests?
 - - everyone heals (to full?) when fight ends? through concession, killing last enemy, or last enemy being summoned away

 - incentive to make request summons instead of calling in a debt? (of someone else, or of them)
 - - it doesn't use up your contract ofc
 - - but riskier - they could decline; and if they accept you owe them 
 - - perhaps could offer more than a contract to summon you? more than one such contract, or other contracts you have. fractional contracts? offer hp? (lose some hp to heal them)
 - - potential to trick someone by offering a contract for someone you know to be dead but they may not?
 - - is offering more stuff to make them more likely to accept actually a good strategic decision in enough cases
 - - requests also currently take 2 turns to process

 - incentive to accept requests?
 - - ofc you gain a contract (+more if you can be offered more)
 - - being in a winning fight is good. (why? due to incentive for killing?) however might not want to be in a riskier position (at front) even when your side is better off.
 - - does this make those at front more likely to call in debts or attack if they have none (since requests less likely not be accepted) wheras those at back prefer more often to request 
 - - heal 1hp upon being summoned? (by request or by contract)


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
