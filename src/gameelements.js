import { gameElements, player, gameInfo, scrollWhenStationary } from "./game.js"

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

        this.defaultVelocity = 3.6
        this.originalVelocity = 3.6

        // array of images for animating the player
        this.animationArray = ["../media/pacphase0.png", "../media/pacphase1.png", "../media/pacphase2.png", "../media/pacphase1.png"]
        this.animationIndex = 0

        // creates event listeners for moving and stopping
        document.addEventListener("keydown", this.move)
        document.addEventListener("keyup", this.stop)
    }

    // responsible for drawing the element based on its attirbutes
    draw() {
        if(!this.playerDiv) { // creates the element if it doesn't exist
            this.playerDiv = document.createElement("div")
            this.playerDiv.id = "playerDiv"
            this.playerDiv.style.background = `url(${this.animationArray[this.animationIndex]})`
            this.playerDiv.style.position = "absolute"
            document.getElementById("arenaDiv").appendChild(this.playerDiv)
        }
        if((this.keyPressed.right || this.keyPressed.left) && !this.dead) {
            this.animationIndex++
            if(this.animationIndex === 24) { // changes animation frame every 6 ticks
                this.animationIndex = 0
            }
            this.playerDiv.style.background = `url(${this.animationArray[Math.floor(this.animationIndex/6)]})`
        }
        this.playerDiv.style.width = `${this.width}px`
        this.playerDiv.style.height = `${this.height}px`
        this.playerDiv.style.left = `${this.position.x}px`
        this.playerDiv.style.top = `${this.position.y}px`
    }

    // updates the player by constantly redrawing it with changed position
    update() {
        this.draw()
        // half the speed when crouching
        if(this.crouched) {
            this.defaultVelocity = this.originalVelocity/2
        } else {
            this.defaultVelocity = this.originalVelocity
        }
        if(this.dead) { // deathanimation for when the player dies
            setTimeout(() => {
                deathAnimation(this)
            }, 1000);
        } else { // move the player if they are not dead
            this.position.y += this.velocity.y
            this.position.x += this.velocity.x
            
            // checks if the player was crouching while being blocked from above but now has space to stand up and the crouch button has been released
            if(this.crouched && this.crouchReleased && !player.blockedAbove()) {
                this.height += 20
                this.position.y -= 20
                this.crouched = false
                this.crouchReleased = false
            }
            // gravity
            if(this.velocity.y < 24) {
                this.velocity.y += 1.2
            }
        }
    }

    // controls movement of the player
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
                    player.velocity.y -= 24
                }
            break
            case "ArrowDown":
                if(!player.crouched) {
                    player.height -= 20
                    player.position.y += 20
                    player.crouched = true
                    player.crouchReleased = false
                }
            break
        }
    }

    // controls the release of the movement keys
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
                    player.velocity.y -= 24
                }
            break
            case "ArrowDown":
                if(player.crouched && !player.blockedAbove()) { // checks if player can uncrouch, if not then crouchreleased gets changed to true to later check if the player can stand
                    player.height += 20
                    player.position.y -= 20
                    player.crouched = false
                } else {
                    player.crouchReleased = true
                }
            break
        }
    }

    // checks if the player is blocked from above, if they are it returns true so the player can't uncrouch
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

    // responsible for drawing the element based on its attributes
    draw() {
        if(!this.platformDiv) { // creates the element if it doesn't exist
            this.platformDiv = document.createElement("div")
            this.platformDiv.id = "platformDiv"
            this.platformDiv.className = "platformDiv"
            document.getElementById("arenaDiv").appendChild(this.platformDiv)
        }
        // element is invisible when not in the viewport
        toggleVisibility(this, "platformDiv")
        this.platformDiv.style.width = `${this.width}px`
        this.platformDiv.style.left = `${this.position.x}px`
        this.platformDiv.style.height = `${this.height}px`
        this.platformDiv.style.top = `${this.position.y}px`
    }

    // moves the platform when the player can not be moved anymore to create the illusion of scrolling
    moveEnvironment(amount) {
        this.draw()
        this.position.x += amount
    }

    // checks if the platform is carrying an object like the player or an enemy
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

    // responsible for drawing the element based on its attributes
    draw() {
        if(!this.movingPlatformDiv) { // creates the element if it doesn't exist
            this.movingPlatformDiv = document.createElement("div")
            this.movingPlatformDiv.id = "movingPlatformDiv"
            this.movingPlatformDiv.className = "platformDiv"
            document.getElementById("arenaDiv").appendChild(this.movingPlatformDiv)
        }
        // element is invisible when not in the viewport
        toggleVisibility(this, "movingPlatformDiv")
        this.movingPlatformDiv.style.width = `${this.width}px`
        this.movingPlatformDiv.style.left = `${this.position.x}px`
        this.movingPlatformDiv.style.height = `${this.height}px`
        this.movingPlatformDiv.style.top = `${this.position.y}px`
    }

    // constantly moves the platform and draw it to move back and forth
    update() {
        this.draw()
        if(this.carriesPlayer()) { // if the player is being carried by the platform then the player must move along with the platform
            player.velocity.y = 0
            if(!this.carrying) {
                player.position.y = this.position.y - player.height - player.velocity.y-4
            }
            this.carrying = true
        } else {
            this.carrying = false
        }
        if(this.carrying && !player.keyPressed.left && !player.keyPressed.right) {
            scrollWhenStationary()
        }
        // following if statements move the platform vertically/horizontally forwards/backwards alongside with the player if the player is on it
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
        // following if statements check if the distance allocated to the platform has been traversed, if that is the case, the platforms direction reverses
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

    // moves the player along with the platform if the platform is carrying a player
    movePlayer(axis, direction) {
        if(this.carrying) {
            player.position[axis] += direction*this.velocity[axis]
        }
    }
    
    // moves the platform when the player can not be moved anymore to create the illusion of scrolling
    moveEnvironment(amount) {
        this.draw()
        this.position.x += amount
        this.startPos.x += amount
    }

    // checks if the platform is carrying the player
    carriesPlayer() {
        if(player.position.y + player.height <= this.position.y && player.position.y + player.height + player.velocity.y >= this.position.y-8 &&
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

    // responsible for drawing the element based on its attributes
    draw() {
        if(!this.terrainDiv) { // creates the element if it doesn't exist
            this.terrainDiv = document.createElement("div")
            this.terrainDiv.id = "terrainDiv"
            this.terrainDiv.style.background = "url('../media/bluebrick.png')"
            this.terrainDiv.style.position = "absolute"
            document.getElementById("arenaDiv").appendChild(this.terrainDiv)
        }
        // element is invisible when not in the viewport
        toggleVisibility(this, "terrainDiv")
        this.terrainDiv.style.width = `${this.width}px`
        this.terrainDiv.style.left = `${this.position.x}px`
        this.terrainDiv.style.height = `${this.height}px`
        this.terrainDiv.style.top = `${this.position.y}px`
    }

    // moves the platform when the player can not be moved anymore to create the illusion of scrolling
    moveEnvironment(amount) {
        this.draw()
        this.position.x += amount
    }

    // checks if the terrain is carrying an object like the player or an enemy
    carriesObject(object) {
        if(!object.dead && object.position.y + object.height <= this.position.y && object.position.y + object.height + object.velocity.y >= this.position.y-0.2 &&
            object.position.x + object.width >= this.position.x && object.position.x - this.width <= this.position.x) {
            return true
        } else {
            return false
        }
    }

    // checks if the top of an object like the player or an enemy is colliding with the base of the terrain
    collidesWithBase(object) {
        if(!object.dead && object.position.y <= this.position.y + this.height - object.velocity.y && object.position.y + object.height >= this.position.y + this.height &&
            object.position.x + object.width >= this.position.x && object.position.x - this.width <= this.position.x) {
            return true
        } else {
            return false
        }
    }

    // checks if the left side of an object like the player or an enemy is colliding with the right side of the terrain
    collidesWithRightSide(object) {
        if(!object.dead && object.position.x <= this.position.x+this.width + player.defaultVelocity && object.position.x >= this.position.x+this.width && 
            object.position.y <= this.position.y + this.height && object.position.y + object.height + object.velocity.y >= this.position.y) {
            return true
        } else {
            return false
        }
    }

    // checks if the right side of an object like the player or an enemy is colliding with the left side of the terrain
    collidesWithLeftSide(object) {
        if(!object.dead && object.position.x + object.width >= this.position.x - player.defaultVelocity && object.position.x + object.width <= this.position.x && 
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

    // responsible for drawing the element based on its attributes
    draw() {
        if(!this.linearEnemy) { // creates the element if it doesn't exist
            this.linearEnemy = document.createElement("div")
            this.linearEnemy.id = "linearEnemy"
            this.linearEnemy.style.backgroundImage = "url('../media/ghost" + this.ghostNr + ".png')"
            this.linearEnemy.style.position = "absolute"
            document.getElementById("arenaDiv").appendChild(this.linearEnemy)
        }
        // element is invisible when not in the viewport
        toggleVisibility(this, "linearEnemy")
        if(this.stunned) {
            this.linearEnemy.style.backgroundImage = "url('../media/vulnerableghost.png')"
        }
        this.linearEnemy.style.width = `${this.width}px`
        this.linearEnemy.style.left = `${this.position.x}px`
        this.linearEnemy.style.height = `${this.height}px`
        this.linearEnemy.style.top = `${this.position.y}px`
    }

    // constantly moves the enemy and draws it
    update() {
        this.draw()
        if(this.stunned) {
            this.stunIndex++
            if(this.velocity.x != 0) { // makes sure the previous speed is retained so when the enemy gets unstunned it can continue going in the same direction
                this.prevSpeed = this.velocity.x
            }
            this.velocity.x = 0
            if(this.stunIndex > gameInfo.stunTime) { // stunned for a specific amount of time depending on the difficulty level
                this.stunned = false
                this.velocity.x = this.prevSpeed
                this.stunIndex = 0
                this.linearEnemy.style.backgroundImage = "url('../media/ghost" + this.ghostNr + ".png')" // changes the image of the enemy when stunned
            }
        } else { // only move it and check for collisions if the enemy isn't stunned
            if(this.hasBeenStunned()) { // stuns enemy if it has been jumped on
                this.stunned = true
                player.velocity.y = 0
                player.velocity.y -= 16.8
            }
            if(this.hasKilledPlayer()) { // removed life from player if the player is touched by the enemy
                if(gameInfo.lives > 1) {
                    player.stunned = true
                } else {
                    player.dead = true
                }
            }
            if(!this.hasWalkableGround()) { // if there is no more available ground to walk on in front of the enemy, they're made to turn around
                this.velocity.x = -this.velocity.x
            }
            this.position.x += this.velocity.x
        }
    }

    // moves the platform when the player can not be moved anymore to create the illusion of scrolling
    moveEnvironment(amount) {
        this.draw()
        this.position.x += amount
    }

    // checks if the enemy is currently on solid ground
    isOnSolidGround() {
        var result = false
        gameElements.collisionTerrains.forEach(terrain => {
            if(terrain.carriesObject(this)) {
                result = true
            }
        })
        return result
    }

    // checks if the enemy has ground/space in front of it to walk on
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

    // checks if the enemy has been jumped on, if that is the case, the enemy gets stunned
    hasBeenStunned() {
        if(!player.dead && player.position.x + player.width >= this.position.x && player.position.x <= this.position.x + this.width &&
           player.position.y + player.height <= this.position.y && player.position.y + player.height >= this.position.y-player.velocity.y &&
           player.velocity.y >= 0) {
            return true
        }
        return false
    }
    
    // checks if the element has collided with the player while being active, if that is the case, the player dies
    hasKilledPlayer() {
        if(player.position.x + player.width >= this.position.x && player.position.x <= this.position.x + this.width &&
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

    // responsible for drawing the element based on its attributes
    draw() {
        if(!this.pointDiv) { // creates the element if it doesn't exist
            this.pointDiv = document.createElement("div")
            this.pointDiv.id = "pointDiv"
            this.pointDiv.style.background = "url('../media/coin.png')"
            this.pointDiv.style.position = "absolute"
            document.getElementById("arenaDiv").appendChild(this.pointDiv)
        }
        // element is invisible when not in the viewport
        toggleVisibility(this, "pointDiv")
        this.pointDiv.style.width = `${this.width}px`
        this.pointDiv.style.left = `${this.position.x}px`
        this.pointDiv.style.height = `${this.height}px`
        this.pointDiv.style.top = `${this.position.y}px`
    }

    // moves the platform when the player can not be moved anymore to create the illusion of scrolling
    moveEnvironment(amount) {
        this.draw()
        this.position.x += amount
    }

    // checks if the player is touching the point
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
        object.velocity.y -= 12
        object.deathJump = true
    }
    object.velocity.y += 1.2
    object.position.y += object.velocity.y
}