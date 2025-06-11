import { getTimersCpy, getShowingCpy, getRunningCpy, updateTimers, addToActiveWindows, clearActiveWindows, getActiveWindowsCpy, updateShowing, updateRunning } from "./lsManagement";
import { timerId_t, Timer, TimerTime, TimerStyle, HorizontalTimer, VerticalTimer, TimerChild } from "./objects";

/* utility functions -------------------------------------------------------- */
export function formatToIntPlaces(num: number, places: number) {
    let ret = String(num);
    const toFill = Math.floor(Math.log(num) / Math.log(10)) + 1 - places;
    for (let i = 0; i < toFill; ++i)
        ret = "0" + ret;
    return ret;
}

export function getTimerWithDefVals(ts: TimerStyle): TimerChild {
    const tmrTitles= getTimersCpy().map((tmr) => tmr.title);

    // pick title
    let num = 1;
    while (tmrTitles.some((tmrT) => tmrT === `Timer ${num}`))
        ++num;

    const constructorArgs: [string, TimerTime] = [`Timer ${num}`, new TimerTime(7*60)];

    let ret = undefined;
    switch (ts) {
        case TimerStyle.horizontal:
            ret = new HorizontalTimer(...constructorArgs);
            break;
        case TimerStyle.vertical:
            ret = new VerticalTimer(...constructorArgs);
            break;
        default:
            throw new Error(`Unknown \`TimerStyle\` text representation ("${TimerStyle[ts]}") passed as argument.`);
    }

    return ret;
}

function extractTimerFromEditPage(editPageW: HTMLFormElement): TimerChild {
    const textReprOfTimerStyle = (editPageW.querySelector("input[name=timer-type-group]:checked") as HTMLInputElement).dataset.timerType;
    //const timerStyle = TimerStyle.instances.filter((ins) => ins.textRepresentation === textReprOfTimerStyle)[0];

    let ret = getTimerWithDefVals(textReprOfTimerStyle as TimerStyle);

    ret.id = editPageW.dataset.timerId;
    ret.title = (editPageW.querySelector("#title-textfield") as HTMLInputElement).value;
    ret.time = new TimerTime(Number((editPageW.querySelector("#hour-textfield") as HTMLInputElement).value) * 60 * 60 + Number((editPageW.querySelector("#minute-textfield") as HTMLInputElement).value) * 60 + Number((editPageW.querySelector("#second-textfield") as HTMLInputElement).value));

    return ret;
}

// NOTE: this function also activates / deactivates error-indicating elements
// NOTE: !!! zero seconds is a vallid `TimerTime` !!!
function checkEditPage(editPageW: HTMLFormElement): boolean {
    let ret = true;

    const titleLabel = editPageW.querySelector("#title-label") as HTMLLabelElement
    if (0 < (editPageW.querySelector("#title-textfield") as HTMLInputElement).value.length) {
        ret = false;
        titleLabel.style.color = getComputedStyle(titleLabel).getPropertyValue("--form-font-color-on-invallid");
    } else {
        titleLabel.style.color = getComputedStyle(titleLabel).getPropertyValue("--fg-color");
    }

    return ret;
}

/* evnt handlers ------------------------------------------------------------ */
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
        //TODO: consider parametrization of the color value
        lbl.style["color"] = "grey";
    }
}

export function onStorage() {
    updateTimerList();
    updateDisplayedList();
}

export function checkTimerState() {
    const timerId = (new URL(location.href)).searchParams.get("timerId"); // we count on that this is not `null`
    !getShowingCpy().some((sId) => sId === timerId) && window.close(); // if window is supposed to be closed
}

/* element update functions ------------------------------------------------- */
export function updateTimezoneLabel() {
    const timezoneNum = Math.floor(-1 * new Date(Date.now()).getTimezoneOffset() / 60);
    document.querySelector("#timezone-label").textContent = `GMT ${timezoneNum >= 0 ? "+" : ""}${String(timezoneNum)}`;
}

export function updateTimeLabel() {
    const now = new Date(Date.now());
    document.querySelector("#time-label").textContent = `${formatToIntPlaces(now.getHours(), 2)}:${formatToIntPlaces(now.getMinutes(), 2)}`;
}

export function updateTimerList() {
    const tmrs = getTimersCpy(); // copying is not needed
    tmrs.sort((a, b) => a.title < b.title ? -1 : (a.title === b.title ? 0 : 1));

    const tileElems = tmrs.map((tmr) => {
        const tileWrapper = (document.querySelector("#timer-tile-template") as HTMLTemplateElement).content.cloneNode(true) as HTMLLabelElement;
        // ! use of the HTML `data attribute` !
        tileWrapper.dataset.timerId = tmr.id;
        tileWrapper.querySelector(".timer-tile-name").textContent = tmr.title;
        (tileWrapper.querySelector(".timer-tile-edit-button") as HTMLButtonElement).closest("a").href = `/timer.html?timerId=${tmr.id}`;
        (tileWrapper.querySelector(".timer-tile-delete-button") as HTMLButtonElement).addEventListener("click", onTimerTileDel);
        return tileWrapper;
    });

    document.querySelector("#timer-list").replaceChildren(...tileElems);
}

export function updateDisplayedList() {
    //NOTE: !! assumption: set of timers that are "running" is a subset of timers which are "showing" !!
    const ids = getShowingCpy(); // copying is not needed
    const tmrs = getTimersCpy().filter((tmr) => ids.some((id) => id === tmr.id));
    tmrs.sort((a, b) => a.title < b.title ? -1 : (a.title === b.title ? 0 : 1));

    const dispElems = tmrs.map((tmr) => {
        const dspWrapper = (document.querySelector("#displayed-template") as HTMLTemplateElement).content.cloneNode(true) as HTMLLabelElement;
        // ! use of the HTML `data attribute` !
        dspWrapper.dataset.timerId = tmr.id;
        dspWrapper.querySelector(".displayed-timer-name").textContent = tmr.title;
        updateDisplayed(dspWrapper);
        return dspWrapper;
    });

    document.querySelector("#displayed-list").replaceChildren(...dispElems);
}

export function updateDisplayed(dspWrapper: HTMLLabelElement) {
    const tmrId = dspWrapper.dataset.timerId;
    let tmr: Timer;
    for (let t of getTimersCpy())
        if (t.id === tmrId) {
            tmr = t;
            break;
        }

    if (getRunningCpy().some((tmrR) => tmrR.timerId === tmr.id))
        for (let tmrR of getRunningCpy())
            if (tmrR.timerId === tmr.id) {
                dspWrapper.querySelector(".displayed-timer-time-left").textContent = tmrR.timeLeft().getString();
                break;
            }

    styleDisplayedTimerElement(tmr.id, dspWrapper);
}

function styleDisplayedTimerElement(timerId: timerId_t, wraperElem: HTMLLabelElement) {
    const emphColor = getComputedStyle(wraperElem).getPropertyValue("--displayed-highlight-color");
    const fgColor = getComputedStyle(wraperElem).getPropertyValue("--fg-color");

    let visible: HTMLElement[];
    let hidden: HTMLElement[];
    const nameElem = wraperElem.querySelector(".displayed-timer-name") as HTMLHeadingElement;
    const timeElem = wraperElem.querySelector(".displayed-timer-name") as HTMLLabelElement;
    const hideBtn = wraperElem.querySelector(".displayed-hide-button") as HTMLButtonElement;
    const startBtn = wraperElem.querySelector(".displayed-start-button") as HTMLButtonElement;
    const pauseBtn = wraperElem.querySelector(".displayed-pause-button") as HTMLButtonElement;
    const stopBtn = wraperElem.querySelector(".displayed-stop-button") as HTMLButtonElement;

    if (getRunningCpy().some((tmrR) => tmrR.timerId === timerId)) {
        nameElem.style.setProperty("color", emphColor);
        nameElem.style.setProperty("font-weight", "bold");

        for (let tmrR of getRunningCpy())
            if (tmrR.timerId === timerId && tmrR.timeLeft().seconds < 0) {
                timeElem.style.setProperty("color", emphColor);
                break;
            }
        
        hidden = [hideBtn, startBtn];
        visible = [timeElem, pauseBtn, stopBtn];
    } else {
        nameElem.style.setProperty("color", fgColor);
        nameElem.style.setProperty("font-weight", "normal");
        timeElem.style.setProperty("color", fgColor);

        visible = [hideBtn, startBtn];
        hidden = [timeElem, pauseBtn, stopBtn];
    }

    visible.forEach((elem) => elem.style.setProperty("visibility", "visible"));
    hidden.forEach((elem) => elem.style.setProperty("visibility", "hidden"));
}

/* frame update functions --------------------------------------------------- */
export function mainFrameUpdate() {
    document.querySelector("#displayed-list").childNodes.forEach((nd) => {
        updateDisplayed(nd as HTMLLabelElement);
    });
    updateTimezoneLabel();
    updateTimeLabel();

    !editing && requestAnimationFrame(mainFrameUpdate);
}

/* controll element handles ------------------------------------------------- */
export function onTimerTileDel(evnt: Event) {
    //with the help of: https://stackoverflow.com/questions/29168719/can-you-target-an-elements-parent-element-using-event-target
    const timerId = ((evnt.currentTarget as Element).closest("[data-timer-id]") as HTMLElement).dataset.timerId;
    updateTimers(getTimersCpy().filter((tmr) => tmr.id != timerId));

    onStorage();
}

let editing = false;
function enterEdit(timerId: timerId_t) {
    editing = true;

    const editPageW = document.querySelector("#edit-page-wrapper") as HTMLFormElement;
    const timer = getTimersCpy().filter((tmr) => tmr.id === timerId)[0];

    editPageW.dataset.timerId = timerId;
    // set values in all inut elements on edit page from the `timer` instance
    (editPageW.querySelector("#title-textfield") as HTMLInputElement).value = timer.title;

    (editPageW.querySelector("#hour-textfield") as HTMLInputElement).value = timer.time.getHours().toString();
    (editPageW.querySelector("#minute-textfield") as HTMLInputElement).value = timer.time.getMinutes().toString();
    (editPageW.querySelector("#second-textfield") as HTMLInputElement).value = timer.time.getSeconds().toString();

    editPageW.querySelectorAll("input[type=radio]").forEach((elem) => {
        const ie = (elem as HTMLInputElement);
        if (ie.dataset.timerType === TimerStyle[timer.getStyle()])
            ie.checked = true; //NOTE: we might just as well `break` here
    });

    (document.querySelector("#main-page-wrapper") as HTMLDivElement).style.setProperty("visibility", "hidden");
    editPageW.style.setProperty("visibility", "visible");
    // TODO: make the rest of adjustments needed for putting the edit mode on
}

// NOTE: no saving of modified timer here (we expect it to be done already upon calling this function)
function exitEdit() {
    editing = false;

    onStorage();
    requestAnimationFrame(mainFrameUpdate);

    (document.querySelector("#main-page-wrapper") as HTMLDivElement).style.setProperty("visibility", "visible");
    (document.querySelector("#edit-page-wrapper") as HTMLDivElement).style.setProperty("visibility", "hidden");
    // TODO: make the rest of adjustments needed for putting the edit mode off
}

export function onLoad() {
    const url = new URL(location.href);
    const maybeId = url.searchParams.get("timerId");

    if (!maybeId) {
        exitEdit();
    } else if (getTimersCpy().some((tmr) => tmr.id === maybeId)) {
        enterEdit(maybeId);
    } else {
        softPopHistoryState();
    }
}

export function onSaveButtonClick(evnt: Event) {
    const editPageW = (evnt.currentTarget as Element).closest("#edit-page-wrapper") as HTMLFormElement;
    if (checkEditPage(editPageW)) {
        const timers = getTimersCpy();
        timers.push(extractTimerFromEditPage(editPageW));
        updateTimers(timers);

        softPopHistoryState();
    }
}

/** Function supplementing `pop` of `history`.
 *  (It is possible, that user have loaded this page using URL and that the edit page is the first one loaded -- then `pop`ing from the `history` would not be possible. This function solves this problem.)
 */
export function softPopHistoryState() {
    const url = new URL(location.href);
    url.searchParams.delete("timerId");
    history.replaceState(null,"", url);
    onLoad();
}

/* periodical update functions ---------------------------------------------- */
// polling mechanism for detection of closed windows / tabs introduced due to lack of availibility of `beforeunload` window event on the Safari browser. (With help of: https://stackoverflow.com/questions/13443503/run-javascript-code-on-window-close-or-page-refresh#13443562 .)
const hearbeatPeriod = 500; // in miliseconds
export function pollActiveWindows() {
    const aW = getActiveWindowsCpy();
    updateShowing(getShowingCpy().filter((sTId) => aW.some((aWTId) => sTId === aWTId)));
    updateRunning(getRunningCpy().filter((tR) => aW.some((aWTId) => tR.timerId === aWTId)));
    onStorage();

    clearActiveWindows();
    setTimeout(pollActiveWindows, hearbeatPeriod * 2);
}

export function showActivity(timerId: timerId_t) {
    addToActiveWindows(timerId);
    setTimeout(showActivity, hearbeatPeriod);
}

