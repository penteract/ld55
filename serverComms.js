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

function act(obj,plan,target){
    url = `./setPlan?name=${myName}&truename=${truename}&tick=${lastDataTick}&plan=${plan}`
    if (target!==undefined) {url+="&target="+target;}
    fetch(url, {"method":"POST"}).then(()=>{
        renderSelectAct(obj)
        clearTempSelectAct(obj)
    }).catch(resp=>{
        console.log(resp)
        clearTempSelectAct(obj)
    })
    renderTempSelectAct(obj)
}

function requestNewName(callback){
    fetch("./newDemon",{"method":"POST"}).then(r=>r.text()).then(callback)
}
