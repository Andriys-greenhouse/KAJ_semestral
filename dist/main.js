import { onOnline, onOffline, onStorage, updateTimerList, getTimerWithDefVals, mainFrameUpdate, onLoad, softPopHistoryState, onSaveButtonClick, pollActiveWindows } from "/dist/utils.js";
import { getTimersCpy, setupLocalStorage, updateTimers } from "/dist/lsManagement.js";
import { TimerStyle } from "/dist/objects.js";
/* File for setup and initialization of background JS "processes" operating on main page */
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
    timers.push(getTimerWithDefVals(TimerStyle.horizontal));
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
// add edit page/form controlls
document.querySelector("#discard-button").addEventListener("click", softPopHistoryState);
document.querySelector("#save-button").addEventListener("click", onSaveButtonClick);
pollActiveWindows(); // will run until the window / tab is closed
