import { onOnline, onOffline } from "./utils.ts";

// find out whether online
addEventListener("offline", onOffline);
addEventListener("online", onOnline);
//`navigator` from: https://www.w3schools.com/howto/howto_js_offline_detection.asp
(navigator.onLine ? onOnline : onOffline)(new Event(""));
