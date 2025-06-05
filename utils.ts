export function onOnline(e: Event) {
    //conversion from: https://stackoverflow.com/questions/58773652/ts2339-property-style-does-not-exist-on-type-element
    const lbl = document.querySelector("#connection-status-label") as HTMLElement;
    if (lbl !== null) {
        lbl.textContent = "online";
        lbl.style["color"] = lbl.style.getPropertyValue("--fg-color");
    }
}

export function onOffline(e: Event) {
    //conversion from: https://stackoverflow.com/questions/58773652/ts2339-property-style-does-not-exist-on-type-element
    const lbl = document.querySelector("#connection-status-label") as HTMLElement;
    if (lbl !== null) {
        lbl.textContent = "offline";
        lbl.style["color"] = "grey";
    }
}
