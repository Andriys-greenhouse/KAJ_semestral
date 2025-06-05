import { Timer, TimerRun, timerId_t } from "./objects";

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

// !!! each change to one following three "configuration" objects must be reflected to the other one as well !!!
// object for storing keys of `localStorage` and default values
const localStorageOutline = {
    "timers": [], // Timer
    "showing": [], // timerId_t
    "running": [], // TimerRun
    "paused": [] // timerId_t
}
const localStorageReset = {
    "timers": false,
    "showing": true,
    "running": true,
    "paused": true
}
const mappingOfNamesLocalStorageOutline = {
    timers: "timers",
    showing: "showing",
    running: "running"
}

// function -- deletes all entried from the local storage except those from `localStorageOutline`
//          -- sets default values to all with `localStorageReset` field equal to `true`
//          -- sets default values to all with `localStorageReset` field equal to `false` which were not present in the `localStorage`
export function cleanupLocalStorage() {
    const desiredFields = Object.keys(localStorageOutline);
    let desiredFound = [false, false, false];
    const defaultVals = desiredFields.map((f) => localStorageOutline[f]);

    // with help of: https://duckduckgo.com/?q=js+generate+array+of+indexes+up+to+n&t=ffab&ia=web
    for (let i = 0; i < localStorage.length; ++i) {
        const idx = desiredFields.indexOf(localStorage.key(i));
        if (idx == -1) {
            localStorage.removeItem(localStorage.key(i));
        } else {
            desiredFound[idx] = true;
        }
    }

    desiredFields.forEach((df, idx) => {
        localStorageReset[df] && localStorage.setItem(df, JSON.stringify(defaultVals[idx]));
        desiredFound[idx] = true;
    });

    desiredFields.forEach((df, idx) => {
        !desiredFound[idx] && localStorage.setItem(df, JSON.stringify(defaultVals[idx]))
    });
}

export function getTimers(): Timer[] {
    return JSON.parse(localStorage.getItem(localStorageOutline[mappingOfNamesLocalStorageOutline.timers]));
}

export function getActive(): timerId_t[] {
    return JSON.parse(localStorage.getItem(localStorageOutline[mappingOfNamesLocalStorageOutline.showing]));
}

export function getRunning(): TimerRun[] {
    return JSON.parse(localStorage.getItem(localStorageOutline[mappingOfNamesLocalStorageOutline.running]));
}
