var index = null;

window.addEventListener("keypress", e => {
    window.opener.postMessage("keypress," + e.key, "*");
});
window.addEventListener("keydown", e => {
    window.opener.postMessage("keydown," + e.key, "*");
});
window.addEventListener("keyup", e => {
    window.opener.postMessage("keyup," + e.key, "*");
});
window.addEventListener("resize", () => {
    window.opener.postMessage("reset", "*");
});
window.addEventListener("unload", () => {
    window.opener.postMessage("reset", "*");
    window.opener.postMessage("deregister," + index, "*");
});
window.addEventListener("load", () => {
    window.opener.postMessage("reset", "*");
});
window.addEventListener("message", e => {
    var command = e.data.split(",");

    switch (command[0]) {
        case "set":
            index = command[1];
            break;
        case "position":
            if (index !== null)
                window.opener.postMessage("position," + index + "," + (window.screenX + 8) + "," + window.screenY + "," + (window.innerWidth + 1) + "," + (window.outerHeight - 8), "*")
            break;
    }
});