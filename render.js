Math.TAU = 2 * Math.PI

MAX_TIME = 10
MAXHEALTH = 10

function drawClock(ticks = 0) {
    let clockCanvas = document.getElementById("clock");
    let ctx = clockCanvas.getContext("2d");
    let w = clockCanvas.width
    let h = clockCanvas.height

    ticks %= MAX_TIME

    begin_angle_deg = -90
    end_angle_deg = begin_angle_deg + ticks / MAX_TIME * 360

    begin_angle_rad = begin_angle_deg / 360 * Math.TAU
    end_angle_rad = end_angle_deg / 360 * Math.TAU

    ctx.clearRect(0, 0, w, h)
    ctx.beginPath()
    ctx.moveTo(w / 2, h / 2)
    ctx.lineTo(w / 2, 0)
    ctx.arc(w / 2, h / 2, h / 2, begin_angle_rad, end_angle_rad)
    ctx.lineTo(w / 2, h / 2)
    ctx.fillStyle = "grey"
    ctx.fill()
}

clockInterval = null
function startClock() {
    ticks = 0
    if (clockInterval) {
        window.clearInterval(clockInterval)
    }
    clockInterval = window.setInterval(function () {
        ticks += 1
        drawClock(ticks)
    }, 1000)
}

function renderDemon(demon, highlight) {
    let elt = document.createElement("div")
    elt.classList.add("demon")
    if (demon.human) {
        elt.classList.add("human")
    }
    if (demon.name === myName) {
        elt.classList.add("you")
    }
    if (demon.name === highlight) {
        elt.classList.add("highlight")
    }

    let nameElt = document.createElement("div")
    nameElt.classList.add("demonName")
    nameElt.textContent = isKnownDemonName(demon.name) && demon.name || "???"
    elt.appendChild(nameElt)

    let imgElt = document.createElement("canvas")
    imgElt.classList.add("demonImg")
    renderDemonImg(demon, imgElt)
    elt.appendChild(imgElt)

    let powerElt = document.createElement("div")
    powerElt.classList.add("demonPower")
    powerElt.textContent = demon.power
    elt.appendChild(powerElt)

    return elt
}

function renderDemonImg(demon, canvas) {
    // TODO
    canvas.width = 30
    canvas.height = 60
    ctx = canvas.getContext("2d")
    let x = 1
    for (let c of demon.name) {
        x *= 211
        x += c.charCodeAt(0)
        x = x % 65535
    }
    function rnd(n) {
        let k = x % n
        x = (x * 211) % 65535
        return k
    }
    base = 50
    ctx.fillStyle = `rgb(${180 + rnd(76)},0,0)`
    for (let i of [0, 1, 2]) {
        let h = 5 + rnd(5) + i * 2
        let w = 10 + rnd(5) - i * 2
        ctx.beginPath()
        ctx.ellipse(15 + i * (rnd(5) - 2.5), base - h, w, h, 0, 0, 2 * Math.PI)
        base -= h * 1.5 - rnd(8)
        ctx.fill()
    }

    if (demon.health !== null) {
        ctx.fillStyle = "#0E0"
        ctx.beginPath()
        ctx.fillRect(0, 51, 30 * demon.health / MAXHEALTH, 8)
    }
}

function renderFightSide(side, left = true, highlight) {
    let sideElt = document.createElement("div")
    sideElt.classList.add("fightSide")
    sideElt.classList.add(left ? "fightSideLeft" : "fightSideRight")

    if (!left) {
        side = side.map(i => i).reverse()
    }

    for (let demon of side) {
        let demonElt = renderDemon(demon, highlight)
        sideElt.appendChild(demonElt)
    }

    return sideElt
}

function renderFight(fight, highlight = null) {
    let elt = document.createElement("div")
    elt.classList.add("fight")

    let leftSide = renderFightSide(fight[0], true, highlight)
    elt.appendChild(leftSide)

    let noMansLand = document.createElement("div")
    noMansLand.classList.add("noMansLand")
    elt.appendChild(noMansLand)

    let rightSide = renderFightSide(fight[1], false, highlight)
    elt.appendChild(rightSide)

    return elt
}

function renderMainFight(fight) {
    let mainFightElt = document.getElementById("mainFight")
    mainFightElt.innerHTML = ""
    mainFightElt.appendChild(renderFight(fight))
}

function renderSelf(demon) {
    let selfDemonElt = document.getElementById("selfDemon")
    selfDemonElt.innerHTML = ""
    selfDemonElt.appendChild(renderDemon(demon))
}

function renderInvitation(inv) {
    let name = inv[0]
    let fight = inv[1]

    let elt = document.createElement("div")
    elt.classList.add("act")
    elt.classList.add("invitation")

    let fightElt = renderFight(fight, name)
    elt.appendChild(fightElt)

    // TODO: the height of this elt is messed up without setting its hight to constant within css...

    return elt
}

function renderInvitations(invs) {
    let invsElt = document.getElementById("invitationsList")
    invsElt.innerHTML = ""

    for (let inv of invs) {
        invsElt.appendChild(renderInvitation(inv))
    }
}

function renderSummon(summon) {
    let demonName = summon[0]
    let count = summon[1]

    let elt = document.createElement("div")
    elt.classList.add("act")
    elt.classList.add("summon")

    let demonElt = renderDemon(lookupDemon(demonName))
    elt.appendChild(demonElt)

    let countElt = document.createElement("div")
    countElt.classList.add("summonCount")
    countElt.textContent = "x " + count
    elt.appendChild(countElt)

    return elt
}

function renderSummons(summons) {
    let summonsElt = document.getElementById("summonActionsList")
    summonsElt.innerHTML = ""

    for (let summon of summons) {
        summonsElt.appendChild(renderSummon(summon))
    }
}

function renderPossibleRequest(demonName) {
    let elt = document.createElement("div")
    elt.classList.add("act")
    elt.classList.add("possible")

    let demonElt = renderDemon(lookupDemon(demonName))
    elt.appendChild(demonElt)

    return elt
}

function renderPossibleRequests() {
    let possElt = document.getElementById("requestActionsList")
    possElt.innerHTML = ""

    for (let name of Object.keys(knownDemons)) {
        if (name != myName) {
            possElt.appendChild(renderPossibleRequest(name))
        }
    }
}

function defaultErrorCallback(status, resp) {
    console.error(status, resp)
    window.clearInterval(clockInterval)
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

requestInfo()

function selectAct(actElt) {
    selected = document.getElementsByClassName("selected")
    for (sel of selected) {
        sel.classList.remove("selected")
    }

    if (typeof (actElt) === "string") {
        actElt = document.getElementById(actElt)
    }
    actElt.classList.add("selected")
}

function showBaseActions(inFight) {
    let nonFightActs = document.getElementById("baseActsNonFight")
    let fightActs = document.getElementById("baseActsFight")
    let selfDemon = document.getElementById("selfDemon")

    if (inFight) {
        fightActs.classList.remove("hidden")
        nonFightActs.classList.add("hidden")
        selfDemon.classList.add("hidden")
    }
    else {
        fightActs.classList.add("hidden")
        nonFightActs.classList.remove("hidden")
        selfDemon.classList.remove("hidden")
    }
}
