// canvas positioning and resolution stuff
const ANIMATION_LAYER = document.getElementById("animationLayer");
const BACKGROUND_LAYER = document.getElementById("backgroundLayer");

const CANVAS_RATIO_X = 4;
const CANVAS_RATIO_Y = 3;
const CANVAS_RATIO = CANVAS_RATIO_X / CANVAS_RATIO_Y; // width/height

applyRatio(ANIMATION_LAYER, CANVAS_RATIO);
applyRatio(BACKGROUND_LAYER, CANVAS_RATIO);

function applyRatio(canvas, ratio) {
    var height;

    var width = window.innerHeight * ratio;
    if (width <= window.innerWidth) {
        // shouldn't be higher than window.innerWidth
        height = window.innerHeight;
        // apply margin to horizontally center canvas
        canvas.style.marginLeft = (window.innerWidth - width) / 2 + "px";
        // reset any unwanted margins
        canvas.style.marginTop = "0";
    } else {
        height = window.innerWidth / ratio; // shouldn't be higher than window.innerHeight
        width = window.innerWidth;
        // reset any unwanted margins
        canvas.style.marginLeft = "0";
        // apply margin to vertically center canvas
        canvas.style.marginTop = (window.innerHeight - height) / 2 + "px";
    }
    // canvas local height resolution
    canvas.height = height;
    // canvas local width resolution
    canvas.width = width;
    // canvas display height resolution
    canvas.style.height = height + "px";
    // canvas display width resolution
    canvas.style.width = width + "px";
}

var canvasScreenOffset = null;
var offsetUpdateNeeded = null;

window.addEventListener("mousemove", e => {
    if (!canvasScreenOffset || offsetUpdateNeeded) {
        canvasScreenOffset = [
            (e.screenX - e.clientX) + ((window.innerWidth - ANIMATION_LAYER.width) / 2),
            (e.screenY - e.clientY) + ((window.innerHeight - ANIMATION_LAYER.height) / 2)
        ];
    }
});

window.addEventListener("resize", () => {
    offsetUpdateNeeded = true;
});
//--------------------------------------------------------------------------------------------------------------
// image creating functions
const BACKGROUND_CTX = BACKGROUND_LAYER.getContext("2d");
BACKGROUND_CTX.fillStyle = "#ffffff";
BACKGROUND_CTX.fillRect(0, 0, BACKGROUND_LAYER.width, BACKGROUND_LAYER.height);

const ANIMATION_CTX = ANIMATION_LAYER.getContext("2d");

function getBall(radius, color) {
    var canvas = document.createElement("canvas");
    canvas.height = radius * 2;
    canvas.width = radius * 2;

    var ctx = canvas.getContext("2d");
    ctx.fillStyle = color;
    ctx.arc(radius, radius, radius - 1, 0, Math.PI * 2);
    ctx.fill();

    return canvas;
}

//--------------------------------------------------------------------------------------------------------------
// player
const POSSIBLE_STATES = ["neutral", "halfCharge", "fullCharge", "overCharge"];
var size = 34;
const PLAYER = {
    // display stuff
    size: size,
    images: {
        neutral: getBall(size / 2, "#000000"),
        halfCharge: getBall(size / 2, "#880000"),
        fullCharge: getBall(size / 2, "#bb0000"),
        overCharge: getBall(size / 2, "#ff0000"),
    },
    state: POSSIBLE_STATES[0],
    position: [
        Math.round(ANIMATION_LAYER.width / 2) - (size / 2),
        ANIMATION_LAYER.height - (size - 1)
    ],
    reset: function () {
        this.velocity = [0, 0];
        this.state = POSSIBLE_STATES[0];
        this.position = [
            Math.round(ANIMATION_LAYER.width / 2) - (size / 2),
            ANIMATION_LAYER.height - (size - 1)
        ];
    },
    // world physics
    gravity: 1,
    gravityDir: {
        yAchsis: true,
        positiv: true,
    },
    changeGravity: function (dir) {
        this.grounded = false;
        this.walkDir = 0;
        down = {
            yAchsis: true,
            positiv: true
        };
        up = {
            yAchsis: true,
            positiv: false
        };
        left = {
            yAchsis: false,
            positiv: false
        };
        right = {
            yAchsis: false,
            positiv: true
        };
        if (this.gravityDir.yAchsis && this.gravityDir.positiv) {
            if (dir === -1) {
                this.gravityDir = left;
            } else {
                this.gravityDir = right;
            }
        } else if (!this.gravityDir.yAchsis && !this.gravityDir.positiv) {
            if (dir === -1) {
                this.gravityDir = up;
            } else {
                this.gravityDir = down;
            }
        } else if (this.gravityDir.yAchsis && !this.gravityDir.positiv) {
            if (dir === -1) {
                this.gravityDir = right;
            } else {
                this.gravityDir = left;
            }
        } else if (!this.gravityDir.yAchsis && this.gravityDir.positiv) {
            if (dir === -1) {
                this.gravityDir = down;
            } else {
                this.gravityDir = up;
            }
        }
    },
    velocity: [0, 0],
    applyGravity: function () {
        var achsis = this.gravityDir.yAchsis ? 1 : 0;
        if (!this.grounded) this.velocity[achsis] += this.gravityDir.positiv ? this.gravity : -this.gravity;
    },
    applyVelocity: function () {
        this.position[0] += this.velocity[0];
        this.position[1] += this.velocity[1];
    },
    // player action
    jumpForce: 10,
    grounded: false,
    jumpDir: null,
    jump: function () {
        var state = POSSIBLE_STATES.indexOf(this.state);
        if (this.jumpDir && state) {
            var achsis = this.jumpDir.yAchsis ? 1 : 0;
            var dir = this.jumpDir.positiv ? 1 : -1;
            var againstGravity = this.jumpDir.positiv !== this.gravityDir.positiv && this.jumpDir.yAchsis === this.gravityDir.yAchsis;
            this.velocity[achsis] = dir * this.jumpForce * state;
            if (!againstGravity) {
                this.velocity[achsis] /= 2;
            }

            this.state = POSSIBLE_STATES[state - 1];
            this.grounded = false;
            this.jumpDir = null;
        }
    },
    charge: function () {
        var state = POSSIBLE_STATES.indexOf(this.state);
        if (state < POSSIBLE_STATES.length - 3)
            this.state = POSSIBLE_STATES[state + 2];
        else
            this.state = POSSIBLE_STATES[POSSIBLE_STATES.length - 1];

    },
    rollSpeed: 3,
    friction: 1.2,
    walkDir: 0,
    roll: function () {
        if (this.grounded) {
            var achsis = this.gravityDir.yAchsis ? 0 : 1;
            this.velocity[achsis] += this.walkDir * this.rollSpeed;
            this.velocity[achsis] /= this.friction;
            if (Math.abs(this.velocity[achsis]) < 0.1) {
                this.velocity[achsis] = 0;
                this.walkDir = 0;
            }
        }
    },
    worldCollision: function () {
        var state = POSSIBLE_STATES.indexOf(this.state);
        // ground colliosion
        if (this.position[1] + (this.size - 1) >= ANIMATION_LAYER.height) {
            this.velocity[1] = 0;
            this.position[1] = ANIMATION_LAYER.height - (this.size - 1);
            if (!this.grounded && !state && this.gravityDir.yAchsis && this.gravityDir.positiv) {
                this.grounded = true;
            }
            else if (state) {
                this.jumpDir = {
                    yAchsis: true,
                    positiv: false
                }
            }
        }
        // wall colliosion
        if (this.position[0] + (this.size - 1) >= ANIMATION_LAYER.width) {
            this.velocity[0] = 0;
            this.position[0] = ANIMATION_LAYER.width - (this.size - 1);
            if (!this.grounded && !state && !this.gravityDir.yAchsis && this.gravityDir.positiv) {
                this.grounded = true;
            }
            else if (state) {
                this.jumpDir = {
                    yAchsis: false,
                    positiv: false
                }
            }
        }
        if (this.position[0] <= -1) {
            this.velocity[0] = 0;
            this.position[0] = -1;
            if (!this.grounded && !state && !this.gravityDir.yAchsis && !this.gravityDir.positiv) {
                this.grounded = true;
            }
            else if (state) {
                this.jumpDir = {
                    yAchsis: false,
                    positiv: true
                }
            }
        }
        // ceiling colliosion
        if (this.position[1] <= -1) {
            this.velocity[1] = 0;
            this.position[1] = -1;
            if (!this.grounded && !state && this.gravityDir.yAchsis && !this.gravityDir.positiv) {
                this.grounded = true;
            }
            else if (state) {
                this.jumpDir = {
                    yAchsis: true,
                    positiv: true
                }
            }
        }
    },
    popupCollision(place) {
        if (place) {
            var state = POSSIBLE_STATES.indexOf(this.state);
            switch (place) {
                case "topLeft":
                    if (this.velocity[0] > 0 || this.velocity[1] > 0) {
                        if (state) {
                            this.velocity[1] /= 2;
                            this.velocity[0] /= 2;

                            this.velocity[0] -= this.jumpForce * state / 2;
                            this.velocity[1] -= this.jumpForce * state / 2;
                            this.state = POSSIBLE_STATES[state - 1];
                        } else {
                            this.velocity[1] = -5;
                            this.velocity[0] = -5;
                        }
                    }
                    break;
                case "topRight":
                    if (this.velocity[0] < 0 || this.velocity[1] > 0) {
                        if (state) {
                            this.velocity[1] /= 2;
                            this.velocity[0] /= 2;

                            this.velocity[0] += this.jumpForce * state / 2;
                            this.velocity[1] -= this.jumpForce * state / 2;
                            this.state = POSSIBLE_STATES[state - 1];
                        } else {
                            this.velocity[1] = -5;
                            this.velocity[0] = 5;
                        }
                    }
                    break;
                case "bottomLeft":
                    if (this.velocity[0] > 0 || this.velocity[1] < 0) {
                        if (state) {
                            this.velocity[1] /= 2;
                            this.velocity[0] /= 2;

                            this.velocity[0] -= this.jumpForce * state / 2;
                            this.velocity[1] += this.jumpForce * state / 2;
                            this.state = POSSIBLE_STATES[state - 1];
                        } else {
                            this.velocity[1] = 5;
                            this.velocity[0] = -5;
                        }
                    }
                    break;
                case "bottomRight":
                    if (this.velocity[0] < 0 || this.velocity[1] < 0) {
                        if (state) {
                            this.velocity[1] /= 2;
                            this.velocity[0] /= 2;

                            this.velocity[0] += this.jumpForce * state / 2;
                            this.velocity[1] += this.jumpForce * state / 2;
                            this.state = POSSIBLE_STATES[state - 1];
                        } else {
                            this.velocity[1] = 5;
                            this.velocity[0] = 5;
                        }
                    }
                    break;
                case "top":
                    this.velocity[1] = 0;
                    if (!this.grounded && !state && this.gravityDir.yAchsis && this.gravityDir.positiv) {
                        this.grounded = true;
                    }
                    else if (state) {
                        this.jumpDir = {
                            yAchsis: true,
                            positiv: false
                        }
                    } else if (!this.grounded) {
                        this.velocity[1] = -3;
                    }
                    break;
                case "right":
                    this.velocity[0] = 0;
                    if (!this.grounded && !state && !this.gravityDir.yAchsis && !this.gravityDir.positiv) {
                        this.grounded = true;
                    }
                    else if (state) {
                        this.jumpDir = {
                            yAchsis: false,
                            positiv: true
                        }
                    } else if (!this.grounded) {
                        this.velocity[0] = 3;
                    }
                    break;
                case "left":
                    this.velocity[0] = 0;
                    if (!this.grounded && !state && !this.gravityDir.yAchsis && this.gravityDir.positiv) {
                        this.grounded = true;
                    }
                    else if (state) {
                        this.jumpDir = {
                            yAchsis: false,
                            positiv: false
                        }
                    } else if (!this.grounded) {
                        this.velocity[0] = -3;
                    }
                    break;
                case "bottom":
                    this.velocity[1] = 0;
                    if (!this.grounded && !state && this.gravityDir.yAchsis && !this.gravityDir.positiv) {
                        this.grounded = true;
                    }
                    else if (state) {
                        this.jumpDir = {
                            yAchsis: true,
                            positiv: true
                        }
                    } else if (!this.grounded) {
                        this.velocity[1] = 3;
                    }
                    break;
            }
        }
    }
};

window.addEventListener("keydown", e => {
    playerDownEvents(e);
});
window.addEventListener("keyup", e => {
    playerUpEvents(e);
});
window.addEventListener("keypress", e => {
    playerPressEvents(e);
    windowPressEvents(e);
    requestWindowPosition();
});

function playerDownEvents(e) {
    switch (e.key) {
        case "a":
            if (PLAYER.gravityDir.yAchsis)
                PLAYER.walkDir = -1;
            break;
        case "d":
            if (PLAYER.gravityDir.yAchsis)
                PLAYER.walkDir = 1;
            break;
        case "w":
            if (!PLAYER.gravityDir.yAchsis)
                PLAYER.walkDir = -1;
            break;
        case "s":
            if (!PLAYER.gravityDir.yAchsis)
                PLAYER.walkDir = 1;
            break;
    }
}
function playerUpEvents(e) {
    switch (e.key) {
        case "a":
            if (PLAYER.walkDir === -1 && PLAYER.gravityDir.yAchsis)
                PLAYER.walkDir = 0;
            break;
        case "d":
            if (PLAYER.walkDir === 1 && PLAYER.gravityDir.yAchsis)
                PLAYER.walkDir = 0;
            break;
        case "w":
            if (PLAYER.walkDir === -1 && !PLAYER.gravityDir.yAchsis)
                PLAYER.walkDir = 0;
            break;
        case "s":
            if (PLAYER.walkDir === 1 && !PLAYER.gravityDir.yAchsis)
                PLAYER.walkDir = 0;
            break;
    }
}
function playerPressEvents(e) {
    switch (e.key) {
        case " ":
            PLAYER.charge();
            break;
        case "q":
            PLAYER.changeGravity(-1);
            break;
        case "e":
            PLAYER.changeGravity(1);
            break;
        case "x":
            closeAll();
            break;
        case "r":
            focusAll();
            break;
    }
}
//--------------------------------------------------------------------------------------------------------------
// window manager
const POPUPS = [];

function windowPressEvents(e) {
    switch (e.key) {
        case "c":
            var index = POPUPS.length;
            var popupWrapper = {
                ref: window.open("index2.html", "_blank", "height=150,width=200,menubar=no,location=yes,resizable=no,scrollbars=no,status=no"),
                position: null,
                size: null
            }
            POPUPS.push(popupWrapper);
            setTimeout(function () {
                POPUPS[index].ref.postMessage("set," + index, "*");
            }, 200)
            break;
    }
}

function requestWindowPosition() {
    for (var i = 0; i < POPUPS.length; i++) {
        if (POPUPS[i]) POPUPS[i].ref.postMessage("position", "*");
    }
}

window.addEventListener("message", e => {
    var command = e.data.split(",");
    switch (command[0]) {
        case "keypress":
            requestWindowPosition();
            playerPressEvents({ key: command[1] });
            windowPressEvents({ key: command[1] });
            break;
        case "keyup":
            playerUpEvents({ key: command[1] });
            break;
        case "keydown":
            playerDownEvents({ key: command[1] });
            break;
        case "reset":
            requestWindowPosition();
            break;
        case "deregister":
            POPUPS[command[1]] = null;
            break;
        case "position":
            if (POPUPS[command[1]]) {
                var popup = POPUPS[command[1]];
                popup.position = [parseInt(command[2]) - canvasScreenOffset[0], parseInt(command[3]) - canvasScreenOffset[1]];
                popup.size = [parseInt(command[4]), parseInt(command[5])];
            }
            break;
    }
})

window.addEventListener("unload", () => {
    closeAll();
})

function closeAll() {
    for (var i = 0; i < POPUPS.length; i++) {
        if (POPUPS[i]) {
            POPUPS[i].ref.close();
            POPUPS[i] = null;
        }
    }
}

function focusAll() {
    for (var i = 0; i < POPUPS.length; i++) {
        if (POPUPS[i]) {
            // POPUPS[i].ref.focus();
            POPUPS[i].ref.postMessage("focus", "*");
        }
    }
}
//--------------------------------------------------------------------------------------------------------------
// collision manager
function intersect(popup) {
    playerVec = [
        PLAYER.position[0] + (PLAYER.size / 2),
        PLAYER.position[1] + (PLAYER.size / 2),
    ];

    playerRadius = PLAYER.size / 2;

    var topLeft = [
        popup.position[0] - 1,
        popup.position[1] - 1
    ];
    var topRight = [
        popup.position[0] + popup.size[0] + 1,
        popup.position[1] - 1
    ];
    var bottomRight = [
        popup.position[0] + popup.size[0] + 1,
        popup.position[1] + popup.size[1] + 1
    ];
    var bottomLeft = [
        popup.position[0] - 1,
        popup.position[1] + popup.size[1] + 1
    ];

    if (circleLineCollision(topLeft, topRight, playerVec, playerRadius)) {
        PLAYER.position[1] = topLeft[1] - PLAYER.size + 1;
        return "top";
    }
    else if (circleLineCollision(bottomRight, topRight, playerVec, playerRadius)) {
        PLAYER.position[0] = topRight[0] - 2;
        return "right";
    }
    else if (circleLineCollision(bottomLeft, topLeft, playerVec, playerRadius)) {
        PLAYER.position[0] = topLeft[0] - PLAYER.size + 1;
        return "left";
    }
    else if (circleLineCollision(bottomLeft, bottomRight, playerVec, playerRadius)) {
        PLAYER.position[1] = bottomLeft[1] - 2;
        return "bottom";
    }
    if (circlePointCollision(topLeft, playerVec, playerRadius)) return "topLeft";
    else if (circlePointCollision(topRight, playerVec, playerRadius)) return "topRight";
    else if (circlePointCollision(bottomRight, playerVec, playerRadius)) return "bottomRight";
    else if (circlePointCollision(bottomLeft, playerVec, playerRadius)) return "bottomLeft";
}



function circleLineCollision(vec1, vec2, vec3, radius, debug) {
    var lineLength = getDistance(vec1, vec2);
    var dot = (((vec3[0] - vec1[0]) * (vec2[0] - vec1[0])) + ((vec3[1] - vec1[1]) * (vec2[1] - vec1[1]))) / Math.pow(lineLength, 2);
    var closestX = vec1[0] + (dot * (vec2[0] - vec1[0]));
    var closestY = vec1[1] + (dot * (vec2[1] - vec1[1]));
    if (!linePoint(vec1, vec2, [closestX, closestY])) return false;
    return circlePointCollision([closestX, closestY], vec3, radius);
};

function linePoint(vec1, vec2, vec3) {
    var distance1 = getDistance(vec1, vec3);
    var distance2 = getDistance(vec2, vec3);

    var lineLength = getDistance(vec1, vec2);

    var buffer = 0.1;

    if (distance1 + distance2 >= lineLength - buffer && distance1 + distance2 <= lineLength + buffer) {
        return true;
    }
    return false;
}

function circlePointCollision(vec1, vec2, radius) {
    return getDistance(vec1, vec2) < radius;
}

function getDistance(vec1, vec2) {
    xDiff = vec1[0] - vec2[0];
    yDiff = vec1[1] - vec2[1];
    return Math.sqrt((xDiff * xDiff) + (yDiff * yDiff));
}

function windowCollision() {
    for (var i = 0; i < POPUPS.length; i++) {
        if (POPUPS[i] && POPUPS[i].position && POPUPS[i].size) {
            PLAYER.popupCollision(intersect(POPUPS[i]));
        }
    }
}
//--------------------------------------------------------------------------------------------------------------
// window functionality
//--------------------------------------------------------------------------------------------------------------
var gameLoop = setInterval(() => {
    PLAYER.grounded = false;
    PLAYER.worldCollision();
    windowCollision();
    ANIMATION_CTX.clearRect(0, 0, ANIMATION_LAYER.width, ANIMATION_LAYER.height);
    ANIMATION_CTX.drawImage(PLAYER.images[PLAYER.state], PLAYER.position[0], PLAYER.position[1]);
    PLAYER.jump();
    PLAYER.roll();
    PLAYER.applyGravity();
    PLAYER.applyVelocity();
}, 1000 / 60);