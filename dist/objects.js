// S.J.C.G.(=solo Jesus Christos gloria)
import { getRunningCpy, getTimersCpy } from "/KAJ_semestral/dist/lsManagement.js";
import { formatToIntPlaces } from "/KAJ_semestral/dist/utils.js";
/**
 * An utility class modeling time left on a timer.
 * @field seconds -- (Possibly negative) integer value representing *seconds* left on a timer. If negative represents elapsed time from timer "ring".
 */
export class TimerTime {
    constructor(seconds) {
        this.seconds = Math.floor(seconds); // we want an integer
    }
    // ! NOTE: following methods/functions return *signed* results !
    getHours() { return Math.floor(this.seconds / (60 * 60)); }
    getMinutes() { return Math.floor((this.seconds % (60 * 60)) / 60); }
    getSeconds() { return Math.floor(this.seconds % 60); }
    getString() { return `${this.seconds < 0 ? "-" : ""}${formatToIntPlaces(Math.abs(this.getHours()), 2)}:${formatToIntPlaces(Math.abs(this.getMinutes()), 2)}:${formatToIntPlaces(Math.abs(this.getSeconds()), 2)}`; }
}
/**
 * Represents a color segment on a timer.
 * @field timeFracBegin -- Floating point number from interval [0, 1] indicating fraction of the time which this segment should span across.
 * @field color -- Determines color of the segment.
 */
export class TimerSegment {
    constructor(color, timeFracBegin) {
        this.timeFracBegin = timeFracBegin;
        this.color = color;
    }
}
/**
 * Class representing state of some running timer in a given point in time.
 * @field timerId -- Field for storing an `id` of the timer, whose state in time instance represents.
 * @field startPoint -- `Date` storing the "timestamp" when the represented timer's countdown started (or of moment from when elapsed time should be computed).
 * @field pausedAt -- If `null` the represented timer is not paused at the given moment. If the field contains `Date` instance, this `Date` represents "timestamp" at which the timer was stopped.
 */
export class TimerRun {
    constructor(timerId) {
        this.timerId = timerId;
        this.startPoint = new Date(Date.now()); // does not need to indicate time of start of the `Timer` instance (see the `unpause()` method of this class)
        this.pausedAt = null;
    }
    //can return negative number
    timeLeft() {
        for (let tmr of getTimersCpy())
            if (tmr.id === this.timerId)
                return new TimerTime(tmr.time.seconds - Math.floor((Date.now() - this.startPoint.getTime()) / 1000));
    }
    togglePause() {
        if (this.pausedAt) {
            this.unpause();
        }
        else {
            this.pause();
        }
    }
    isPaused() {
        return this.pausedAt != null;
    }
    pause() {
        this.pausedAt || (this.pausedAt = new Date(Date.now()));
    }
    unpause() {
        if (this.pausedAt) {
            this.startPoint = new Date(this.startPoint.valueOf() + (Date.now() - this.pausedAt.valueOf()));
            this.pausedAt = null;
        }
    }
}
/**
 * Enum recotding possible "styles" of timer.
 * Style of the timer should only effect is's appearance upon displaying.
 */
export var TimerStyle;
(function (TimerStyle) {
    TimerStyle["horizontal"] = "horizontal";
    TimerStyle["vertical"] = "vertical";
})(TimerStyle || (TimerStyle = {}));
/** Function for transformation of (deserialized) `Timer` class instance into instance of class inheriting from it. */
export function getAsInstanceOfChildClass(ts, tmr) {
    let ret = undefined;
    switch (ts) {
        case TimerStyle.horizontal:
            ret = new HorizontalTimer(tmr.title, tmr.time, tmr.segments);
            ret.id = tmr.id;
            break;
        case TimerStyle.vertical:
            ret = new VerticalTimer(tmr.title, tmr.time, tmr.segments);
            ret.id = tmr.id;
            break;
        default:
            throw new Error(`Unknown \`TimerStyle\` text representation ("${TimerStyle[ts]}") passed as argument.`);
    }
    return ret;
}
/**
 * Base class representing a timer.
 * @field id -- UUID of a given timer.
 * @field segments -- Segments on a given timer.
 * @field title -- Title/name of a given timer.
 * @field time -- Instance of @class TimerTime modeling the total countdown time on a given timer.
 */
export class Timer {
    getStyle() { return undefined; }
    constructor(title, time, segments = Timer.defaultSegments) {
        this.id = self.crypto.randomUUID();
        this.title = title;
        this.time = time;
        this.segments = segments;
    }
}
Timer.defaultSegments = [
    new TimerSegment(`rgb(${252}, ${42}, ${5})`, 0.05), // red
    new TimerSegment(`rgb(${247}, ${236}, ${24})`, 0.20), // yellow
    new TimerSegment(`rgb(${61}, ${247}, ${24})`, 1), // green
];
/**
 * Class implementing vertical layout of a timer.
 */
export class VerticalTimer extends Timer {
    getStyle() { return TimerStyle.vertical; }
    fillSVG(se) {
        se.dataset.timerType = this.getStyle();
        const swString = getComputedStyle(se).getPropertyValue("--segment-height");
        const sw = Number(swString.match(/\d{1,3}/)[0]);
        // segment elements must be sortied in descending order in respect to their width -- otherwise more narrow `rect` elements would be covered by the wider ones
        const segmentElems = this.segments.sort((ts1, ts2) => -(ts1.timeFracBegin - ts2.timeFracBegin)).map((ts) => {
            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.classList.add("segmentLike");
            rect.style.setProperty("fill", ts.color);
            rect.style.setProperty("--individual-seg-height", `${sw * ts.timeFracBegin}%`);
            return rect;
        });
        se.innerHTML = `
            <mask id="segmentMask" mask-type="luminance">
                <rect fill="black" width="100%" height="100%"></rect>
                <rect id="maskRect" fill="white" class="segmentLike"></rect>
            </mask>
            <g id="timerGroup">
                <rect id="backFrameRect"></rect>
                <rect id="backRect" class="segmentLike"></rect>
                <g id="segmentsGroup" mask="url(#segmentMask)">
                </g>
                <rect id="bottomPannel"></rect>
                <text id="timerText"></text>
            </g>`;
        se.querySelector("#segmentsGroup").replaceChildren(...segmentElems);
        this.updateDisplayed(se);
    }
    updateDisplayed(se) {
        const running = getRunningCpy();
        const runA = running.filter((tR) => tR.timerId === this.id);
        if (runA.length > 0 && runA[0].isPaused()) {
            se.style.setProperty("filter", "grayscale(1)");
        }
        else {
            se.style.setProperty("filter", "grayscale(0)");
            const timeLeft = runA.length > 0 ? runA[0].timeLeft() : this.time;
            // timer text
            const timerTextElem = se.querySelector("#timerText");
            timerTextElem.textContent = timeLeft.getString();
            timerTextElem.style.setProperty("color", getComputedStyle(timerTextElem).getPropertyValue(timeLeft.seconds < 0 ? "--displayed-highlight-color" : "--fg-color"));
            // back frame 
            const timeFrac = timeLeft.seconds / this.time.seconds;
            // Find last whose segment was passed.
            let minSeg = this.segments[0];
            for (let seg of this.segments)
                if (seg.timeFracBegin >= timeFrac && seg.timeFracBegin < minSeg.timeFracBegin)
                    minSeg = seg;
            se.querySelector("#backFrameRect").style.setProperty("fill", minSeg.color);
            // set mask height
            //NOTE: this could be done by CSS animation (in the future -- if it is considered benefitial)
            const swString = getComputedStyle(se).getPropertyValue("--segment-height");
            const sw = Number(swString.match(/\d{1,3}/)[0]);
            se.querySelector("#maskRect").style.setProperty("--individual-seg-height", `${sw * timeFrac}%`);
        }
    }
}
/**
 * Class implementing horizontal layout of a timer.
 */
export class HorizontalTimer extends Timer {
    getStyle() { return TimerStyle.horizontal; }
    fillSVG(se) {
        se.dataset.timerType = this.getStyle();
        const swString = getComputedStyle(se).getPropertyValue("--segment-width");
        const sw = Number(swString.match(/\d{1,3}/)[0]);
        // segment elements must be sortied in descending order in respect to their width -- otherwise more narrow `rect` elements would be covered by the wider ones
        const segmentElems = this.segments.sort((ts1, ts2) => -(ts1.timeFracBegin - ts2.timeFracBegin)).map((ts) => {
            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.classList.add("segmentLike");
            rect.style.setProperty("fill", ts.color);
            rect.style.setProperty("width", `${sw * ts.timeFracBegin}%`);
            return rect;
        });
        se.innerHTML = `
            <mask id="segmentMask" mask-type="luminance">
                <rect fill="black" width="100%" height="100%"/>
                <rect id="maskRect" fill="white" class="segmentLike"/>
            </mask>
            <g id="timerGroup">
                <rect id="backFrameRect"/>
                <rect id="backRect" class="segmentLike"/>
                <g id="segmentsGroup" mask="url(#segmentMask)">
                </g>
                <rect id="bottomPannel"/>
                <text id="timerText"></text>
            </g>`;
        se.querySelector("#segmentsGroup").replaceChildren(...segmentElems);
        this.updateDisplayed(se);
    }
    updateDisplayed(se) {
        const running = getRunningCpy();
        const runA = running.filter((tR) => tR.timerId === this.id);
        if (runA.length > 0 && runA[0].isPaused()) {
            se.style.setProperty("filter", "grayscale(1)");
        }
        else {
            se.style.setProperty("filter", "grayscale(0)");
            const timeLeft = runA.length > 0 ? runA[0].timeLeft() : this.time;
            // timer text
            const timerTextElem = se.querySelector("#timerText");
            timerTextElem.textContent = timeLeft.getString();
            timerTextElem.style.setProperty("color", getComputedStyle(timerTextElem).getPropertyValue(timeLeft.seconds < 0 ? "--displayed-highlight-color" : "--fg-color"));
            // back frame 
            const timeFrac = timeLeft.seconds / this.time.seconds;
            // Find last whose segment was passed.
            let minSeg = this.segments[0];
            for (let seg of this.segments)
                if (seg.timeFracBegin >= timeFrac && seg.timeFracBegin < minSeg.timeFracBegin)
                    minSeg = seg;
            se.querySelector("#backFrameRect").style.setProperty("fill", minSeg.color);
            // set mask width
            //NOTE: this could be done by CSS animation (in the future -- if it is considered benefitial)
            const swString = getComputedStyle(se).getPropertyValue("--segment-width");
            const sw = Number(swString.match(/\d{1,3}/)[0]);
            se.querySelector("#maskRect").style.setProperty("width", `${sw * timeFrac}%`);
        }
    }
}
// S.J.C.G.(=solo Jesus Christos gloria)
