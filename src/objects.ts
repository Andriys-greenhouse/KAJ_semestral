import { getRunningCpy, getTimersCpy } from "./lsManagement";
import { formatToIntPlaces } from "./utils";

//following copyed from: https://stackoverflow.com/questions/42584228/how-can-i-define-a-type-for-a-css-color-in-typescript
type RGB = `rgb(${number}, ${number}, ${number})`;
type RGBA = `rgba(${number}, ${number}, ${number}, ${number})`;
type HEX = `#${string}`;
type Color = RGB | RGBA | HEX;

export class TimerTime {
    seconds: number;
    constructor(seconds: number) {
        this.seconds = Math.floor(seconds); // we want an integer
    }

    // ! NOTE: following methods/functions return *signed* results !
    getHours() { return Math.floor(this.seconds / (60 * 60)); }
    getMinutes() { return Math.floor((this.seconds % (60 * 60)) / 60); }
    getSeconds() { return Math.floor(this.seconds % 60); }

    getString() { return `${this.seconds < 0 ? "-" : ""}${formatToIntPlaces(Math.abs(this.getHours()), 2)}:${formatToIntPlaces(Math.abs(this.getMinutes()), 2)}:${formatToIntPlaces(Math.abs(this.getSeconds()), 2)}` }
}

export class TimerSegment {
    timeFracBegin: number; // floating point number from interval [0, 1] indicating how much of overall timer time should the segment become active
    color: Color;

    constructor(color: Color, timeFracBegin: number) {
        this.timeFracBegin = timeFracBegin;
        this.color = color;
    }
}

export class TimerRun {
    timerId: timerId_t;
    startPoint: Date;
    pausedAt: Date | null;

    constructor(timerId: timerId_t) {
        this.timerId = timerId;
        this.startPoint = new Date(Date.now()); // does not need to indicate time of start of the `Timer` instance (see the `unpause()` method of this class)
        this.pausedAt = null;
    }

    //can return negative number
    timeLeft() {
        for (let tmr of getTimersCpy())
            if (tmr.id === this.timerId)
                return new TimerTime(tmr.time.seconds - Math.floor((Date.now() - this.startPoint.getTime())/1000));
    }

    togglePause() {
        if (this.pausedAt) {
            this.unpause();
        } else {
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

export enum TimerStyle {
    horizontal = "horizontal", vertical = "vertical"
}

/** Function for transformation of (deserialized) `Timer` class instance into instance of class inheriting from it. */
export function getAsInstanceOfChildClass(ts: TimerStyle, tmr: Timer): TimerChild {
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

export type timerId_t = string;

export class Timer {
    static defaultSegments: TimerSegment[] = [
        new TimerSegment(`rgb(${252}, ${42}, ${5})`, 0.05), // red
        new TimerSegment(`rgb(${247}, ${236}, ${24})`, 0.20), // yellow
        new TimerSegment(`rgb(${61}, ${247}, ${24})`, 1), // green
    ];
    getStyle() { return undefined; }

    id: timerId_t;
    segments: TimerSegment[];
    title: string;
    time: TimerTime; // NOTE: !!! zero seconds is a vallid `TimerTime` !!!
    constructor(title: string, time: TimerTime, segments: TimerSegment[]=Timer.defaultSegments) {
        this.id = self.crypto.randomUUID();
        this.title = title;
        this.time = time;
        this.segments = segments;
    }

    // define `fillSVG(svgElem)` in all children
}

export type TimerChild = HorizontalTimer | VerticalTimer;

export class VerticalTimer extends Timer {
    getStyle() { return TimerStyle.vertical; }

    fillSVG(se: SVGElement) {
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

    updateDisplayed(se: SVGElement) {
        const running = getRunningCpy();
        const runA = running.filter((tR) => tR.timerId === this.id);

        if (runA.length > 0 && runA[0].isPaused()) {
            se.style.setProperty("filter", "grayscale(1)");
        } else {
            se.style.setProperty("filter", "grayscale(0)");
            const timeLeft = runA.length > 0 ? runA[0].timeLeft() : this.time;

            // timer text
            const timerTextElem = se.querySelector("#timerText") as SVGTextElement;
            timerTextElem.textContent = timeLeft.getString();
            timerTextElem.style.setProperty("color", getComputedStyle(timerTextElem).getPropertyValue(timeLeft.seconds < 0 ? "--displayed-highlight-color" : "--fg-color"));

            // back frame 
            const timeFrac = timeLeft.seconds / this.time.seconds;
            // Find last whose segment was passed.
            let minSeg = this.segments[0];
            for (let seg of this.segments)
                if (seg.timeFracBegin >= timeFrac && seg.timeFracBegin < minSeg.timeFracBegin)
                    minSeg = seg;

            (se.querySelector("#backFrameRect") as SVGRectElement).style.setProperty("fill", minSeg.color);

            // set mask height
            //NOTE: this could be done by CSS animation (in the future -- if it is considered benefitial)
            const swString = getComputedStyle(se).getPropertyValue("--segment-height");
            const sw = Number(swString.match(/\d{1,3}/)[0]);
            (se.querySelector("#maskRect") as SVGRectElement).style.setProperty("--individual-seg-height", `${sw * timeFrac}%`);
        }
    }
}

export class HorizontalTimer extends Timer {
    getStyle() { return TimerStyle.horizontal; }

    fillSVG(se: SVGElement) {
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

    updateDisplayed(se: SVGElement) {
        const running = getRunningCpy();
        const runA = running.filter((tR) => tR.timerId === this.id);

        if (runA.length > 0 && runA[0].isPaused()) {
            se.style.setProperty("filter", "grayscale(1)");
        } else {
            se.style.setProperty("filter", "grayscale(0)");
            const timeLeft = runA.length > 0 ? runA[0].timeLeft() : this.time;

            // timer text
            const timerTextElem = se.querySelector("#timerText") as SVGTextElement;
            timerTextElem.textContent = timeLeft.getString();
            timerTextElem.style.setProperty("color", getComputedStyle(timerTextElem).getPropertyValue(timeLeft.seconds < 0 ? "--displayed-highlight-color" : "--fg-color"));

            // back frame 
            const timeFrac = timeLeft.seconds / this.time.seconds;
            // Find last whose segment was passed.
            let minSeg = this.segments[0];
            for (let seg of this.segments)
                if (seg.timeFracBegin >= timeFrac && seg.timeFracBegin < minSeg.timeFracBegin)
                    minSeg = seg;

            (se.querySelector("#backFrameRect") as SVGRectElement).style.setProperty("fill", minSeg.color);

            // set mask width
            //NOTE: this could be done by CSS animation (in the future -- if it is considered benefitial)
            const swString = getComputedStyle(se).getPropertyValue("--segment-width");
            const sw = Number(swString.match(/\d{1,3}/)[0]);
            (se.querySelector("#maskRect") as SVGRectElement).style.setProperty("width", `${sw * timeFrac}%`);
        }
    }
}
