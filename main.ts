import { onOnline, onOffline, onStorage, updateTimerList, updateDisplayedList, updateDisplayed, updateTimezoneLabel, updateTimeLabel, getTimerWithDefVals, mainFrameUpdate, onLoad } from "./utils";
import { getTimersCpy, setupLocalStorage, updateTimers } from "./lsManagement";

// find out whether online
addEventListener("offline", onOffline);
addEventListener("online", onOnline);
//`navigator` from: https://www.w3schools.com/howto/howto_js_offline_detection.asp
(navigator.onLine ? onOnline : onOffline)(new Event(""));

// load timers
setupLocalStorage();
updateTimerList(); // calling `onStorage()` should also be possible

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
window.requestAnimationFrame(mainFrameUpdate);

// handle history
window.addEventListener("popstate", onLoad);
onLoad();
