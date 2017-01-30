(function gameSetup() {
    'use strict';

    /*
      ship object and other variables initialization
    */
    const shipElem = document.getElementById('ship');
    let thruster = '0 15px 6px -7px #ffbb66';
    let thrustVisEff = parseInt(thruster.substring(2,4));
    let accelerating;
    shipElem.style.boxShadow = thruster;

    const ammoDisplay = document.querySelector('.ammo');
    const asteroidsList = document.getElementsByTagName("aside");
    const fuelDisplay = document.querySelector('.fuel');
    const hudHealth = document.querySelector('.health');
    const hudScore = document.querySelector('.score');
    const hudTimer = document.querySelector('.timer');
    const main = document.querySelector('main');
    const shipLeftStart = (window.innerWidth/2) - 20;
    const shipTopStart = (window.innerHeight/2) + 25;

    let gameOver = false;
    let score = 0;
    let timeCount = 59;

    let allAsteroids = [];
    let missiles = [];
    let missileAngles = [];

    const ship = {
      ammo: 20,
      angle: 0,
      fuel: 150,
      health: 2,
      left: shipLeftStart,
      top: shipTopStart,
      velocity: 0
    };

    // syncing top and left style properties of #ship div to the ship object's top and left properties
    shipElem.style.left = `${ship.left}px`;
    shipElem.style.top = `${ship.top}px`;


    // hud setup
    hudHealth.innerHTML = `Extra Lives: ${ship.health}`;
    hudTimer.innerHTML = 'Time: 60';
    hudScore.innerHTML = `Score: ${score}`;
    ammoDisplay.innerHTML = `Ammo: ${ship.ammo}`;
    fuelDisplay.innerHTML = `Fuel: ${ship.fuel}`;

    // collect newly arriving asteroid data
    shipElem.addEventListener('asteroidDetected', function (event) {
      // detect when a new asteroid appears
      // add the new asteroid's details to the allAsteroids array
      allAsteroids.push(event.detail);
    });

    /**
     * handling key presses
     *
     * 32 = spacebar
     * 37 = left
     * 38 = up
     * 39 = right
     * 40 = down
     *
     * @param  {Event} event   The "keyup" event object with a bunch of data in it
     * @return {void}          In other words, no need to return anything
     */
    function handleKeys(event) {
      if (ship.fuel > 0) {
      // establish behaviors for arrow keyups
        if (event.keyCode === 38) { // up
          accelerating = true;
          ship.fuel--;
          increaseThrust();
        } else if (event.keyCode === 40) { // down
            accelerating = false;
            if (ship.velocity > 0) {
              ship.fuel--;
              decreaseThrust();
            }
        } else if (event.keyCode === 39) { // right
            ship.angle+=15;
            ship.fuel--;
            shipRotate();
        } else if (event.keyCode === 37) { // left
            ship.angle-=15;
            ship.fuel--;
            shipRotate();
        }
        updateFuelGuage();
      } else {
        outOfFuel();
      }

      if (event.keyCode === 32) { // spacebar
        // fire a missile if the ship has ammo
        if (ship.ammo > 0) {
          ship.ammo--;
          fireMissile();
        }
      }
    }
    document.querySelector('body').addEventListener('keyup', handleKeys);

    /*
      Ship Operations
    */
    function increaseThrust() {
      // increase thrust
      ship.velocity++;
      // increase thrust vis effect
      incrThrustEffect();
      updateFuelGuage();
    }

    function decreaseThrust() {
      // decrease thrust
      ship.velocity--;
      // decrease thrust vis effect
      decrThrustEffect(thrustVisEff);
      updateFuelGuage();
    }

    // increase thruster visual effect
    function incrThrustEffect() {
      if (thrustVisEff < 60) {
        thrustVisEff += 3;
        thruster = thruster.substring(0, 2) + `${thrustVisEff}` + thruster.substring(4, thruster.length + 1);
        shipElem.style.boxShadow = thruster;
      }
    }

    // decrease thruster visual effect
    function decrThrustEffect() {
      if (thrustVisEff > 15) {
        thrustVisEff -= 3;
        thruster = thruster.substring(0, 2) + `${thrustVisEff}` + thruster.substring(4, thruster.length + 1);
        shipElem.style.boxShadow = thruster;
      }
    }

    // remove thrust vis effect if out of fuel
    function outOfFuel() {
      shipElem.style.boxShadow = 'none';
    }

    // update fuel guage
    function updateFuelGuage() {
      // decrease fuel level
      fuelDisplay.innerHTML = `Fuel: ${ship.fuel}`;
    }

    // turning
    function shipRotate(){
      shipElem.style.transform = `rotate(${ship.angle}deg)`;
      // smooth out turns
      shipElem.style.transition = 'transform .2s ease';
    }

    // firing missiles
    function fireMissile() {
      // update ammo count in hud
      ammoDisplay.innerHTML = `Ammo: ${ship.ammo}`;

      // handle missile firing
      const missileElem = document.createElement('div');
      missileElem.classList = 'missile';
      main.appendChild(missileElem);
      missiles.push(missileElem);

      // set initial missile position
      let missileToSet = (missiles.length - 1);
      let missileAngle = ship.angle;
      missileAngles.push(missileAngle);
      missiles[missileToSet].clientRect = missiles[missileToSet].getBoundingClientRect();
      missiles[missileToSet].style.top = shipElem.style.top;
      missiles[missileToSet].style.left = `${parseInt(shipElem.style.left) + 17}px`;
      missiles[missileToSet].style.transform = `rotate(${missileAngles[missileToSet]}deg)`;
    }

    /**
     * primary game loop executing every 20 milliseconds
     * handling ship and missile movement, positioning, and calling for collision checks
     *
     * @return {void}
     */
    function gameLoop() {
      // stores values for ship movement
      let move = getShipMovement(ship.velocity, ship.angle);

      // moves the ship
      shipElem.style.top = `${parseInt(shipElem.style.top, 10) - move.top}px`;
      shipElem.style.left = `${parseInt(shipElem.style.left, 10) + move.left}px`;

      updateAsteroidData();

      // iterate over missiles and move them
      for (let index = 0; index < missiles.length; index++) {
        let missileTraj = getShipMovement(20, missileAngles[index]);
        missiles[index].style.top = `${parseInt(missiles[index].style.top, 10) - missileTraj.top}px`;
        missiles[index].style.left = `${parseInt(missiles[index].style.left, 10) + missileTraj.left}px`;
      }

      // check to see if ship needs to wrap
      checkForOutOfBounds();
      // check for collisions
      checkForCollisions();
    }

    function updateAsteroidData() {
      // iterate over asteroids and collecting up to date data
      for (let index = 0; index < allAsteroids.length; index++) {
        if (allAsteroids[index].style.animation-name === asteroidsList[index].style.animation-name) {
          // update the clientRect property for each asteroid on the screen
          allAsteroids[index].clientRect = asteroidsList[index].getBoundingClientRect();
        }
      }
    }

    // decide if the ship needs to wrap to opposite side of screen
    function checkForOutOfBounds() {
      // wrap the ship to the opposite edge if leaving screen
      if ((parseInt(shipElem.style.left, 10) + 40) > window.innerWidth) { // If out of bounds right of screen
        shipElem.style.left = '40px';
      } else if (parseInt(shipElem.style.left, 10) < -40) { // If out of bounds left of screen
        shipElem.style.left = `${window.innerWidth - 40}px`;
      } else if (parseInt(shipElem.style.top, 10) < -40) { // If out of bounds top of screen
        shipElem.style.top = `${window.innerHeight - 40}px`;
      } else if ((parseInt(shipElem.style.top, 10) + 40) > window.innerHeight) { // If out of bounds left of screen
        shipElem.style.top = '40px';
      }

      // bind missiles to screen
      for (let index = 0; index < missiles.length; index ++) {
        if ((parseInt(missiles[index].style.left, 10) + 5) > window.innerWidth ||
             parseInt(missiles[index].style.left, 10) < -5 ||
             parseInt(missiles[index].style.top, 10) < -5 ||
            (parseInt(missiles[index].style.top, 10) + 5) > window.innerHeight) {
              (missiles[index].style.display = 'none');
        }
      }
    }

    /**
     * This function checks for any collisions between asteroids and the ship.
     * If a collision is detected, the crash method should be called with the
     * asteroid that was hit:
     *    crash(someAsteroidElement);
     *
     * @return void
     */
    function checkForCollisions() {
      // create ship references
      let shipTop = shipElem.getBoundingClientRect().top;
      let shipLeft = shipElem.getBoundingClientRect().left;

      let shipRect = {
        x: shipLeft,
        y: shipTop,
        width: 40,
        height: 50
      };

      // iterate over all asteroids to check if their position is the same as the ship
      for (let index = 0; index < allAsteroids.length; index++) {
        let asteroidShot = false;

        let asteroidRect = {
          x: allAsteroids[index].clientRect.left,
          y: allAsteroids[index].clientRect.top,
          width: (allAsteroids[index].clientRect.right - allAsteroids[index].clientRect.left),
          height: (allAsteroids[index].clientRect.bottom - allAsteroids[index].clientRect.top)
        };

        if (shipRect.x < asteroidRect.x + asteroidRect.width &&
           shipRect.x + shipRect.width > asteroidRect.x &&
           shipRect.y < asteroidRect.y + asteroidRect.height &&
           shipRect.height + shipRect.y > asteroidRect.y) {
            // collision detected!
            if (ship.health === 0) {
              hudHealth.innerHTML = `Extra Lives: ${ship.health}`;
              crash(allAsteroids[index]);
            } else {
                allAsteroids[index].style.display = 'none';
                ship.health--;
                hudHealth.innerHTML = `Extra Lives: ${ship.health}`;
            }
        }

        // iterate over all missiles to check if their position is the same as an asteroid
        for (let index = 0; index < missiles.length; index++) {
          let missileRect = {
            x: parseInt(missiles[index].style.left, 10),
            y: parseInt(missiles[index].style.top, 10),
            width: 4,
            height: 6
          }

          if (missileRect.x < asteroidRect.x + asteroidRect.width &&
             missileRect.x + missileRect.width > asteroidRect.x &&
             missileRect.y < asteroidRect.y + asteroidRect.height &&
             missileRect.height + missileRect.y > asteroidRect.y) {
              // collision detected!
              asteroidShot = true;
              main.removeChild(missiles[index]);
              score *= 2;
          }
        }

        if (asteroidShot === true) {
          allAsteroids[index].style.display = 'none';
        }
      }
    }

    /**
     * This event handler will execute when a crash occurs
     *
     * return {void}
     */
    document.querySelector('main').addEventListener('crash', function () {
        setGameOver();
    });

    // game timer
    function gameTime() {
      // count down time in hud
      hudTimer.innerHTML = `Time: ${timeCount}`;
      timeCount--;

      score += 10;
      hudScore.innerHTML = `Score: ${score}`;
    }

    // end game
    setTimeout(setGameOver, 61000);
    function setGameOver() {
      // Stops game loop if game is over
      clearInterval(loopHandle);
      clearInterval(timeLoopHandle);

      // apply vis effects and remove player control
      document.querySelector('body').removeEventListener('keyup', handleKeys);
      document.querySelector('#ship').classList.add('crash');

      // create a game over screen with start over button
      if (gameOver === false) {
        // game over container
        const gameOverElem = document.createElement('div');
        gameOverElem.classList = 'game-over';
        main.appendChild(gameOverElem);

        // game over message
        const gameOverMessage = document.createElement('h1');
        gameOverMessage.innerHTML = 'GAME OVER';
        gameOverElem.appendChild(gameOverMessage);

        // game recap
        const gameOverTime = document.createElement('p');
        gameOverTime.innerHTML = `Time Survived: ${59 - timeCount}s`;
        gameOverElem.appendChild(gameOverTime);

        const gameOverScore = document.createElement('p');
        gameOverScore.innerHTML = `Score: ${score}`;
        gameOverElem.appendChild(gameOverScore);

        // start over button
        const startOverButton = document.createElement('button');
        startOverButton.innerHTML = 'Start Over';
        gameOverElem.appendChild(startOverButton);

        gameOver = true;
        startOverButton.addEventListener('click', () => {
          gameReset();
        });
      }
    }

    // Resets Game Parameters on game click
    function gameReset() {
      location.reload();
    }



    /** ************************************************************************
     *             These functions and code are given to you.
     *
     *                   !!! DO NOT EDIT BELOW HERE !!!
     ** ************************************************************************/

     const loopHandle = setInterval(gameLoop, 20);
     const timeLoopHandle = setInterval(gameTime, 1000);

     /**
      * Executes the code required when a crash has occurred. You should call
      * this function when a collision has been detected with the asteroid that
      * was hit as the only argument.
      *
      * @param  {HTMLElement} asteroidHit The HTML element of the hit asteroid
      * @return {void}
      */
    function crash(asteroidHit) {
        document.querySelector('body').removeEventListener('keyup', handleKeys);
        asteroidHit.classList.add('hit');
        document.querySelector('#ship').classList.add('crash');

        var event = new CustomEvent('crash', { detail: asteroidHit });
        document.querySelector('main').dispatchEvent(event);
    }

    /**
     * Get the change in ship position (movement) given the current velocity
     * and angle the ship is pointing.
     *
     * @param  {Number} velocity The current speed of the ship (no units)
     * @param  {Number} angle    The angle the ship is pointing (no units)
     * @return {Object}          The amount to move the ship by with regard to left and top position (object with two properties)
     */
    function getShipMovement(velocity, angle) {
        return {
            left: (velocity * Math.sin(angle * Math.PI / 180)),
            top: (velocity * Math.cos(angle * Math.PI / 180))
        };
    }

})();
