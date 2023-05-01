import { gameElements } from "./mapping.js"
import { player, gameInfo, resetStage } from "./game.js"

export class Player {
    constructor(pos) {
        this.position = {
            x: pos.x,
            y: pos.y
        }
        this.basePos = {
            x: pos.x,
            y: pos.y
        }
        this.velocity = {
            x: 0,
            y: 1
        }
        this.keyPressed = {
            right: false,
            left: false
        }

        this.width = 40
        this.height = 40

        this.crouched = false
        this.crouchReleased = false
        this.stunned = false
        this.dead = false
        this.deathJump = false

        this.defaultVelocity = 1.5
        this.originalVelocity = 1.5

        this.animationArray = ["media/pacphase0.png", "media/pacphase1.png", "media/pacphase2.png", "media/pacphase1.png"]
        this.animationIndex = 0

        document.addEventListener("keydown", this.move)
        document.addEventListener("keyup", this.stop)
    }

    draw() {
        if(!this.playerDiv) {
            this.playerDiv = document.createElement("div")
            this.playerDiv.id = "playerDiv"
            this.playerDiv.style.background = `url(${this.animationArray[this.animationIndex]})`
            this.playerDiv.style.position = "absolute"
            document.getElementById("arenaDiv").appendChild(this.playerDiv)
        }
        if((this.keyPressed.right || this.keyPressed.left) && !this.dead) {
            this.animationIndex++
            if(this.animationIndex === 60) {
                this.animationIndex = 0
            }
            this.playerDiv.style.background = `url(${this.animationArray[Math.floor(this.animationIndex/15)]})`
        }
        this.playerDiv.style.width = `${this.width}px`
        this.playerDiv.style.height = `${this.height}px`
        this.playerDiv.style.left = `${this.position.x}px`
        this.playerDiv.style.top = `${this.position.y}px`
    }

    update() {
        this.draw()
        if(this.crouched) {
            this.defaultVelocity = this.originalVelocity/2
        } else {
            this.defaultVelocity = this.originalVelocity
        }
        if(this.dead) {
            setTimeout(() => {
                deathAnimation(this)
            }, 1000);
        } else {
            this.position.y += this.velocity.y
            this.position.x += this.velocity.x
            
            if(this.crouched && this.crouchReleased && !player.blockedAbove()) {
                this.height += 20
                this.position.y -= 20
                this.crouched = false
                this.crouchReleased = false
            }
            if(this.velocity.y < 9.8) {
                this.velocity.y += 0.2
            }
        }
    }

    move(event) {
        switch(event.key) {
            case "ArrowRight":
                player.keyPressed.right = true
            break
            case "ArrowLeft":
                player.keyPressed.left = true
            break
            case "ArrowUp":
                if(player.velocity.y == 0 && player.height == 40) {
                    player.velocity.y -= 10
                }
            break
            case "ArrowDown":
                if(!player.crouched) {
                    player.height -= 20
                    player.position.y += 20
                    player.crouched = true
                }
            break
        }
    }

    stop(event) {
        switch(event.key) {
            case "ArrowRight":
                player.keyPressed.right = false
            break
            case "ArrowLeft":
                player.keyPressed.left = false
            break
            case "ArrowUp":
                if(player.velocity.y == 0 && player.height == 40) {
                    player.velocity.y -= 10
                }
            break
            case "ArrowDown":
                if(player.crouched && !player.blockedAbove()) {
                    player.height += 20
                    player.position.y -= 20
                    player.crouched = false
                } else {
                    player.crouchReleased = true
                }
            break
        }
    }

    blockedAbove() {
        var result = false
        gameElements.collisionTerrains.forEach(terrain => {
            if(this.position.x + this.width >= terrain.position.x && this.position.x <= terrain.position.x + terrain.width &&
                this.position.y - 20 < terrain.position.y + terrain.height && this.position.y > terrain.position.y + terrain.height) {
                result = true
            }
        })
        return result
    }    
}

export class Platform {
    constructor(x, y, width, height) {
        this.position = {
            x,
            y
        }
        this.basePos = {
            x,
            y
        }
        this.width = width
        this.height = height
    }
    draw() {
        if(!this.platformDiv) {
            this.platformDiv = document.createElement("div")
            this.platformDiv.id = "platformDiv"
            this.platformDiv.className = "platformDiv"
            document.getElementById("arenaDiv").appendChild(this.platformDiv)
        }
        toggleVisibility(this, "platformDiv")
        this.platformDiv.style.width = `${this.width}px`
        this.platformDiv.style.left = `${this.position.x}px`
        this.platformDiv.style.height = `${this.height}px`
        this.platformDiv.style.top = `${this.position.y}px`
    }

    moveEnvironment(amount) {
        this.draw()
        this.position.x += amount
    }

    carriesObject(object) {
        if(object.position.y + object.height <= this.position.y && object.position.y + object.height + object.velocity.y >= this.position.y-4 &&
            object.position.x + object.width >= this.position.x && object.position.x - this.width <= this.position.x) {
            return true
        } else {
            return false
        }
    }
}

export class MovingPlatform {
    constructor(x, y, width, height, movementInfo) {
        this.position = {
            x,
            y
        }
        this.startPos = {
            x,
            y
        }
        this.basePos = {
            x,
            y
        }
        this.back = {
            x: false,
            y: false
        }
        this.velocity = movementInfo.velocity
        this.distance = movementInfo.distance
        this.width = width
        this.height = height
        this.carrying = false
    }

    draw() {
        if(!this.movingPlatformDiv) {
            this.movingPlatformDiv = document.createElement("div")
            this.movingPlatformDiv.id = "movingPlatformDiv"
            this.movingPlatformDiv.className = "platformDiv"
            document.getElementById("arenaDiv").appendChild(this.movingPlatformDiv)
        }
        toggleVisibility(this, "movingPlatformDiv")
        this.movingPlatformDiv.style.width = `${this.width}px`
        this.movingPlatformDiv.style.left = `${this.position.x}px`
        this.movingPlatformDiv.style.height = `${this.height}px`
        this.movingPlatformDiv.style.top = `${this.position.y}px`
    }

    update() {
        this.draw()
        if(this.carriesPlayer()) {
            player.velocity.y = 0
            if(!this.carrying) {
                player.position.y = this.position.y - player.height - player.velocity.y-4
            }
            this.carrying = true
        } else {
            this.carrying = false
        }
        if(this.back.x) {
            this.position.x -= this.velocity.x
            this.movePlayer("x", -1)
        }
        if(this.back.y) {
            this.position.y -= this.velocity.y
            this.movePlayer("y", -1)
        }
        if(!this.back.x) {
            this.position.x += this.velocity.x
            this.movePlayer("x", 1)
        }
        if(!this.back.y) {
            this.position.y += this.velocity.y
            this.movePlayer("y", 1)
        }
        if(this.position.x >= this.startPos.x + this.distance.x) {
            this.back.x = true
            this.position.x = this.startPos.x + this.distance.x
        }
        if(this.position.y >= this.startPos.y + this.distance.y) {
            this.back.y = true
            this.position.y = this.startPos.y + this.distance.y
        }
        if(this.position.x <= this.startPos.x) {
            this.back.x = false
            this.position.x = this.startPos.x
        }
        if(this.position.y <= this.startPos.y) {
            this.back.y = false
            this.position.y = this.startPos.y
        }
    }

    movePlayer(axis, direction) {
        if(this.carrying) {
            player.position[axis] += direction*this.velocity[axis]
        }
    }
    
    moveEnvironment(amount) {
        this.draw()
        this.position.x += amount
        this.startPos.x += amount
    }

    carriesPlayer() {
        if(player.position.y + player.height <= this.position.y-4 && player.position.y + player.height + player.velocity.y >= this.position.y-8 &&
            player.position.x + player.width >= this.position.x && player.position.x - this.width <= this.position.x) {
            return true
        } else {
            return false
        }
    }
}

export class CollisionTerrain {
    constructor(x, y, width, height) {
        this.position = {
            x,
            y
        }
        this.basePos = {
            x,
            y
        }
        this.width = width
        this.height = height
    }
    draw() {
        if(!this.terrainDiv) {
            this.terrainDiv = document.createElement("div")
            this.terrainDiv.id = "terrainDiv"
            this.terrainDiv.style.background = "url('media/bluebrick.png')"
            this.terrainDiv.style.position = "absolute"
            document.getElementById("arenaDiv").appendChild(this.terrainDiv)
        }
        toggleVisibility(this, "terrainDiv")
        this.terrainDiv.style.width = `${this.width}px`
        this.terrainDiv.style.left = `${this.position.x}px`
        this.terrainDiv.style.height = `${this.height}px`
        this.terrainDiv.style.top = `${this.position.y}px`
    }

    moveEnvironment(amount) {
        this.draw()
        this.position.x += amount
    }

    carriesObject(object) {
        if(!object.dead && object.position.y + object.height <= this.position.y && object.position.y + object.height + object.velocity.y >= this.position.y-0.2 &&
            object.position.x + object.width >= this.position.x && object.position.x - this.width <= this.position.x) {
            return true
        } else {
            return false
        }
    }

    collidesWithBase(object) {
        if(!object.dead && object.position.y <= this.position.y + this.height - 1 && object.position.y + object.height + object.velocity.y >= this.position.y + this.height &&
            object.position.x + object.width >= this.position.x && object.position.x - this.width <= this.position.x) {
            return true
        } else {
            return false
        }
    }

    collidesWithRightSide(object) {
        if(!object.dead && object.position.x <= this.position.x+this.width + 3 && object.position.x >= this.position.x+this.width && 
            object.position.y <= this.position.y + this.height && object.position.y + object.height + object.velocity.y >= this.position.y) {
            return true
        } else {
            return false
        }
    }

    collidesWithLeftSide(object) {
        if(!object.dead && object.position.x + object.width >= this.position.x - 3 && object.position.x + object.width <= this.position.x && 
            object.position.y <= this.position.y + this.height && object.position.y + object.height + object.velocity.y >= this.position.y) {
            return true
        } else {
            return false
        }
    }
}

export class LinearEnemy {
    constructor(x, y, width, height) {
        this.position = {
            x,
            y
        }
        this.basePos = {
            x,
            y
        }
        this.velocity = {
            x: gameInfo.enemySpeed,
            y: 1
        }
        this.width = width
        this.height = height
        this.stunned = false
        this.prevSpeed = gameInfo.enemySpeed
        this.stunIndex = 0
        this.ghostNr = Math.floor(Math.random()*4)
    }

    draw() {
        if(!this.linearEnemy) {
            this.linearEnemy = document.createElement("div")
            this.linearEnemy.id = "linearEnemy"
            this.linearEnemy.style.backgroundImage = "url('media/ghost" + this.ghostNr + ".png')"
            this.linearEnemy.style.position = "absolute"
            document.getElementById("arenaDiv").appendChild(this.linearEnemy)
        }
        toggleVisibility(this, "linearEnemy")
        if(this.stunned) {
            this.linearEnemy.style.backgroundImage = "url('media/vulnerableghost.png')"
        }
        this.linearEnemy.style.width = `${this.width}px`
        this.linearEnemy.style.left = `${this.position.x}px`
        this.linearEnemy.style.height = `${this.height}px`
        this.linearEnemy.style.top = `${this.position.y}px`
    }

    update() {
        this.draw()
        if(this.stunned) {
            this.stunIndex++
            if(this.velocity.x != 0) {
                this.prevSpeed = this.velocity.x
            }
            this.velocity.x = 0
            if(this.stunIndex > gameInfo.stunTime) {
                this.stunned = false
                this.velocity.x = this.prevSpeed
                this.stunIndex = 0
                this.linearEnemy.style.backgroundImage = "url('media/ghost" + this.ghostNr + ".png')"
            }
        } else {
            if(this.hasBeenStunned()) {
                this.stunned = true
                player.velocity.y = 0
                player.velocity.y -= 7
            }
            if(this.hasKilledPlayer()) {
                if(gameInfo.lives > 1) {
                    player.stunned = true
                } else {
                    player.dead = true
                }
            }
            if(!this.hasWalkableGround()) {
                this.velocity.x = -this.velocity.x
            }
            this.position.x += this.velocity.x
        }
    }

    moveEnvironment(amount) {
        this.draw()
        this.position.x += amount
    }

    isOnSolidGround() {
        var result = false
        gameElements.collisionTerrains.forEach(terrain => {
            if(terrain.carriesObject(this)) {
                result = true
            }
        })
        return result
    }

    hasWalkableGround() {
        var result = false
        gameElements.platforms.forEach(platform => {
            if(this.position.x >= platform.position.x && this.position.x + this.width <= platform.position.x + platform.width && 
                platform.carriesObject(this)) {
                result = true
            }
        })
        gameElements.collisionTerrains.forEach(terrain => {
            if(this.position.x >= terrain.position.x && this.position.x + this.width <= terrain.position.x + terrain.width && 
                terrain.carriesObject(this)) {
                result = true
            }
            if(terrain.collidesWithRightSide(this) || terrain.collidesWithLeftSide(this)) {
                result = false
            }
        })
        return result
    }

    hasBeenStunned() {
        if(!player.dead && player.position.x + player.width >= this.position.x && player.position.x <= this.position.x + this.width &&
           player.position.y + player.height <= this.position.y && player.position.y + player.height >= this.position.y-10 &&
           player.velocity.y >= 0) {
            return true
        }
        return false
    }

    hasKilledPlayer() {
        if(!this.dead && player.position.x + player.width >= this.position.x && player.position.x <= this.position.x + this.width &&
            player.position.y + player.height >= this.position.y && player.position.y <= this.position.y + this.height) {
                return true
        }
        return false
    }
}

export class Point {
    constructor(x, y) {
        this.position = {
            x,
            y
        }
        this.basePos = {
            x,
            y
        }
        this.width = 25
        this.height = 25
        this.collected = false
    }
    draw() {
        if(!this.pointDiv) {
            this.pointDiv = document.createElement("div")
            this.pointDiv.id = "pointDiv"
            this.pointDiv.style.background = "url('media/coin.png')"
            this.pointDiv.style.position = "absolute"
            document.getElementById("arenaDiv").appendChild(this.pointDiv)
        }
        toggleVisibility(this, "pointDiv")
        this.pointDiv.style.width = `${this.width}px`
        this.pointDiv.style.left = `${this.position.x}px`
        this.pointDiv.style.height = `${this.height}px`
        this.pointDiv.style.top = `${this.position.y}px`
    }

    moveEnvironment(amount) {
        this.draw()
        this.position.x += amount
    }

    touchesPlayer() {
        if(!this.collected && player.position.x + player.width >= this.position.x && player.position.x <= this.position.x + this.width &&
            player.position.y + player.height >= this.position.y && player.position.y <= this.position.y + this.height) {
                return true
        }
        return false
    }
}

const toggleVisibility = (element, divName) => {
    if(element.position.x + element.width >= 0 && element.position.x <= 750) {
        element[divName].style.visibility = "visible"
    } else {
        element[divName].style.visibility = "hidden"
    }
}

const deathAnimation = (object) => {
    if(!object.deathJump) {
        object.velocity.y = 0
        object.velocity.y -= 5
        object.deathJump = true
    }
    object.velocity.y += 0.2
    object.position.y += object.velocity.y
}