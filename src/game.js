import { gameElements, mapTerrain } from "./mapping.js"
import { maps } from "./maps.js"
import { Player } from "./gameelements.js"

export const gameInfo = {
    hasWon: false,
    lives: 3,
    paused: false,
    score: 0
}

export var player

document.getElementById("startBtn").addEventListener("click", () => {
    document.getElementById("mainMenu").style.display = "none"
    var difficulty = document.getElementById("difficultySelect").value
    var map = document.getElementById("mapSelect").value
    switch(difficulty) {
        case "easy":
            gameInfo.enemySpeed = 0.3
            gameInfo.stunTime = 432
            gameInfo.scoreMultiplier = 1
            break
        case "medium":
            gameInfo.enemySpeed = 0.5
            gameInfo.stunTime = 288
            gameInfo.scoreMultiplier = 2
            break
        case "hard":
            gameInfo.enemySpeed = 0.7
            gameInfo.stunTime = 144
            gameInfo.scoreMultiplier = 3
            break
    }
    gameInfo.map = maps[map]
    start(gameInfo.map)
})

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
    timer.textContent = "00:00"

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
    pauseMenu.style.position = "absolute"
    pauseMenu.id = "pauseMenu"
    pauseMenu.className = "pauseMenu"
    document.getElementById("arenaDiv").appendChild(pauseMenu)

    var unpause = document.createElement("header")
    unpause.textContent = "Press \"P\" or \"ESC\" to unpause"
    unpause.style.color = "white"
    unpause.style.left = "100px"
    pauseMenu.appendChild(unpause)

    var restart = document.createElement("header")
    restart.textContent = "Press \"R\" to restart"
    restart.style.color = "white"
    restart.style.left = "100px"
    restart.style.marginTop = "200px"
    pauseMenu.appendChild(restart)
}

var scrollDistance = 1
var leftBoundary = 150
var rightBoundary = 350
const times = []

const calculateFPS = () => {
    const now = performance.now()
    while (times.length > 0 && times[0] <= now - 1000) {
      times.shift()
    }
    times.push(now)
    return times.length
}

function gameloop() {
    scoreboard.textContent = "Score: " + gameInfo.score*gameInfo.scoreMultiplier
    fpsCounter.textContent = "FPS: " + calculateFPS()
    if(player.position.y < 850 && !gameInfo.hasWon) {
        if(player.stunned) {
            setTimeout(() => {
                requestAnimationFrame(gameloop)
                resetStage()
            }, 1000)
            player.stunned = false
        } else {
            requestAnimationFrame(gameloop)
        }
    }
    if(player.position.y > 725) {
        if(gameInfo.lives > 1) {
            player.stunned = true
        } else {
            player.dead = true
        }
    }
    if(player.position.y > 850) {
        lifeCounter.textContent = "Lives: 0"
        setTimeout(() => {
            alert("you died")
        }, 1000);
    }
    if(gameInfo.hasWon) {
        alert('you win!!!')
    }  
    if(!gameInfo.paused) {
        player.update()
        if(!player.dead && !player.stunned) {
            updateTerrain()
            movePlayer()
            terrainCollision()
            checkWin()
        }
    }
}

export const resetStage = () => {
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
            gameInfo.score += 100
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
    document.addEventListener("keyup", (event) => {
        if(!player.dead && (event.key === "Escape" || event.key.toLowerCase() === "p")) {
            if(!gameInfo.paused) {
                gameInfo.paused = true
                if(!document.getElementById("pauseMenu")) {
                    createPauseMenu()
                } else {
                    document.getElementById("pauseMenu").style.opacity = 0.8
                }
            } else {
                gameInfo.paused = false
                document.getElementById("pauseMenu").style.opacity = 0
            }
        }
        if(event.key.toLowerCase() === "r" && gameInfo.paused) {
            location.reload()
        }
    })
    
}

function start(map) {
    createArenaElements()
    mapTerrain(map)
    addPauseListener()
    
    Object.values(gameElements).forEach((element) => {
        element.forEach(entity => {
            entity.draw()
        })
    })

    player = new Player(map.startPos)
    player.draw()

    gameloop()
}