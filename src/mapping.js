import { Platform, MovingPlatform, CollisionTerrain, LinearEnemy, Point } from "./gameelements.js"

export const gameElements = {
    platforms: [],
    movingPlatforms: [],
    collisionTerrains: [],
    linearEnemies: [],
    points: []
}

export const mapTerrain = (map) => {
    var tileMap = assembleMap(map.tiles)
    for(let y = 0;y < tileMap.length;y++) {
        for(let x = 0;x < tileMap[y].length;x++) {
            if(tileMap[y][x] === 1) {
                var rectCoords = getBiggestRectangle(tileMap, {x, y}, getHeightAndWidth(tileMap, {x, y}, 1), 1)
                tileMap = clearMappedTerrain(tileMap, rectCoords[0], rectCoords[1])
                gameElements.collisionTerrains.push(new CollisionTerrain(rectCoords[0].x*25, rectCoords[0].y*25, (rectCoords[1].x-rectCoords[0].x+1)*25, (rectCoords[1].y-rectCoords[0].y+1)*25))
            }
            if(tileMap[y][x] === 2) {
                tileMap = createPlatform(tileMap, {x, y}, 2, map)
            }
            if(tileMap[y][x] === 3) {
                gameElements.linearEnemies.push(new LinearEnemy(x*25, y*25, 50, 50))
            }
            if(tileMap[y][x] === 4) {
                gameElements.points.push(new Point(x*25, y*25, 25, 25))
            }
            if(tileMap[y][x] > 4) {
                tileMap = createPlatform(tileMap, {x, y}, tileMap[y][x], map)
            }
        }
    }
}

const createPlatform = (tileMap, startCoords, num, map) => {
    var endCoords = getHeightAndWidth(tileMap, startCoords, num)
    if(num === 2) {
        gameElements.platforms.push(new Platform(startCoords.x*25, startCoords.y*25, (endCoords.x-startCoords.x+1)*25, (endCoords.y-startCoords.y+1)*25))
    } else {
        gameElements.movingPlatforms.push(new MovingPlatform(startCoords.x*25, startCoords.y*25, (endCoords.x-startCoords.x+1)*25, (endCoords.y-startCoords.y+1)*25, map[num]))
    }
    return clearMappedTerrain(tileMap, startCoords, endCoords)
}

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

const clearMappedTerrain = (tileMap, startCoords, endCoords) => {
    for(let y = startCoords.y;y <= endCoords.y;y++) {
        for(let x = startCoords.x;x <= endCoords.x;x++) {
            tileMap[y][x] = 0
        }
    }
    return tileMap
}

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
