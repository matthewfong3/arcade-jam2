const sockets = require('./sockets.js');

const charList = {};

const bullets = {};

// function that checks for sphere-to-sphere collision
const checkCollisions = (circle1, circle2) => {
  const dx = (circle1.x - circle2.x) * (circle1.x - circle2.x);
  const dy = (circle1.y - circle2.y) * (circle1.y - circle2.y);

  const distance = Math.sqrt(dx + dy);

  const sumRad = circle1.radius + circle2.radius;

  if (distance > sumRad) {
    return false; // false = no collision
  }
  return true; // true = collision
};

// function that checks collisions between bullets and opposing team players' shields
const checkBulletsCollision = () => {
  const charKeys = Object.keys(charList);

  const bulletsKeys = Object.keys(bullets);

  // loop through active bullets (bullets that were fired) and characters and check for collision
  for (let i = 0; i < bulletsKeys.length; i++) {
    for (let j = 0; j < charKeys.length; j++) {
      if (bullets[bulletsKeys[i]]) {
        // check collision between red team's bullets and blue team's shield
        if (bullets[bulletsKeys[i]].direction === 'right' && charList[charKeys[j]].roomMember !== 1 && charList[charKeys[j]].roomMember !== 2 && charList[charKeys[j]].shielding) {
          // collision detected: blue team successfully blocked the bullet, remove the bullet
          if (checkCollisions(bullets[bulletsKeys[i]], charList[charKeys[j]].shield)) {
            const rN = charList[charKeys[j]].roomNum;
            const rM = bullets[bulletsKeys[i]].roomMember;
            const index = bullets[bulletsKeys[i]].i;

            sockets.deleteBullet(rN, rM, index);

            delete bullets[bulletsKeys[i]];
          }
        } 
        // check collision between blue team's bullets and red team's shield
        else if (bullets[bulletsKeys[i]].direction === 'left' && charList[charKeys[j]].roomMember !== 3 && charList[charKeys[j]].roomMember !== 4 && charList[charKeys[j]].shielding) {
          // collision detected: red team successfully blocked the bullet, remove the bullet
          if (checkCollisions(bullets[bulletsKeys[i]], charList[charKeys[j]].shield)) {
            const rN = charList[charKeys[j]].roomNum;
            const rM = bullets[bulletsKeys[i]].roomMember;
            const index = bullets[bulletsKeys[i]].i;

            sockets.deleteBullet(rN, rM, index);

            delete bullets[bulletsKeys[i]];
          }
        }
      }
    }
  }
};

// function that updates player bullets on server-side
const updateBullets = () => {
  const keys = Object.keys(charList);

  // add active bullets to server object that will keep track of which bullet belongs to which player
  for (let i = 0; i < keys.length; i++) {
    for (let j = 0; j < charList[keys[i]].shotsFired.length; j++) {
      if (charList[keys[i]].shotsFired[j]) {
        bullets[`${charList[keys[i]].hash}${j}`] = charList[keys[i]].shotsFired[j];
        bullets[`${charList[keys[i]].hash}${j}`].i = j;
        bullets[`${charList[keys[i]].hash}${j}`].roomMember = charList[keys[i]].roomMember;
      }
    }
  }
};

// function that resets the character list on server-side
const setCharacterList = (character) => {
  delete charList[character.hash];
};

// function that creates a character in server-side's character list
const setCharacter = (character) => {
  charList[character.hash] = character;

  updateBullets();
};

setInterval(() => {
  checkBulletsCollision();
}, 20);

module.exports.setCharacterList = setCharacterList;
module.exports.setCharacter = setCharacter;
