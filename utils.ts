import { getTimersCpy, getShowingCpy, getRunningCpy, getPausedCpy, updateTimers } from "./lsManagement";
import { timerId_t, Timer, TimerTime, TimerStyle, getTimerStyleTextRepresentation } from "./objects";

/* utility functions -------------------------------------------------------- */
export function formatToIntPlaces(num: number, places: number) {
    let ret = String(num);
    const toFill = Math.floor(Math.log(num) / Math.log(10)) + 1 - places;
    for (let i = 0; i < toFill; ++i)
        ret = "0" + ret;
    return ret;
}

export function getTimerWithDefVals() {
    const tmrTitles= getTimersCpy().map((tmr) => tmr.title);

    // pick title
    let num = 1;
    while (tmrTitles.some((tmrT) => tmrT === `Timer ${num}`))
        ++num;

    return new Timer(`Timer ${num}`, new TimerTime(7*60), TimerStyle.Horizontal);
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

    //TODO: set values in all inut elements on edit page from the `timer` instance
    (editPageW.querySelector("#title-textfield") as HTMLInputElement).value = timer.title;

    (editPageW.querySelector("#hour-textfield") as HTMLInputElement).value = timer.time.getHours().toString();
    (editPageW.querySelector("#minute-textfield") as HTMLInputElement).value = timer.time.getMinutes().toString();
    (editPageW.querySelector("#second-textfield") as HTMLInputElement).value = timer.time.getSeconds().toString();

    editPageW.querySelectorAll("input[type=radio]").forEach((elem) => {
        const ie = (elem as HTMLInputElement);
        if (ie.dataset.timerType === getTimerStyleTextRepresentation(timer.style))
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
    mainFrameUpdate();

    (document.querySelector("#main-page-wrapper") as HTMLDivElement).style.setProperty("visibility", "visible");
    (document.querySelector("#edit-page-wrapper") as HTMLDivElement).style.setProperty("visibility", "hidden");
    // TODO: make the rest of adjustments needed for putting the edit mode off
}
