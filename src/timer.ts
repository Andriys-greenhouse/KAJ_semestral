// S.J.C.G.(=solo Jesus Christos gloria)

import { getShowingCpy, getTimersCpy, updateShowing } from "./lsManagement"
import { timerId_t } from "./objects";
import { checkTimerState, showActivity } from "./utils";

/* File for setup and initialization of background JS "processes" operating on timer-displaying page */

const timerId = (new URL(location.href)).searchParams.get("timerId");

if (!timerId || !getTimersCpy().some((tmr) => tmr.id === timerId))
    window.close(); // this page might not have been opened in the intended (from link on main page)

updateShowing(new Array(...getShowingCpy(), timerId as timerId_t));

showActivity(timerId as timerId_t); // will run until the window / tab is closed

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

// S.J.C.G.(=solo Jesus Christos gloria)