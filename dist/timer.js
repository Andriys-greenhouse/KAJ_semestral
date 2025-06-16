import { getShowingCpy, getTimersCpy, updateShowing } from "/dist/lsManagement.js";
import { checkTimerState, showActivity } from "/dist/utils.js";
const timerId = (new URL(location.href)).searchParams.get("timerId");
if (!timerId || !getTimersCpy().some((tmr) => tmr.id === timerId))
    window.close();
updateShowing(new Array(...getShowingCpy(), timerId));
showActivity(timerId); // will run until the window / tab is closed
window.addEventListener("storage", checkTimerState);
const timer = getTimersCpy().filter((tmr) => tmr.id === timerId)[0];
document.querySelector("head title").textContent = timer.title;
const svg = document.querySelector("svg");
timer.fillSVG(svg);
function repeatedVisualizationUpdate() {
    svg && timer.updateDisplayed(svg);
    requestAnimationFrame(repeatedVisualizationUpdate);
}
repeatedVisualizationUpdate();
