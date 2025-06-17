// S.J.C.G.(=solo Jesus Christos gloria)
import { getRunningCpy, getShowingCpy, getTimersCpy, updateShowing } from "/KAJ_semestral/dist/lsManagement.js";
import { checkTimerState, showActivity } from "/KAJ_semestral/dist/utils.js";
/* File for setup and initialization of background JS "processes" operating on timer-displaying page */
const timerId = (new URL(location.href)).searchParams.get("timerId");
if (!timerId || !getTimersCpy().some((tmr) => tmr.id === timerId))
    window.close(); // this page might not have been opened in the intended (from link on main page)
updateShowing(new Array(...getShowingCpy(), timerId));
showActivity(timerId); // will run until the window / tab is closed
window.addEventListener("storage", checkTimerState);
const timer = getTimersCpy().filter((tmr) => tmr.id === timerId)[0];
document.querySelector("head title").textContent = timer.title;
const svg = document.querySelector("svg");
timer.fillSVG(svg);
let lastSeconds = timer.time.seconds;
function repeatedUpdate() {
    svg && timer.updateDisplayed(svg);
    requestAnimationFrame(repeatedUpdate);
    const runA = getRunningCpy().filter((tR) => tR.timerId === timer.id);
    if (runA.length > 0) {
        const seconds = runA[0].timeLeft().seconds;
        if (lastSeconds * seconds < 0 || seconds == 0) { //multiplication instead of testing for different signs...
            try {
                document.querySelector("#bellRing").play();
            }
            catch (e) {
                console.warn("Can't play audio:", e);
            }
        }
        lastSeconds = seconds;
    }
}
repeatedUpdate();
// S.J.C.G.(=solo Jesus Christos gloria)
