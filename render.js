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

function renderDemon(demon) {
    let elt = document.createElement("div")
    elt.classList.add("demon")
    if (demon.human) {
        elt.classList.add("human")
    }
    if (demon.name == myName) {
        elt.classList.add("you")
    }

    let nameElt = document.createElement("div")
    nameElt.classList.add("demonName")
    nameElt.textContent = demon.name || "???"
    elt.appendChild(nameElt)

    let imgElt = document.createElement("canvas")
    imgElt.classList.add("demonImg")
    renderDemonImg(demon, imgElt)
    elt.appendChild(imgElt)

    let hpElt = document.createElement("div")
    hpElt.classList.add("demonHp")
    hpElt.textContent = demon.health + " HP"
    elt.appendChild(hpElt)

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
    let x=1
    for(let c of demon.name){
        x*=211
        x+=c.charCodeAt(0)
        x=x%65535
    }
    function rnd(n){
        let k = x%n
        x=(x*211)%65535
        return k
    }
    base=50
    ctx.fillStyle=`rgb(${180+rnd(76)},0,0)`
    for(let i of [0,1,2]){
        let h = 5+rnd(5)+i*2
        let w = 10+rnd(5)-i*2
        ctx.beginPath()
        ctx.ellipse(15+i*(rnd(5)-2.5),base-h,w,h,0,0,2*Math.PI)
        base-=h*1.5-rnd(8)
        ctx.fill()
    }
    ctx.fillStyle="#0E0"
    ctx.beginPath()
    ctx.fillRect(0,51, 30*demon.health/MAXHEALTH,8)
}

function renderFightSide(side, left = true) {
    let sideElt = document.createElement("div")
    sideElt.classList.add("fightSide")
    sideElt.classList.add(left ? "fightSideLeft" : "fightSideRight")

    if (!left) {
        side = side.map(i => i).reverse()
    }

    for (let demon of side) {
        let demonElt = renderDemon(demon)
        sideElt.appendChild(demonElt)
    }

    return sideElt
}

function renderFight(fight) {
    let elt = document.createElement("div")
    elt.classList.add("fight")

    let leftSide = renderFightSide(fight[0], true)
    elt.appendChild(leftSide)

    let noMansLand = document.createElement("div")
    noMansLand.classList.add("noMansLand")
    elt.appendChild(noMansLand)

    let rightSide = renderFightSide(fight[1], false)
    elt.appendChild(rightSide)

    return elt
}

function renderMainFight(fight) {
    let mainFightElt = document.getElementById("mainFight")
    mainFightElt.innerHTML = ""
    mainFightElt.appendChild(renderFight(fight))
}

function defaultErrorCallback(status, resp) {
    console.error(status, resp)
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
        if (fight === null) {
            console.log("No fight!")
            fight = [[], []]
        }
        renderMainFight(fight)
        let nextTick = +resp.nexttick
        window.setTimeout(requestInfo, nextTick * 1000)
    })
}

requestInfo()
