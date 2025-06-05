export function onOnline(evnt) {
    lbl = document.querySelector("#connection-status-label");
    lbl.textContent = "online";
    lbl.style["color"] = lbl.style.getPropertyValue("--fg-color");
}

export function onOffline(evnt) {
    lbl = document.querySelector("#connection-status-label");
    lbl.textContent = "offline";
    lbl.style["color"] = "grey";
}
