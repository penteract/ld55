Math.TAU = 2 * Math.PI

MAX_TIME = 5

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

ticks = 0
window.setInterval(function () {
    ticks += 1
    drawClock(ticks)
}, 1000)