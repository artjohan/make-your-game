import { mapTerrain } from "./mapping.js"
import { maps } from "./maps.js"
import { Player } from "./gameelements.js"

export var gameInfo = {}
export var gameElements = {}
export var player

var leftBoundary, rightBoundary, times, requestID, timerStart, now, minutes, seconds

// initialize data, useful for starting the game/resetting the map more easily
const init = () => {
    gameElements = {
        platforms: [],
        movingPlatforms: [],
        collisionTerrains: [],
        linearEnemies: [],
        points: []
    }

    gameInfo.hasWon = false
    gameInfo.paused = false
    gameInfo.gameOver = false
    gameInfo.score = 0
    gameInfo.scrolledDistance = 0
    gameInfo.endPoint = gameInfo.map.tiles.length*30*25-500 // the endpoint is the length of the map times 25 (since each tile is 25x25px) - 500px for the movement boundaries

    if(gameInfo.enemySpeed === 1) {
        gameInfo.lives = 1
    } else {
        gameInfo.lives = 3
    }

    leftBoundary = 0
    rightBoundary = 450
    seconds = gameInfo.seconds
    minutes = gameInfo.minutes
    times = []
}

// function used to start the game/reset the map, if first is false, it indicates a reset instead of an initial start
function start(map, first = true) {
    init()

    createArenaElements()
    mapTerrain(map)
    if(first) {
        addPauseListener()
    }
    
    // creating all the initial elements
    Object.values(gameElements).forEach((element) => {
        element.forEach(entity => {
            entity.draw()
        })
    })

    player = new Player(map.startPos)
    player.draw()

    // keeps count of time since the game was started
    timerStart = Date.now()
    gameloop()
}

// main loop that runs using requestanimationframe, controls the game
function gameloop() {
    scoreboard.textContent = "Score: " + gameInfo.score
    fpsCounter.textContent = "FPS: " + calculateFPS()
    // checks if player has died or has been stunned, if neither of those things are true, requestanimationframe runs at a normal rate
    if(player.position.y < 850 && !gameInfo.hasWon) {
        // stage gets reset if player is stunned (has lost a life)
        if(player.stunned) {
            setTimeout(() => {
                requestID = requestAnimationFrame(gameloop)
                resetStage()
            }, 1000)
            player.stunned = false
        } else {
            requestID = requestAnimationFrame(gameloop)
        }
    }
    // checking if the player has fallen of the map, removes a life and resets player if there are lives left, otherwise kills the player
    if(player.position.y > 725) {
        if(gameInfo.lives > 1) {
            player.stunned = true
        } else {
            player.dead = true
        }
    }
    // creates/displays the end screen if player has died/completed the level
    if(player.position.y > 850 || gameInfo.hasWon) {
        if(!gameInfo.hasWon) {
            lifeCounter.textContent = "Lives: 0"
        }
        setTimeout(() => {
            if(!document.getElementById("endScreen")) {
                createEndScreen()
            } else {
                document.getElementById("endScreen").style.visibility = "visible"
            }
        }, 1000)
    }
    // controls all the movement on the screen if the game isn't paused
    if(!gameInfo.paused) {
        player.update()
        // player update is separate so there can be a death animation
        if(!player.dead && !player.stunned) {
            updateTimer()
            updateTerrain()
            movePlayer()
            terrainCollision()
            checkWin()
        }
    }
}

// updates dynamic elements like points, moving platforms and enemies that move
const updateTerrain = () => {
    gameElements.movingPlatforms.forEach(movingPlatform => {
        movingPlatform.update()
    })
    gameElements.linearEnemies.forEach(enemy => {
        if(enemy.position.y < 800) {
            enemy.update()
        } else {
            enemy.linearEnemy.remove()
        }
    })
    gameElements.points.forEach(point => {
        // point collision, removes the point and adds to the score if player touches a point
        if(point.touchesPlayer()) {
            point.pointDiv.remove()
            point.collected = true
            gameInfo.score += (100*gameInfo.scoreMultiplier)
        }
    })
}

// controls the movement of the player/movement of the environment in relation to the player when applicable
const movePlayer = () => {
    // checks for movement to the right
    if(player.keyPressed.right) {
        player.playerDiv.style.transform = "scaleX(1)"
        if(player.position.x < rightBoundary) {
            player.velocity.x = player.defaultVelocity // moves player if the player is not at the screen boundary, otherwise moves the environment to create the illusion of scrolling
        } else {
            player.velocity.x = 0
            if(gameInfo.scrolledDistance <= gameInfo.endPoint-250) {
                if(gameInfo.scrolledDistance > 0) {
                    leftBoundary = 250
                }
                moveElements(-player.defaultVelocity)
            } else {
                rightBoundary = 710
            }
        }
    } else if(player.keyPressed.left) { // checks for movement to the left
        player.playerDiv.style.transform = "scaleX(-1)"
        if(player.position.x > leftBoundary) {
            player.velocity.x = -player.defaultVelocity // moves player if the player is not at the screen boundary, otherwise moves the environment to create the illusion of scrolling
        } else {
            player.velocity.x = 0
            if(gameInfo.scrolledDistance > 0) {
                if(gameInfo.scrolledDistance <= gameInfo.endPoint-250) {
                    rightBoundary = 450
                }
                moveElements(player.defaultVelocity)
            } else {
                leftBoundary = 0
            }
        }
    } else {
        // moves the player and elements if the player is standing still but is still moving beyong the screen boundary, i.e. moving platforms
        player.velocity.x = 0
        if(player.position.x > rightBoundary+1 && gameInfo.scrolledDistance <= gameInfo.endPoint-250) {
            moveElements(-player.defaultVelocity)
            player.position.x -= player.defaultVelocity
        }
        if(player.position.x < leftBoundary-1 && gameInfo.scrolledDistance > 0) {
            moveElements(player.defaultVelocity)
            player.position.x += player.defaultVelocity
        }
    }
}

// checks if solid terrain is colliding with the player
const terrainCollision = () => {
    gameElements.platforms.forEach(platform => {
        if(platform.carriesObject(player)) {
            player.velocity.y = 0
        }
    })
    gameElements.collisionTerrains.forEach(collisionTerrain => {
        if(collisionTerrain.carriesObject(player)) {
            player.velocity.y = 0
        }
        if(!collisionTerrain.collidesWithRightSide(player) && !collisionTerrain.collidesWithLeftSide(player) && collisionTerrain.collidesWithBase(player)) {
            player.velocity.y = 1
        }
        if(collisionTerrain.collidesWithRightSide(player)) {
            player.position.x += player.defaultVelocity
            player.velocity.x = 0
        }
        if(collisionTerrain.collidesWithLeftSide(player)) {
            player.position.x -= player.defaultVelocity
            player.velocity.x = 0
        }
    })
}

// moves environment forward/backward (amount), also adds to the distance that has been scrolled to check for map edge
const moveElements = (amount) => {
    gameInfo.scrolledDistance -= amount
    Object.values(gameElements).forEach((element) => {
        element.forEach(entity => {
            entity.moveEnvironment(amount)
        })
    })
}

// checks if there are no more points left, if that is the case the objective has been completed
const checkWin = () => {
    var points = document.querySelectorAll("#pointDiv")
    if(points.length === 0) {
        gameInfo.hasWon = true
    }
}

// calculates fps
const calculateFPS = () => {
    const now = performance.now()
    while (times.length > 0 && times[0] <= now - 1000) {
      times.shift()
    }
    times.push(now)
    return times.length
}

// updates the timer every second
const updateTimer = () => {
    now = Date.now()
    if(now-timerStart >= 1000) {
        seconds--
        // if time has run out, player is considered dead and the game ends
        if(minutes === 0 && seconds < 0 && !gameInfo.hasWon) {
            player.dead = true
            gameInfo.lives = 0
        } else {
            if(seconds === -1) {
                minutes--
                seconds = 59
            }
            updateTimerVisual(timer)
            timerStart = now
        }
    }
}

// visually updates the timer
const updateTimerVisual = (field) => {
    if(minutes < 10) {
        field.textContent = "0"
    }
    field.textContent += minutes + ":"
    if(seconds < 10) {
        field.textContent += "0"
    }
    field.textContent += seconds
}

// creates all the html elements that are needed for the arena and scoreboard
const createArenaElements = () => {
    const informationDiv = document.createElement("div")
    informationDiv.id = "informationDiv"
    informationDiv.className = "informationDiv"
    document.body.appendChild(informationDiv)

    const arena = document.createElement("div")
    arena.id = "arenaDiv"
    arena.className = "arena"
    document.body.appendChild(arena)

    const scoreboard = document.createElement("div")
    scoreboard.className = "scoreboard"
    scoreboard.id = "scoreboard"

    const timer = document.createElement("div")
    timer.className = "timer"
    timer.id = "timer"
    updateTimerVisual(timer)

    const lifeCounter = document.createElement("div")
    lifeCounter.className = "lifeCounter"
    lifeCounter.id = "lifeCounter"
    lifeCounter.textContent = "Lives: " + gameInfo.lives

    const fpsCounter = document.createElement("div")
    fpsCounter.className = "fpsCounter"
    fpsCounter.id = "fpsCounter"

    informationDiv.appendChild(scoreboard)
    informationDiv.appendChild(lifeCounter)
    informationDiv.appendChild(timer)
    informationDiv.appendChild(fpsCounter)
}

// creates all the html elements that are needed for the pause menu
const createPauseMenu = () => {
    var pauseMenu = document.createElement("div")
    pauseMenu.id = "pauseMenu"
    pauseMenu.className = "pauseMenu"
    document.getElementById("arenaDiv").appendChild(pauseMenu)

    var unpause = document.createElement("header")
    unpause.textContent = "Press \"P\" or \"ESC\" to unpause"
    unpause.style.color = "white"
    unpause.style.fontSize = "30px"
    pauseMenu.appendChild(unpause)

    var toMainMenu = document.createElement("header")
    toMainMenu.textContent = "Press \"M\" to go back to the main menu"
    toMainMenu.style.color = "white"
    toMainMenu.style.fontSize = "30px"
    toMainMenu.style.marginTop = "100px"
    toMainMenu.style.marginBottom = "100px"
    pauseMenu.appendChild(toMainMenu)

    var restart = document.createElement("header")
    restart.textContent = "Press \"R\" to restart"
    restart.style.color = "white"
    restart.style.fontSize = "30px"
    pauseMenu.appendChild(restart)
}

// creates all the html elements that are needed for the end screen
const createEndScreen = () => {
    var endScreen = document.createElement("div")
    endScreen.style.position = "absolute"
    endScreen.id = "endScreen"
    endScreen.className = "pauseMenu"
    endScreen.style.paddingTop = "50px"
    document.getElementById("arenaDiv").appendChild(endScreen)

    var endMsg = document.createElement("header")
    endMsg.style.fontSize = "70px"
    
    var scoreMsg = document.createElement("header")
    scoreMsg.style.fontSize = "60px"
    scoreMsg.style.color = "white"
    scoreMsg.style.marginTop = "30px"

    var timeBonus = document.createElement("header")
    timeBonus.style.color = "white"
    timeBonus.style.fontSize = "30px"
    timeBonus.style.marginTop = "10px"
    
    var toMainMenu = document.createElement("header")
    toMainMenu.style.color = "white"
    toMainMenu.style.fontSize = "30px"
    toMainMenu.style.marginTop = "60px"
    
    var restart = document.createElement("header")
    restart.style.color = "white"
    restart.style.fontSize = "30px"
    restart.style.marginTop = "60px"

    // separate messages for the end screen depending on game outcome
    if(player.dead) { // player died
        if(minutes <= 0 && seconds <= 0) {
            endMsg.textContent = "Out of time!"
        } else {
            endMsg.textContent = "You died!"
        }
        endMsg.style.color = "red"
        toMainMenu.textContent = "Press \"M\" to go back to the main menu"
        restart.textContent = "Press \"R\" to try again"
    } else { // player won
        endMsg.style.color = "green"
        if(gameInfo.enemySpeed === 1) { // separate message for the impossible difficulty
            endMsg.textContent = "You did the impossible!"
            toMainMenu.textContent = "You can press \"M\" to go back to the main menu or \"R\" to try to beat your score, but there are no more challenges for you"
        } else {
            endMsg.textContent = "You won!"
            toMainMenu.textContent = "Press \"M\" to go back to the main menu and choose a higher difficulty"
            restart.textContent = "Press \"R\" to play this difficulty again"
        }
    }

    endScreen.appendChild(endMsg)
    endScreen.appendChild(scoreMsg)

    // adds bonus points for time left over
    if(gameInfo.hasWon) {
        endScreen.appendChild(timeBonus)
        // updates the timebonus counter every 10ms for a better visual experience
        var scoreInterval = setInterval(() => {
            seconds--
            gameInfo.score+= 10*gameInfo.scoreMultiplier
            if(minutes === 0 && seconds < 0) {
                clearInterval(scoreInterval)
                gameInfo.gameOver = true
                timeBonus.textContent = "Time bonus added!"
            } else {
                if(seconds === -1) {
                    minutes--
                    seconds = 59
                }
                // update both timers visually
                updateTimerVisual(timeBonus)
                updateTimerVisual(timer)
                scoreMsg.textContent = "Score: " + gameInfo.score
                scoreboard.textContent = "Score: " + gameInfo.score
            }
        }, 10)
    } else {
        gameInfo.gameOver = true
        scoreMsg.textContent = "Score: " + gameInfo.score
    }
    endScreen.appendChild(toMainMenu)
    endScreen.appendChild(restart)
}

// resets the stage when the player loses a life, keeping the points status the same so they don't need to be recollected and teleports the player to the start
const resetStage = () => {
    // removes the previous player element and creates a new one
    player.playerDiv.remove()
    player = new Player(gameInfo.map.startPos)
    leftBoundary = 0
    rightBoundary = 450
    gameInfo.scrolledDistance = 0
    // goes through game elements and returns them to their starting positions
    Object.values(gameElements).forEach((element) => {
        element.forEach(entity => {
            entity.position.x = entity.basePos.x
            entity.position.y = entity.basePos.y
            if(entity.startPos) {
                entity.startPos.x = entity.basePos.x
                entity.startPos.y = entity.basePos.y
            }
            if(entity.stunned) { // unstuns enemies if they'd been stunned prior to the players death
                entity.stunIndex = 1000
            }
            entity.draw()
        })
    })
    // removes a life
    gameInfo.lives--
    lifeCounter.textContent = "Lives: " + gameInfo.lives
}

// adds eventlistener for the pause and endscreen menu, only gets called once on initialization, not on resetting the stage
const addPauseListener = () => {
    document.body.addEventListener("keyup", (event) => {
        if(!player.stunned && !player.dead && (event.key === "Escape" || event.key.toLowerCase() === "p")) {
            if(!gameInfo.paused) {
                gameInfo.paused = true
                if(!document.getElementById("pauseMenu")) {
                    createPauseMenu()
                } else {
                    document.getElementById("pauseMenu").style.visibility = "visible"
                }
            } else {
                gameInfo.paused = false
                document.getElementById("pauseMenu").style.visibility = "hidden"
            }
        }
        // if the player decides to reset the game the arena and scoreboard get removed and the animationframe gets cancelled, then the start function gets called again
        if(event.key.toLowerCase() === "r" && (gameInfo.paused || gameInfo.gameOver)) {
            document.getElementById("arenaDiv").remove()
            document.getElementById("informationDiv").remove()
            cancelAnimationFrame(requestID)
            start(gameInfo.map, false)
        }
        if(event.key.toLowerCase() === "m" && (gameInfo.paused || gameInfo.gameOver)) {
            location.reload()
        }
    })
    
}

// eventlistener for updating the difficulty description on the front page
document.getElementById("difficultySelect").addEventListener("change", () => {
    switch(document.getElementById("difficultySelect").value) {
        case "easy":
            document.getElementById("difficultyDesc").textContent = "Ghosts move slowest and get stunned for 3 seconds. Time limit 5 minutes, score not multiplied. Great for casually playing."
            break
        case "medium":
            document.getElementById("difficultyDesc").textContent = "Ghost are quicker and get stunned for 2 seconds. Time limit 4 minutes, score multiplied by 2. Slightly challenging."
            break
        case "hard":
            document.getElementById("difficultyDesc").textContent = "Ghosts are fast and get stunned for 1 second. Time limit 3 minutes, score multiplied by 3. Will be tough to beat."
            break
        case "impossible":
            document.getElementById("difficultyDesc").textContent = "Ghosts are rapid and get stunned for half a second, no extra lives. Time limit 2 minutes, score multiplied by 5. The name doesn't lie."
            break
    }
})

// eventlistener for the starting button, also adds the game information based on the difficulty chosen by the player
document.getElementById("startBtn").addEventListener("click", () => {
    document.getElementById("mainMenu").style.display = "none"
    var difficulty = document.getElementById("difficultySelect").value
    switch(difficulty) {
        case "easy":
            gameInfo.enemySpeed = 0.3
            gameInfo.stunTime = 432
            gameInfo.scoreMultiplier = 1
            gameInfo.minutes = 5
            gameInfo.seconds = 0
            break
        case "medium":
            gameInfo.enemySpeed = 0.5
            gameInfo.stunTime = 288
            gameInfo.scoreMultiplier = 2
            gameInfo.minutes = 4
            gameInfo.seconds = 0
            break
        case "hard":
            gameInfo.enemySpeed = 0.7
            gameInfo.stunTime = 144
            gameInfo.scoreMultiplier = 3
            gameInfo.minutes = 3
            gameInfo.seconds = 0
            break
        case "impossible":
            gameInfo.enemySpeed = 1
            gameInfo.stunTime = 77
            gameInfo.scoreMultiplier = 5
            gameInfo.minutes = 2
            gameInfo.seconds = 0
            break
    }
    gameInfo.map = maps.map1Info
    start(gameInfo.map)
})