myName = "qith"

function requestInfo() {
    startClock()

    let url = "/update?name=" + myName
    httpGetAsync(url, function (resp) {
        resp = JSON.parse(resp)
        let fight = resp.fight

        showBaseActions(fight !== null)

        if (fight === null) {
            console.log("No fight!")
            fight = [[], []]
        }

        updateKnowledge(resp)
        renderMainFight(fight)
        renderSelf(resp)
        renderInvitations(resp.requests)
        renderSummons(resp.owed)
        renderPossibleRequests()

        let nextTick = +resp.nexttick
        window.setTimeout(requestInfo, nextTick * 1000)
    })
}

function httpGetAsync(theUrl, callback, errorCallback = defaultErrorCallback) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            callback(xmlHttp.responseText);
        }
        if (xmlHttp.readyState == 4 && xmlHttp.status != 200) {
            errorCallback(xmlHttp.status, xmlHttp.responseText)
        }
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous
    xmlHttp.send(null);
}

function defaultErrorCallback(status, resp) {
    console.error(status, resp)
    window.clearInterval(clockInterval)
}

knownDemons = {}

function updateKnowledge(resp) {
    let knownNames = {}
    let knownFights = []
    knownNames[myName] = 1

    if (resp.fight !== null) {
        knownFights.push(resp.fight)
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

//Initialization
requestInfo()
