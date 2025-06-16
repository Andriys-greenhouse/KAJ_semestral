import { getTimersCpy, getShowingCpy, getRunningCpy, updateTimers, addToActiveWindows, clearActiveWindows, getActiveWindowsCpy, updateShowing, updateRunning } from "./lsManagement";
import { timerId_t, Timer, TimerTime, TimerStyle, HorizontalTimer, VerticalTimer, TimerChild, TimerRun } from "./objects";

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

/**
 * Function for "parsing" of values entered on the "edit page".
 * No checks are performed!
 * @param editPageW Wrapper element of the "edit page" (id="edit-page-wrapper" in `main.html`).
 * @returns Instance of @class Timer containing "extracted" values.
 */
function extractTimerFromEditPage(editPageW: HTMLDivElement): TimerChild {
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
/**
 * Function for checking validity of values entered on the edit page.
 * @param editPageW Wrapper element of the "edit page" (id="edit-page-wrapper" in `main.html`).
 * @returns `true` if entered values are considered vallid.
 */
function checkEditPage(editPageW: HTMLDivElement): boolean {
    let ret = true;

    const titleLabel = editPageW.querySelector("#title-label") as HTMLLabelElement
    if (0 == (editPageW.querySelector("#title-textfield") as HTMLInputElement).value.length) {
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

/**
 * Function called in response to change in `localStorage` on the main page.
 */
export function onStorage() {
    updateTimerList();
    updateDisplayedList();
}

/**
 * Function called on timer-displaying page in response to "storage" event on the `window`.
 * Closes the tab displaying the timer if the timer should no longer be shown (for example it was closed from the main page).
 */
export function checkTimerState() {
    const timerId = (new URL(location.href)).searchParams.get("timerId"); // we count on that this is not `null`
    !getShowingCpy().some((sId) => sId === timerId) && window.close(); // if window is supposed to be closed
}

/* element update functions ------------------------------------------------- */
/**
 * Function for updating content of the label displaying time zone (on the main page).
 * (Meant to be called periodically.)
 */
export function updateTimezoneLabel() {
    const timezoneNum = Math.floor(-1 * new Date(Date.now()).getTimezoneOffset() / 60);
    document.querySelector("#timezone-label").textContent = `GMT ${timezoneNum >= 0 ? "+" : ""}${String(timezoneNum)}`;
}

/**
 * Function for updating content of the label displaying the actual time (on the main page).
 * (Meant to be called periodically.)
 */
export function updateTimeLabel() {
    const now = new Date(Date.now());
    document.querySelector("#time-label").textContent = `${formatToIntPlaces(now.getHours(), 2)}:${formatToIntPlaces(now.getMinutes(), 2)}`;
}

/**
 * Function for updating content of the list of existing timers on the main page.
 * (Meant to be called periodically.)
 * If there is no change in composition of saved timers and timers displayed
 * in the tiler list on the main page (judging by the timer `id`s), this call
 * has no effect (i.e. no changes to the DOM are made). 
 */
export function updateTimerList() {
    const tmrs = getTimersCpy(); // copying is not needed
    tmrs.sort((a, b) => a.title < b.title ? -1 : (a.title === b.title ? 0 : 1));

    const tileElems = tmrs.map((tmr) => {
        const tileWrapper = (document.querySelector("#timer-tile-template") as HTMLTemplateElement).content.firstElementChild.cloneNode(true) as HTMLDivElement;
        // ! use of the HTML `data attribute` !
        tileWrapper.dataset.timerId = tmr.id;
        tileWrapper.querySelector(".timer-tile-name").textContent = tmr.title;
        (tileWrapper.querySelector(".timer-tile-display-button") as HTMLButtonElement).closest("a").href = `/KAJ_semestral/timer.html?timerId=${tmr.id}`;
        (tileWrapper.querySelector(".timer-tile-edit-button") as HTMLButtonElement).addEventListener("click", (evnt) => {
            const timerId = ((evnt.currentTarget as Element).closest("[data-timer-id]") as HTMLElement).dataset.timerId;
            enterEdit(timerId);
        });
        (tileWrapper.querySelector(".timer-tile-delete-button") as HTMLButtonElement).addEventListener("click", onTimerTileDel);
        return tileWrapper;
    });

    const timerList = document.querySelector("#timer-list");
    const timerListElChildren = new Array(...timerList.childNodes).filter((nd) => nd instanceof HTMLElement);
    let updateNeeded = timerListElChildren.length != tileElems.length;
    for (let ch of timerListElChildren)
        updateNeeded ||= !tmrs.some((tmr) => tmr.id === (ch as HTMLDivElement).dataset.timerId); // TODO: add conparisson of names as well upon encountering timer with a matching ID
    updateNeeded && timerList.replaceChildren(...tileElems);
}

/**
 * Function for updating content of the list of currently displayed timers on the main page.
 * (Meant to be called periodically.)
 * Replaces children of the `#displayed-list` element on the main page with children containing the current state.
 */
export function updateDisplayedList() {
    //NOTE: !! assumption: set of timers that are "running" is a subset of timers which are "showing" !!
    const ids = getShowingCpy(); // copying is not needed
    const tmrs = getTimersCpy().filter((tmr) => ids.some((id) => id === tmr.id));
    tmrs.sort((a, b) => a.title < b.title ? -1 : (a.title === b.title ? 0 : 1));

    const dispElems = tmrs.map((tmr) => {
        const dspWrapper = (document.querySelector("#displayed-template") as HTMLTemplateElement).content.firstElementChild.cloneNode(true) as HTMLDivElement;
        // ! use of the HTML `data attribute` !
        dspWrapper.dataset.timerId = tmr.id;
        dspWrapper.querySelector(".displayed-timer-name").textContent = tmr.title;
        (dspWrapper.querySelector(".displayed-hide-button") as HTMLButtonElement).addEventListener("click", (evnt) => {
            const timerId = ((evnt.currentTarget as Element).closest("[data-timer-id]") as HTMLElement).dataset.timerId;
            updateShowing(getShowingCpy().filter((sId) => sId !== timerId));
        });
        (dspWrapper.querySelector(".displayed-start-button") as HTMLButtonElement).addEventListener("click", (evnt) => {
            const timerId = ((evnt.currentTarget as Element).closest("[data-timer-id]") as HTMLElement).dataset.timerId;
            updateRunning(new Array(...getRunningCpy(), new TimerRun(timerId))); // checking whether timer is not running already shouldn't be needed since "start" button should be hidden on the displayed timer `label` if the time is running
        });
        (dspWrapper.querySelector(".displayed-pause-button") as HTMLButtonElement).addEventListener("click", (evnt) => {
            const button = (evnt.currentTarget as HTMLButtonElement);
            const timerId = (button.closest("[data-timer-id]") as HTMLElement).dataset.timerId;
            const running = getRunningCpy();
            running.filter((tR) => tR.timerId === timerId)[0].togglePause();
            button.textContent = running.filter((tR) => tR.timerId === timerId)[0].isPaused() ? "resume" : "pause";
            updateRunning(running);
        });
        (dspWrapper.querySelector(".displayed-stop-button") as HTMLButtonElement).addEventListener("click", (evnt) => {
            const timerId = ((evnt.currentTarget as Element).closest("[data-timer-id]") as HTMLElement).dataset.timerId;
            updateRunning(getRunningCpy().filter((tR) => tR.timerId !== timerId));
        });
        updateDisplayed(dspWrapper);
        return dspWrapper;
    });

    document.querySelector("#displayed-list").replaceChildren(...dispElems);
}

/**
 * Update of a contents of a particular element convaying information about a displayed or running timer.
 * @param dspWrapper Element whose contents should be updated. (Element in form given by `#displayed-template` template element is expected.)
 */
export function updateDisplayed(dspWrapper: HTMLDivElement) {
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

/**
 * Function for updating styles of particular element convaying information about a displayed or running timer.
 * @param timerId Id of a timer whose information is being displayed in the given element.
 * @param wraperElem Element whose contents should be updated. (Element in form given by `#displayed-template` template element is expected.)
 */
function styleDisplayedTimerElement(timerId: timerId_t, wraperElem: HTMLDivElement) {
    const emphColor = getComputedStyle(wraperElem).getPropertyValue("--displayed-highlight-color");
    const fgColor = getComputedStyle(wraperElem).getPropertyValue("--fg-color");

    let visible: HTMLElement[];
    let hidden: HTMLElement[];
    const nameElem = wraperElem.querySelector(".displayed-timer-name") as HTMLHeadingElement;
    const timeElem = wraperElem.querySelector(".displayed-timer-time-left") as HTMLLabelElement;
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
/**
 * Function reflecting changes in the information at the main page, which are not connected to changes in `localStorage`.
 * Calls itself "recursively" (using `requestAnimationFrame` function) until edit page is displayed. 
 */
export function mainFrameUpdate() {
    document.querySelector("#displayed-list").childNodes.forEach((nd) => {
        updateDisplayed(nd as HTMLDivElement);
    });
    updateTimezoneLabel();
    updateTimeLabel();

    !editing && requestAnimationFrame(mainFrameUpdate);
}

/* controll element handles ------------------------------------------------- */
/**
 * Event handler for click on the "delete" button on the record in the list of exisitng/created timers.
 * @param evnt Event resulting from click on "delete" button on the record displaying existing timer(s).
 */
export function onTimerTileDel(evnt: Event) {
    //with the help of: https://stackoverflow.com/questions/29168719/can-you-target-an-elements-parent-element-using-event-target
    const timerId = ((evnt.currentTarget as Element).closest("[data-timer-id]") as HTMLElement).dataset.timerId;
    updateTimers(getTimersCpy().filter((tmr) => tmr.id != timerId));

    onStorage();
}

let editing = false;
/**
 * Function used to display edit page and hide main page.
 * @param timerId `id` of the timer, which is supposed to be edited.
 */
function enterEdit(timerId: timerId_t) {
    editing = true;

    const editPageW = document.querySelector("#edit-page-wrapper") as HTMLDivElement;
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
    document.querySelectorAll(".timer-tile-label > input:checked").forEach((nd) => {(nd as HTMLInputElement).checked = false;})
    editPageW.style.setProperty("visibility", "visible");
    // TODO: make the rest of adjustments needed for putting the edit mode on
}

// NOTE: no saving of modified timer here (we expect it to be done already upon calling this function)
/**
 * Function used to display main page and hide edit page.
 */
function exitEdit() {
    editing = false;

    onStorage();
    requestAnimationFrame(mainFrameUpdate);

    (document.querySelector("#main-page-wrapper") as HTMLDivElement).style.setProperty("visibility", "visible");
    (document.querySelector("#edit-page-wrapper") as HTMLDivElement).style.setProperty("visibility", "hidden");
    // TODO: make the rest of adjustments needed for putting the edit mode off
}

/**
 * Function to handle load of page based on user-entered URL.
 */
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

/**
 * Checks info entered to form fields (using @method checkEditPage ) on the
 * edit page and if check is successfull, updates stored information modified
 * timer and returns from edit page to main page.
 * @param evnt Event erousing from click on the "save" button on the edit page.
 */
export function onSaveButtonClick(evnt: Event) {
    const editPageW = (evnt.currentTarget as Element).closest("#edit-page-wrapper") as HTMLDivElement;
    if (checkEditPage(editPageW)) {
        const edited = extractTimerFromEditPage(editPageW);
        const timers = getTimersCpy().filter((tmr) => tmr.id !== edited.id);
        timers.push(edited);
        updateTimers(timers);

        softPopHistoryState();
    }
}

/** 
 * Function supplementing `pop` of `history`.
 * (It is possible, that user have loaded this page using URL and that the
 * edit page is the first one loaded -- then `pop`ing from the `history` would
 * not be possible. This function solves this problem.)
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
/**
 * Function called from the main window to update information in the `localStorage` concerning windows / tabs closed by the user from the tab's head.
 * Function calls itself "recursively" (using the `setTimeout` function) to ensure continuous operation.
 */
export function pollActiveWindows() {
    const aW = getActiveWindowsCpy();
    updateShowing(getShowingCpy().filter((sTId) => aW.some((aWTId) => sTId === aWTId)));
    updateRunning(getRunningCpy().filter((tR) => aW.some((aWTId) => tR.timerId === aWTId)));
    onStorage();

    clearActiveWindows();
    setTimeout(pollActiveWindows, hearbeatPeriod * 2);
}

/**
 * Function called from the tab displaying a timer to indicate to the main page, that it was not closed yet.
 * @param timerId `id` of the timer displayed in the tab, where this function si called from.
 */
export function showActivity(timerId: timerId_t) {
    addToActiveWindows(timerId);
    setTimeout(showActivity, hearbeatPeriod, timerId);
}

