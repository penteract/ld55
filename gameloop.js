
function requestInfo() {

    let url = "/update?name=" + myName+"&truename="+truename
    httpGetAsync(url, function (resp) {
        resp = JSON.parse(resp)
        globresp = resp
        let nextTick = +resp.nexttick
        startClock(nextTick)
        let isInFight = resp.inFight
        lastDataTick=resp.tick

        let prevSelection=undefined
        if(document.getElementById("baseActsNonFight").contains(document.getElementsByClassName("selected")[0])){
            prevSelection = document.getElementsByClassName("selected")[0]
        }
        clearSelected()
        if(prevSelection && !isInFight){
            prevSelection.click()
        }

        showBaseActions(isInFight)

        if (!isInFight) {
            console.log("No fight!")
        }else{
            console.log("in fight")
        }

        updateKnowledge(resp)
        renderMainFight(resp.initialFight?.sides??[[],[]],isInFight,resp.newFight)
        renderSelf(resp)
        renderInvitations(resp.requests)
        renderSummons(resp.owed)
        renderPossibleRequests()
        if(!globresp.dead){
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
                if (knownNames[demon.name] === 1) {
                    knownDemons[demon.name] = demon
                }
            }
        }
    }
}

function dummyDemon(name) {
    return {
        name: name,
        health: null,
        power: "?",
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
    return knownDemons[demonName] !== undefined
}
myName=undefined
truename=undefined

//Initialization
requestNewName(txt=>{
    [myName,truename]=txt.split("\n")
    requestInfo()
})

