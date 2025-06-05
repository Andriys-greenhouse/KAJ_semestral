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

    getHours() { return Math.floor(this.seconds / (60 * 60)); }

    getMinutes() { return Math.floor((this.seconds % (60 * 60)) / 60); }

    getSeconds() { return Math }
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
    timer: Timer;
    startPoint: Date;

    constructor(timer: Timer) {
        this.timer = timer;
        this.startPoint = new Date(Date.now());
    }
}

export enum TimerStyle {
    Vertical,
    Horizontal
}

export type timerId_t = string;

export class Timer {
    static defaultSegments: TimerSegment[] = [
        new TimerSegment(`rgb(${252}, ${42}, ${5})`, 0.05), // red
        new TimerSegment(`rgb(${247}, ${236}, ${24})`, 0.20), // yellow
        new TimerSegment(`rgb(${61}, ${247}, ${24})`, 1), // green
    ];

    id: timerId_t;
    segments: TimerSegment[];
    title: string;
    time: TimerTime;
    style: TimerStyle;
    constructor(title: string, time: TimerTime, style: TimerStyle, segments=Timer.defaultSegments) {
        this.id = self.crypto.randomUUID();
        this.title = title;
        this.time = time;
        this.style = style;
        this.segments = segments;
    }

    // define `fillSVG(svgElem)` in all children
}

export class VerticalTimer extends Timer {
    fillSVG(se: SVGElement) {
        //TODO: write visualization method
    }
}

export class HorizontalTimer extends Timer {
    fillSVG(se: SVGElement) {
        //TODO: write visualization method
    }
}