import { getShowingCpy, getTimersCpy, updateShowing } from "./lsManagement"
import { timerId_t } from "./objects";
import { checkTimerState, showActivity } from "./utils";

const timerId = (new URL(location.href)).searchParams.get("timerId");

if (!timerId || !getTimersCpy().some((tmr) => tmr.id === timerId))
    window.close();

updateShowing(new Array(...getShowingCpy(), timerId as timerId_t));

showActivity(timerId as timerId_t); // will run until the window / tab is closed

window.addEventListener("storage", checkTimerState);

const timer = getTimersCpy().filter((tmr) => tmr.id === timerId)[0];
const svg = document.querySelector("svg");
svg && (svg.dataset.timerType = timer.getStyle());
timer.fillSVG(svg);
function repeatedVisualizationUpdate() {
    svg && timer.updateDisplayed(svg);
    requestAnimationFrame(repeatedVisualizationUpdate);
}
repeatedVisualizationUpdate();
