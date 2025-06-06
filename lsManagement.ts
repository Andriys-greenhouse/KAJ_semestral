import { Timer, timerId_t, TimerRun } from "./objects"

class LSOutlineItem {
    name: string;
    defaultVal: Object;
    resetOnPageLoad: boolean;
}
const LSOutline = {
    timers: {
        name: "timers",
        defaultVal: [], // Timer
        resetOnPageLoad: false
    } as LSOutlineItem,
    showing: {
        name: "showing",
        defaultVal: [], // timerId_t
        resetOnPageLoad: true
    } as LSOutlineItem,
    running: {
        name: "running",
        defaultVal: [], // TimerRun
        resetOnPageLoad: true
    } as LSOutlineItem,
    paused: {
        name: "paused",
        defaultVal: [], // timerId_t
        resetOnPageLoad: true
    } as LSOutlineItem
}

/** A function that
 *    -- deletes all entried from the local storage except those from `LSOutline`
 *    -- sets default values to all with `oi.resetOnPageLoad === true`
 *    -- sets default values to all with `oi.resetOnPageLoad === false` whose `oi.name` were not among keys of items present in the `localStorage`
 */
export function setupLocalStorage() {
    const ois = Object.keys(LSOutline).map((k) => LSOutline[k]);

    /*
    const desiredFound = [false, false, false];
    const defaultVals = desiredFields.map((f) => LSOutline[f]);
    */

    // filter elements stored in local storage
    const names = ois.map((oi) => oi.name);
    // with help of: https://duckduckgo.com/?q=js+generate+array+of+indexes+up+to+n&t=ffab&ia=web
    for (let i = 0; i < localStorage.length; ++i) {
        const LSKey = localStorage.key(i);
        if (LSKey && !names.some((n) => n === LSKey))
            localStorage.removeItem(LSKey);
    }

    // (re-)initialize elements
    ois.forEach((oi) => {
        const itm = localStorage.getItem(oi.name);
        if(!itm || oi.resetOnPageLoad)
            localStorage.setItem(oi.name, JSON.stringify(oi.defaultVal));
    });
}

/* get ---------------------------------------------------------------------- */
export function getTimersCpy(): Timer[] {
    const itm = localStorage.getItem(LSOutline[LSOutline.timers.name]);
    return itm ? JSON.parse(itm) : [];
}

export function getShowingCpy(): timerId_t[] {
    const itm = localStorage.getItem(LSOutline[LSOutline.showing.name]);
    return itm ? JSON.parse(itm) : [];
}

export function getRunningCpy(): TimerRun[] {
    const itm = localStorage.getItem(LSOutline[LSOutline.running.name]);
    return itm ? JSON.parse(itm) : [];
}

export function getPausedCpy(): timerId_t[] {
    const itm = localStorage.getItem(LSOutline[LSOutline.paused.name]);
    return itm ? JSON.parse(itm) : [];
}

/* update / save ------------------------------------------------------------ */
export function updateTimers(tmrs: Timer[]) {
    localStorage.setItem(LSOutline.timers.name, JSON.stringify(tmrs));
}

export function updateShowing(shwn: timerId_t[]) {
    localStorage.setItem(LSOutline.showing.name, JSON.stringify(shwn));
}

export function updateRunning(rnng: TimerRun[]) {
    localStorage.setItem(LSOutline.running.name, JSON.stringify(rnng));
}

export function updatePaused(paused: timerId_t[]) {
    localStorage.setItem(LSOutline.paused.name, JSON.stringify(paused));
}
