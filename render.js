Math.TAU = 2 * Math.PI

MAX_TIME = 10
MAXHEALTH = 10

function drawClock(ticks = 0) {
    let clockCanvas = document.getElementById("clock");
    let ctx = clockCanvas.getContext("2d");
    let w = clockCanvas.width
    let h = clockCanvas.height

    //ticks %= MAX_TIME

    begin_angle_rad = -1 / 4 * Math.TAU
    end_angle_rad = (-1 / 4 + ticks / MAX_TIME) * Math.TAU

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
        window.clearTimeout(clockTimeout)
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
    if (demon.type === "circle") {
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
    let nameLen = getNameLength(nameElt.textContent)
    if (nameLen>60) {nameElt.style.scale=(60/nameLen);}
    elt.appendChild(nameElt)

    let imgElt = document.createElement("canvas")
    imgElt.classList.add("demonImg")
    renderDemonImg(demon, imgElt)
    elt.appendChild(imgElt)

    let powerElt = document.createElement("div")
    powerElt.classList.add("demonPower")
    function fixedq(s) {
        n = +s
        if (isNaN(n)) return "?";
        else return n.toFixed(1)
    }
    powerElt.textContent = fixedq(demon.influence)
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
        ctx.scale(1, 1 / 3)
        drawPentegram(ctx, canvas.width / 2, (canvas.height - 10) * 3 - 15, 15)
        ctx.resetTransform()
        //ctx.drawImage(document.getElementById("summoningCircleBaseImg"), 0, 42, 30, 10)
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
    ctx.scale(1, 1 / 3)
    drawPentegram(ctx, canvas.width / 2, (canvas.height - 10) * 3 - 15, 15)

    /*ctx.drawImage(document.getElementById("summoningCircleBaseImg"), 0, 50, 30, 10)*/
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

function renderMainFightSide(side, left) {
    let sideElt = document.createElement("div")
    sideElt.classList.add("fightSide")
    sideElt.classList.add(left ? "fightSideLeft" : "fightSideRight")
    side = side.map(i => i).reverse() // Do this so that the target of attacks is always on the top line

    for (let demon of side) {
        if (demon.summoning) {
            let summonee = renderDemon(demon.summoning)
            if (demon.type === "circle") {
                summonee.classList.add("arrivingCircle")
            } else {
                summonee.classList.add("arriving")
            }
            sideElt.appendChild(summonee)
        }
        let demonElt = renderDemon(demon)
        sideElt.appendChild(demonElt)
        if (demon.type === "circle") {
            if (demon.summoning) { demonElt.classList.add("leavingCircle"); }
            else { demonElt.classList.add("leaving"); }
        } else {
            targetDict[demon.name] = demonElt
            if(demon.dead){
                demonElt.classList.add("dead")
            }
            if (demon.summoned_this_turn || demon.dead) {
                demonElt.classList.add("leaving")
            }
        }
        if (demon.fired) {
            fireballs.push([demonElt, demon.fired])
            demonElt.classList.add("firing")
        }
    }

    return sideElt
}
var targetDict;
var fireballs;
function renderMainFight(initialFight, isInFight, newFight) {
    let mainFightElt = document.getElementById("mainFight")
    mainFightElt.innerHTML = ""
    //mainFightElt.appendChild(renderFight(fight))
    let elt = document.createElement("div")
    elt.classList.add("fight")
    targetDict = {}
    fireballs = []

    let leftSide = renderMainFightSide(initialFight[0], true)
    elt.appendChild(leftSide)

    let noMansLand = document.createElement("div")
    noMansLand.classList.add("noMansLand")
    elt.appendChild(noMansLand)

    let rightSide = renderMainFightSide(initialFight[1], false)
    elt.appendChild(rightSide)
    mainFightElt.appendChild(elt)
    //elt.
    for (let [src, target] of fireballs) {
        mkFireball(src, targetDict[target], mainFightElt)
    }
    //Render a new fight on top of the old one
    if (newFight) {
        let newF = renderFight(newFight)
        newF.classList.add("newFight")
        mainFightElt.appendChild(newF)
    }
    if (newFight || !isInFight) {
        elt.classList.add("vanishing")
    }
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

function renderDebt(debt) {
    let demonName = debt[0]
    let count = debt[1]

    let elt = document.createElement("div")
    elt.classList.add("debt")

    let demonElt = renderDemon(lookupDemon(demonName))
    elt.appendChild(demonElt)

    let countElt = document.createElement("div")
    countElt.classList.add("summonCount")
    countElt.textContent = "x " + count
    elt.appendChild(countElt)
    return elt
}

function renderDebts(debts) {
    let debtsElt = document.getElementById("debtsList")
    debtsElt.innerHTML = ""

    let headerElt = document.getElementById("headerDebts")
    if (debts.length == 0) {
        headerElt.classList.add("hidden")
    }
    else {
        headerElt.classList.remove("hidden")
    }

    for (let debt of debts) {
        debtsElt.appendChild(renderDebt(debt))
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

function renderStats(stats) {
    document.getElementById("scoreKills").textContent = stats.direct_kills
    document.getElementById("scoreWins").textContent = stats.wins
    document.getElementById("scoreInfluence").textContent = (+stats.max_influence).toFixed(1)
    document.getElementById("scoreAge").textContent = stats.age
}

function showBaseActions(inFight) {
    let nonFightActs = document.getElementById("baseActsNonFight")
    let fightActs = document.getElementById("baseActsFight")
    let selfDemon = document.getElementById("selfDemon")

    if (inFight) {
        fightActs.classList.remove("hidden")
        nonFightActs.classList.add("hidden")
        selfDemon.classList.add("invisible")
    }
    else {
        fightActs.classList.add("hidden")
        nonFightActs.classList.remove("hidden")
        selfDemon.classList.remove("invisible")
    }
}

function drawPentegram(ctx, x, y, r) {
    ctx.strokeStyle = "red"
    for (i = 0; i < 5; i++) {
        ctx.beginPath()
        ctx.arc(x, y, r, (-1 / 4 + i / 5) * Math.TAU, (-1 / 4 + (i + 2) / 5) * Math.TAU)
        ctx.closePath()
        ctx.stroke()
    }
}
function getCenter(el) {
    let r = el.getBoundingClientRect()
    return [r.x + r.width / 2 + window.pageXOffset, r.y + r.height / 2 + window.pageYOffset]
}
function mkFireball(src, target, parent) {
    console.log("fireball", src, target, parent)
    let [sx, sy] = getCenter(src)
    let [ex, ey] = getCenter(target)
    fb = document.createElement("div")
    parent.prepend(fb)
    fb.style.left = sx + "px"
    fb.style.top = sy + "px"
    fb.classList.add("fireball")
    fb.offsetWidth |= 0;
    fb.style.left = ex + "px"
    fb.style.top = ey + "px"
    return fb
}

function logMessage(msg) {
    let log = document.getElementById("log")
    log.prepend(document.createElement("br"))
    log.prepend(msg)
}
lengthFinder = document.getElementById("lengthFinder")
function getNameLength(s){
    lengthFinder.innerText=s
    return lengthFinder.scrollWidth
}
