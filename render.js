Math.TAU = 2 * Math.PI

MAX_TIME = 10
MAXHEALTH = 10

function drawClock(ticks = 0) {
    let clockCanvas = document.getElementById("clock");
    let ctx = clockCanvas.getContext("2d");
    let w = clockCanvas.width
    let h = clockCanvas.height

    //ticks %= MAX_TIME

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

clockTimeout = null
function startClock(timeleft) {
    // drawClock(maxtime) should be called exactly when timeleft hits 0
    ticks = (MAX_TIME - timeleft + 0.99) | 0
    if (clockTimeout) {
        window.clearInterval(clockTimeout)
    }
    function runTick() {
        ticks += 1
        drawClock(ticks)
        if (ticks < MAX_TIME) {
            clockTimeout = window.setTimeout(runTick, 1000)
        }
    }
    drawClock(ticks)
    if (ticks < MAX_TIME) {
        clockTimeout = window.setTimeout(runTick, 1000 * (MAX_TIME - timeleft + 0.99 - ticks))
    }
}

function renderDemon(demon, highlight) {
    if (demon.circle !== undefined) {
        return renderSummoningCircle(demon.circle, highlight)
    }

    let elt = document.createElement("div")
    elt.classList.add("demon")
    elt.classList.add("fightParticipant")
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

    if (demon.summoned_this_turn) {
        ctx.drawImage(document.getElementById("summoningCircleBaseImg"), 0, 42, 30, 10)
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

function renderSummoningCircle(summoner, highlight) {
    let elt = document.createElement("div")
    elt.classList.add("summoningCircle")
    elt.classList.add("fightParticipant")

    if (summoner.name === highlight) {
        elt.classList.add("highlight")
    }

    let imgElt = document.createElement("canvas")
    imgElt.classList.add("summoningCircleImg")
    renderSummoningCircleImg(imgElt)
    elt.appendChild(imgElt)

    return elt
}

function renderSummoningCircleImg(canvas) {
    canvas.width = 30
    canvas.height = 60
    ctx = canvas.getContext("2d")

    ctx.drawImage(document.getElementById("summoningCircleBaseImg"), 0, 50, 30, 10)
}

function renderFightSide(side, left = true, highlight) {
    let sideElt = document.createElement("div")
    sideElt.classList.add("fightSide")
    sideElt.classList.add(left ? "fightSideLeft" : "fightSideRight")
    side = side.map(i => i).reverse() // Do this so that the target of attacks is always on the top line
    /*if (!left) {

    }*/

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
    elt.addEventListener("click", e => act(elt, "answer", name))

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
    elt.addEventListener("click", e => act(elt, "summon", demonName))
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
    elt.addEventListener("click", e => act(elt, "request", demonName))
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
function clearSelected() {
    selected = document.getElementsByClassName("selected")
    for (sel of selected) {
        sel.classList.remove("selected")
    }
}
function renderSelectAct(actElt) {
    clearSelected()
    if (typeof (actElt) === "string") {
        actElt = document.getElementById(actElt)
    }
    actElt.classList.add("selected")
}

function renderTempSelectAct(el) {
    el.classList.add("tempSelected")
}
function clearTempSelectAct(el) {
    el.classList.remove("tempSelected")
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
