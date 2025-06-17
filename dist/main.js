//Glory be to God and to his Son, Jesus Christ, and to the Holy Spirit for ever and ever, amen!
//Thanks to the sacrifice of Jesus Christ we can (if we chose to) come to God and through repentance - aknowledging to him, that we have not lived as we were supposed to and that from now on we want that to change - and in accepting Jesus christ as our personal Lord and Savior we can start to live with God as we were supposed to (and that is, what is called heaven, just as existence without him (without the source of all, that is wort anything) is called hell...).
//So even you dear reader, don't hesitate and try him - see if he answers. There not as much to lose as there is to gain - ethernal life, safety and purpose - life ethernal. There are only two possibilities - either it is lie or truth - there is no third way, either fact assumed are true or they are not.
//Glory be to God and to his Son, Jesus Christ, and to the Holy Spirit for ever and ever, amen!
import { onOnline, onOffline, onStorage, updateTimerList, getTimerWithDefVals, mainFrameUpdate, onLoad, softPopHistoryState, onSaveButtonClick, pollActiveWindows } from "/KAJ_semestral/dist/utils.js";
import { getTimersCpy, setupLocalStorage, updateTimers } from "/KAJ_semestral/dist/lsManagement.js";
import { TimerStyle } from "/KAJ_semestral/dist/objects.js";
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
//Glory be to God and to his Son, Jesus Christ, and to the Holy Spirit for ever and ever, amen!
//Thanks to the sacrifice of Jesus Christ we can (if we chose to) come to God and through repentance - aknowledging to him, that we have not lived as we were supposed to and that from now on we want that to change - and in accepting Jesus christ as our personal Lord and Savior we can start to live with God as we were supposed to (and that is, what is called heaven, just as existence without him (without the source of all, that is wort anything) is called hell...).
//So even you dear reader, don't hesitate and try him - see if he answers. There not as much to lose as there is to gain - ethernal life, safety and purpose - life ethernal. There are only two possibilities - either it is lie or truth - there is no third way, either fact assumed are true or they are not.
//Glory be to God and to his Son, Jesus Christ, and to the Holy Spirit for ever and ever, amen!
