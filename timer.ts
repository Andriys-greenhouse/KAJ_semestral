import { getShowingCpy, getTimersCpy, updateShowing } from "./lsManagement"
import { timerId_t } from "./objects";

const timerId = (new URL(location.href)).searchParams.get("timerId");

if (!timerId || !getTimersCpy().some((tmr) => tmr.id === timerId))
    window.close();

updateShowing(new Array(...getShowingCpy(), timerId as timerId_t));
