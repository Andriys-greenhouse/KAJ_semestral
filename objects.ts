import { getTimersCpy } from "./lsManagement";
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
        this.startPoint = new Date(Date.now());
        this.pausedAt = null;
    }

    timeLeft() {
        for (let tmr of getTimersCpy())
            if (tmr.id === this.timerId)
                return new TimerTime(tmr.time.seconds - (Date.now() - this.startPoint.getTime()));
    }

    pause() {
        this.pausedAt || new Date(Date.now());
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

export class VerticalTimer extends Timer {
    getStyle() { return TimerStyle.vertical; }

    fillSVG(se: SVGElement) {
        //TODO: write visualization method
    }
}

export class HorizontalTimer extends Timer {
    getStyle() { return TimerStyle.horizontal; }

    fillSVG(se: SVGElement) {
        //TODO: write visualization method
    }
}