import { onOnline, onOffline, updateTimerList, updateDisplayedList, updateDisplayed, updateTimezoneLabel, updateTimeLabel, getTimerWithDefVals } from "./utils";
import { getTimersCpy, setupLocalStorage, updateTimers } from "./lsManagement";

function onStorage() {
    updateTimerList();
    updateDisplayedList();
}

let editModeOn = false;
function editOn() {
    editModeOn = true;
    // TODO: make the rest of adjustments needed for putting the edit mode on
}

function editOff() {
    editModeOn = false;
    onStorage();
    // TODO: make the rest of adjustments needed for putting the edit mode off
}

// find out whether online
addEventListener("offline", onOffline);
addEventListener("online", onOnline);
//`navigator` from: https://www.w3schools.com/howto/howto_js_offline_detection.asp
(navigator.onLine ? onOnline : onOffline)(new Event(""));

// load timers
setupLocalStorage();
updateTimerList();

// on storage
window.addEventListener("storage", onStorage);

// add-button
document.querySelector("#add-timer-button").addEventListener("click", (e) => {
    const timers = getTimersCpy();
    timers.push(getTimerWithDefVals());
    updateTimers(timers);
    onStorage();
});

// on animation frame:
//   -- for each of displayed call `updateDisplayed()`
//   -- set timezone lable ( `updateTimezoneLabel()` )
//   -- update displayed time ( `updateTimeLabel()` )
window.requestAnimationFrame(() => {
    document.querySelector("#displayed-list").childNodes.forEach((nd) => {
        updateDisplayed(nd as HTMLLabelElement);
    });
    updateTimezoneLabel();
    updateTimeLabel();
})
