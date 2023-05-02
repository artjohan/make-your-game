import { mapTerrain } from "./mapping.js"
import { maps } from "./maps.js"
import { Player } from "./gameelements.js"

export var gameInfo = {}
export var gameElements = {}
export var player

var scrollDistance, leftBoundary, rightBoundary, times, requestID, timerStart, now, minutes, seconds

function start(map, first = true) {
    init()

    createArenaElements()
    mapTerrain(map)
    if(first) {
        addPauseListener()
    }
    
    Object.values(gameElements).forEach((element) => {
        element.forEach(entity => {
            entity.draw()
        })
    })

    player = new Player(map.startPos)
    player.draw()

    timerStart = Date.now()
    gameloop()
}

function gameloop() {
    scoreboard.textContent = "Score: " + gameInfo.score
    fpsCounter.textContent = "FPS: " + calculateFPS()
    if(player.position.y < 850 && !gameInfo.hasWon) {
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
    if(player.position.y > 725) {
        if(gameInfo.lives > 1) {
            player.stunned = true
        } else {
            player.dead = true
        }
    }
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
    if(!gameInfo.paused) {
        player.update()
        if(!player.dead && !player.stunned) {
            updateTimer()
            updateTerrain()
            movePlayer()
            terrainCollision()
            checkWin()
        }
    }
}

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

const calculateFPS = () => {
    const now = performance.now()
    while (times.length > 0 && times[0] <= now - 1000) {
      times.shift()
    }
    times.push(now)
    return times.length
}

const updateTimer = () => {
    now = Date.now()
    if(now-timerStart >= 1000) {
        seconds--
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

    if(player.dead) {
        if(minutes <= 0 && seconds <= 0) {
            endMsg.textContent = "Out of time!"
        } else {
            endMsg.textContent = "You died!"
        }
        endMsg.style.color = "red"
        toMainMenu.textContent = "Press \"M\" to go back to the main menu"
        restart.textContent = "Press \"R\" to try again"
    } else {
        endMsg.style.color = "green"
        if(gameInfo.enemySpeed === 1) {
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
    if(gameInfo.hasWon) {
        endScreen.appendChild(timeBonus)
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

const resetStage = () => {
    player.playerDiv.remove()
    player = new Player(gameInfo.map.startPos)
    scrollDistance = 1
    leftBoundary = 150
    rightBoundary = 350
    Object.values(gameElements).forEach((element) => {
        element.forEach(entity => {
            entity.position.x = entity.basePos.x
            entity.position.y = entity.basePos.y
            if(entity.startPos) {
                entity.startPos.x = entity.basePos.x
                entity.startPos.y = entity.basePos.y
            }
            if(entity.stunned) {
                entity.stunIndex = 1000
            }
            entity.draw()
        })
    })
    gameInfo.lives--
    lifeCounter.textContent = "Lives: " + gameInfo.lives
}

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
        if(point.touchesPlayer()) {
            point.pointDiv.remove()
            point.collected = true
            gameInfo.score += (100*gameInfo.scoreMultiplier)
        }
    })
}

const movePlayer = () => {
    if(player.keyPressed.right && player.position.x < rightBoundary) {
        player.playerDiv.style.transform = "scaleX(1)"
        player.velocity.x = player.defaultVelocity
    } else if(player.keyPressed.left && player.position.x > leftBoundary){
        player.playerDiv.style.transform = "scaleX(-1)"
        player.velocity.x = -player.defaultVelocity
    } else {
        player.velocity.x = 0
        if(player.keyPressed.right && scrollDistance < gameInfo.map.endPoint) {
            scrollDistance++
            if(scrollDistance > 0) {
                leftBoundary = 350
            }
            if(scrollDistance >= gameInfo.map.endPoint) {
                rightBoundary = 750-player.width
            }
            moveElements(-player.defaultVelocity)
        } else if(player.keyPressed.left && scrollDistance > 0) {
            scrollDistance--
            if(scrollDistance <= 0) {
                leftBoundary = 0
            }
            if(scrollDistance < gameInfo.map.endPoint) {
                rightBoundary = 350
            }
            moveElements(player.defaultVelocity)
        }
    }
}

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

const moveElements = (amount) => {
    player.playerDiv.style.transform = `scaleX(${-amount/player.defaultVelocity})`
    Object.values(gameElements).forEach((element) => {
        element.forEach(entity => {
            entity.moveEnvironment(amount)
        })
    })
}

const checkWin = () => {
    var points = document.querySelectorAll("#pointDiv")
    if(points.length === 0) {
        gameInfo.hasWon = true
    }
}

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
    if(gameInfo.enemySpeed === 1) {
        gameInfo.lives = 1
    } else {
        gameInfo.lives = 3
    }

    scrollDistance = 1
    leftBoundary = 150
    rightBoundary = 350
    seconds = gameInfo.seconds
    minutes = gameInfo.minutes
    times = []
}

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