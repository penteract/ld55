
function requestInfo() {

    let url = "/update?name=" + myName + "&truename=" + truename
    httpGetAsync(url, function (resp) {
        resp = JSON.parse(resp)
        globresp = resp
        let nextTick = +resp.nexttick
        startClock(nextTick)
        let isInFight = resp.inFight
        lastDataTick = resp.tick

        let prevSelection = undefined
        if (document.getElementById("baseActsNonFight").contains(document.getElementsByClassName("selected")[0])) {
            prevSelection = document.getElementsByClassName("selected")[0]
        }
        clearSelected()
        if (prevSelection && !isInFight) {
            prevSelection.click()
        }

        showBaseActions(isInFight)

        if (!isInFight) {
            console.log("No fight!")
        } else {
            console.log("in fight")
        }
        let summoned = undefined
        function dotHundreds(n) {
            return (n / 100).toFixed(2)
            //return ""+(n/100|0)+"."+(n%100)
        }
        function logTick(s) {
            logMessage("Year " + dotHundreds(lastDataTick + 100) + ": " + s)
        }
        conceded = false
        for (let msg of resp.history) {
            if (msg[0] == "attempted action") {
                let [m, plan, target] = msg;
                if (plan == "request") logTick("You asked for help from " + target);
                if (plan == "summon") logTick("You called in a favour from " + target);
                if (plan == "concede") {
                    logTick("You surrendered the fight");
                    conceded = true
                }
            }
            if (msg[0] == "summon attempt") {
                let [m, ctype, summoner, success] = msg;
                let suffix = success ? summoned ? " overriding a junior demon's power" : "" : " but a senior demon's summon had priority"
                if (ctype == 2) {
                    logTick("You agreed to help " + summoner + suffix);
                }
                if (ctype == 1) {
                    logTick(summoner + " summoned you to repay your debt" + suffix);
                }
                if (success) { summoned = summoner }
            }
            if (msg[0] == "fight ended") {
                let [m, reason, loser, mySide] = msg;
                if (loser === mySide) {
                    if (reason == "concede") {
                        if (!conceded) { logTick("The fight you were in was surrendered") }
                    }
                    else if (reason == "side eliminated") { logTick("There was no-one left on the opposing side of the fight") }
                    else { console.log("surprise??", reason, msg, history) }
                }
                else {
                    if (reason == "concede") { logTick("The leader of your opponent's side surrendered") }
                    else if (reason == "side eliminated") { logTick("Everyone on the opposing side was eliminated") }
                    else { console.log("surprise??", reason, msg, history) }
                }
            }
        }

        if (resp.dead) {
            logTick("You died! Refresh the page to respawn as a new demon.")
            window.clearTimeout(clockTimeout)
        }

        updateKnowledge(resp)
        renderMainFight(resp.initialFight?.sides ?? [[], []], isInFight, resp.newFight)
        renderSelf(resp)
        renderInvitations(resp.requests)
        renderSummons(resp.owed)
        renderDebts(resp.owes)
        renderPossibleRequests()
        renderStats(resp.stats)
        if (!globresp.dead) {
            requestTimeout = window.setTimeout(requestInfo, nextTick * 1000)
        }
    })
}

knownDemons = {}

function updateKnowledge(resp) {
    let knownNames = {}
    let knownFights = []
    knownNames[myName] = 1

    if (resp.newFight) {
        knownFights.push(resp.newFight)
    }
    if (resp.initialFight) {
        knownFights.push(resp.initialFight.sides)
    }

    for (let name of Object.keys(knownDemons)) {
        knownNames[name] = 1
    }

    for (let inv of resp.requests) {
        let name = inv[0]
        let fight = inv[1]
        knownNames[name] = 1
        knownFights.push(fight)
    }

    for (let debt of resp.owed) {
        let name = debt[0]
        knownNames[name] = 1
    }
    for (let debt of resp.owes) {
        let name = debt[0]
        knownNames[name] = 1
    }

    // TODO: learn names of requests we attempted (in particular to unknown)
    // also learn use previous fight info in case a name was learned to learn prev known hp/power (client can store this, no need for server to send)
    // also learn names of those we owe (does server send that?)

    for (let name of Object.keys(knownNames)) {
        if (knownDemons[name] === undefined) {
            knownDemons[name] = dummyDemon(name)
        }
    }

    for (let fight of knownFights) {
        for (let side of fight) {
            for (let demon of side) {
                if (demon.type === "demon") {
                    if (knownNames[demon.name] === 1 || true) { // try just knowing all names
                        knownDemons[demon.name] = demon
                    }
                }
            }
        }
    }
}

function dummyDemon(name) {
    return {
        name: name,
        health: null,
        influence: "?",
        human: false
    }
}

function lookupDemon(demonName) {
    d = knownDemons[demonName]
    if (d !== undefined) {
        return d
    }

    return dummyDemon(name)
}

function isKnownDemonName(demonName) {
    // return knownDemons[demonName] !== undefined
    return true
}
myName = undefined
truename = undefined

//Initialization
requestNewName(txt => {
    [myName, truename] = txt.split("\n")
    requestInfo()
})

