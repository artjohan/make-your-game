import { Platform, MovingPlatform, CollisionTerrain, LinearEnemy, Point } from "./gameelements.js"
import { gameElements } from "./game.js"

// goes through a tilemap and creates elements corresponding to the locations of the tiles
export const mapTerrain = (map) => {
    var tileMap = assembleMap(map.tiles)
    for(let y = 0;y < tileMap.length;y++) {
        for(let x = 0;x < tileMap[y].length;x++) {
            if(tileMap[y][x] === 1) { // collisionterrains
                var rectCoords = getBiggestRectangle(tileMap, {x, y}, getHeightAndWidth(tileMap, {x, y}, 1), 1)
                tileMap = clearMappedTerrain(tileMap, rectCoords[0], rectCoords[1])
                gameElements.collisionTerrains.push(new CollisionTerrain(rectCoords[0].x*25, rectCoords[0].y*25, (rectCoords[1].x-rectCoords[0].x+1)*25, (rectCoords[1].y-rectCoords[0].y+1)*25))
            }
            if(tileMap[y][x] === 2) { // platforms
                tileMap = createPlatform(tileMap, {x, y}, 2, map)
            }
            if(tileMap[y][x] === 3) { // enemies
                gameElements.linearEnemies.push(new LinearEnemy(x*25, y*25, 50, 50))
            }
            if(tileMap[y][x] === 4) { // points
                gameElements.points.push(new Point(x*25, y*25, 25, 25))
            }
            if(tileMap[y][x] > 4) { // moving platforms
                tileMap = createPlatform(tileMap, {x, y}, tileMap[y][x], map)
            }
        }
    }
}

// creates a platform/moving platform by getting the size of it first, then removes the platform from the tilemap
const createPlatform = (tileMap, startCoords, num, map) => {
    var endCoords = getHeightAndWidth(tileMap, startCoords, num)
    if(num === 2) {
        gameElements.platforms.push(new Platform(startCoords.x*25, startCoords.y*25, (endCoords.x-startCoords.x+1)*25, (endCoords.y-startCoords.y+1)*25))
    } else {
        gameElements.movingPlatforms.push(new MovingPlatform(startCoords.x*25, startCoords.y*25, (endCoords.x-startCoords.x+1)*25, (endCoords.y-startCoords.y+1)*25, map[num]))
    }
    return clearMappedTerrain(tileMap, startCoords, endCoords)
}

// gets the width and height of a piece of terrain
const getHeightAndWidth = (tileMap, startCoords, num) => {
    var endY, endX
    for(let i = startCoords.y; i < tileMap.length;i++) {
        if(tileMap[i][startCoords.x] === num) {
            endY = i
        } else {
            break
        }
    }
    for(let i = startCoords.x; i < tileMap[startCoords.y].length;i++) {
        if(tileMap[startCoords.y][i] === num) {
            endX = i
        } else {
            break
        }
    }
    return {x: endX, y: endY}
}

// checks if the piece of terrain is a rectangle
const isRectangle = (tileMap, startCoords, endCoords, num) => {
    for(let y = startCoords.y;y <= endCoords.y;y++) {
        for(let x = startCoords.x;x <= endCoords.x;x++) {
            if(tileMap[y][x] != num) {
                return false
            }
        }
    }
    return true
}

// gets the biggest rectangle with the longest horizontal straight line to help enemy movement
const getBiggestRectangle = (tileMap, startCoords, endCoords, num) => {
    if(isRectangle(tileMap, startCoords, endCoords, num)) {
        return [startCoords, endCoords]
    } else {
        let x = endCoords.x
        for(let y = endCoords.y;y >= startCoords.y;y--) {
            if(isRectangle(tileMap, startCoords, {x, y}, num)) {
                return [startCoords, {x, y}]
            }
        }
    }
}

// clears the element that was extracted from the tilemap so it doesn't interfere with future elements
const clearMappedTerrain = (tileMap, startCoords, endCoords) => {
    for(let y = startCoords.y;y <= endCoords.y;y++) {
        for(let x = startCoords.x;x <= endCoords.x;x++) {
            tileMap[y][x] = 0
        }
    }
    return tileMap
}

// takes an array of 30 by 30 tiles and combines them into one big tilemap with the height of 30, each element being 25x25px
const assembleMap = (mapTiles) => {
    var finalMap = []
    for(let i = 0;i < 30;i++) {
        let row = []
        for(let j = 0;j < mapTiles.length;j++) {
            row.push(...mapTiles[j][i])
        }
        finalMap.push(row)
    }
    return finalMap
}
