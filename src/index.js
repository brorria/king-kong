// chargement des librairies

var player;
var platforms;
var cursors;
var ladders;
var sceneRef;
var isOnLadder = false;
var isClimbing = false;
var gameplayMap;
var introMap;
var isIntroPlaying = true;
var platformCollider;
var debugMode = true;
var donkeyKong;
var pauline;
var paulineGoal;
var barrels;
var barrelTimer;
var statusText;
var hasWon = false;
var barrelBeams = [];

var GAME_WIDTH = 800;
var GAME_HEIGHT = 600;
var MOVE_SPEED = 160;
var JUMP_SPEED = -165;
var CLIMB_SPEED = 120;
var INTRO_DURATION = 1800;
var BARREL_SPEED = 90;
var BARREL_DELAY = 2200;

/***********************************************************************/
/** CONFIGURATION GLOBALE DU JEU ET LANCEMENT 
/***********************************************************************/

// configuration générale du jeu
var config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH, // largeur en pixels
  height: GAME_HEIGHT, // hauteur en pixels
  physics: {
    // définition des parametres physiques
    default: "arcade", // mode arcade : le plus simple : des rectangles pour gérer les collisions. Pas de pentes
    arcade: {
      // parametres du mode arcade
      gravity: {
        y: 520 // gravité verticale plus forte pour rapprocher le saut du jeu arcade
      },
      debug: debugMode // passe a false quand tu veux cacher les hitbox
    }
  },
  scene: {
    // une scene est un écran de jeu. Pour fonctionner il lui faut 3 fonctions  : create, preload, update
    preload: preload, // la phase preload est associée à la fonction preload, du meme nom (on aurait pu avoir un autre nom)
    create: create, // la phase create est associée à la fonction create, du meme nom (on aurait pu avoir un autre nom)
    update: update // la phase update est associée à la fonction update, du meme nom (on aurait pu avoir un autre nom)
  }
};

// création et lancement du jeu
new Phaser.Game(config);


/***********************************************************************/
/** FONCTION PRELOAD 
/***********************************************************************/

/** La fonction preload est appelée une et une seule fois,
 * lors du chargement de la scene dans le jeu.
 * On y trouve surtout le chargement des assets (images, son ..)
 */
function preload() {
  // Charge le vrai sprite de la map pour construire ensuite le prototype dessus.
  this.load.image("niveau1", "src/asset/vrai map 1.png");
  this.load.image("introNiveau1", "src/asset/vrai map 1.png");
  this.load.image("ladder", "src/asset/echelle avec arrière-plan supprimé.png");
  this.load.image("barrelLaunch", "src/asset/barel-normal avec arrière-plan supprimé.png");
  this.load.spritesheet("barrelRoll", "src/asset/barel-normal-lancé avec arrière-plan supprimé.png", {
    frameWidth: 90,
    frameHeight: 74
  });
  this.load.spritesheet("dk", "src/asset/king-kong-lance+pose avec arrière-plan supprimé.png", {
    frameWidth: 191,
    frameHeight: 164
  });
  this.load.spritesheet("pauline", "src/asset/princesse avec arrière-plan supprimé.png", {
    frameWidth: 114,
    frameHeight: 145
  });

  // Charge Mario en spritesheet pour pouvoir reutiliser les frames plus tard.
  this.load.spritesheet("mario", "src/asset/mario-left avec arrière-plan supprimé.png", {
    frameWidth: 52,
    frameHeight: 73
  });
}

/***********************************************************************/
/** FONCTION CREATE 
/***********************************************************************/

/* La fonction create est appelée lors du lancement de la scene
 * si on relance la scene, elle sera appelée a nouveau
 * on y trouve toutes les instructions permettant de créer la scene
 * placement des peronnages, des sprites, des platesformes, création des animations
 * ainsi que toutes les instructions permettant de planifier des evenements
 */
function create() {
  sceneRef = this;

  // Garde un fond noir proche du rendu arcade pendant le développement.
  this.cameras.main.setBackgroundColor("#000000");

  // Notion Phaser en plus du cours : on garde le ratio du sprite et on le centre
  // pour éviter de déformer la vraie map.
  gameplayMap = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "niveau1");
  var echelle = Math.min(GAME_WIDTH / gameplayMap.width, GAME_HEIGHT / gameplayMap.height);

  gameplayMap.setScale(echelle);

  // Place les personnages principaux avec un recadrage simple pour
  // n'afficher qu'une seule pose utile de chaque planche de sprites.
  donkeyKong = this.add.sprite(218, 158, "dk", 1);
  donkeyKong.setScale(0.48);

  pauline = this.add.sprite(361, 110, "pauline", 0);
  pauline.setScale(0.3);

  paulineGoal = this.add.rectangle(361, 121, 26, 36, 0x00ff00, 0);
  this.physics.add.existing(paulineGoal, true);

  this.anims.create({
    key: "barrel-roll",
    frames: this.anims.generateFrameNumbers("barrelRoll", { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1
  });

  statusText = this.add.text(18, 18, "", {
    fontSize: "18px",
    color: "#ffffff"
  });

  ladders = this.physics.add.staticGroup();

  // Les collisions sont posees a la main avec des rectangles invisibles
  // pour rester simples a comprendre et a regler.
  platforms = this.physics.add.staticGroup();
  var mapOffsetX = (GAME_WIDTH - gameplayMap.displayWidth) / 2;
  var mapOffsetY = (GAME_HEIGHT - gameplayMap.displayHeight) / 2;

  function ajouterPlateformeMap(scene, x, y, largeur, hauteur) {
    var plateforme = scene.add.rectangle(
      mapOffsetX + (x + largeur / 2) * echelle,
      mapOffsetY + (y + hauteur / 2) * echelle,
      largeur * echelle,
      hauteur * echelle,
      0xff0000,
      0
    );

    scene.physics.add.existing(plateforme, true);
    platforms.add(plateforme);
  }

  function ajouterPoutreInclinee(scene, xDebut, xFin, yDebut, yFin, largeurSegment, hauteur) {
    var x = xDebut;

    while (x <= xFin) {
      var progression = (x - xDebut) / (xFin - xDebut);
      var y = yDebut + (yFin - yDebut) * progression;
      var largeur = Math.min(largeurSegment + 2, xFin - x + 1);

      ajouterPlateformeMap(scene, x, Math.round(y), largeur, hauteur);
      x += largeurSegment;
    }
  }

  function ajouterEchelle(scene, x, y, largeur, hauteur) {
    var centerX = mapOffsetX + (x + largeur / 2) * echelle;
    var centerY = mapOffsetY + (y + hauteur / 2) * echelle;
    var ladderZone = scene.add.rectangle(centerX, centerY, (largeur - 8) * echelle, hauteur * echelle, 0, 0);
    var tileHeight = 18;
    var tileCount = Math.max(1, Math.ceil(hauteur / tileHeight));

    scene.physics.add.existing(ladderZone, true);
    ladders.add(ladderZone);

    for (var i = 0; i < tileCount; i++) {
      var tileY = y + tileHeight / 2 + i * tileHeight;

      if (tileY > y + hauteur) {
        tileY = y + hauteur - tileHeight / 2;
      }

      var ladderSprite = scene.add.image(
        mapOffsetX + (x + largeur / 2) * echelle,
        mapOffsetY + tileY * echelle,
        "ladder"
      );

      ladderSprite.setDisplaySize((largeur - 8) * echelle, tileHeight * echelle);
    }
  }

  function ajouterZoneEchelle(scene, x, y, largeur, hauteur) {
    var centerX = mapOffsetX + (x + largeur / 2) * echelle;
    var centerY = mapOffsetY + (y + hauteur / 2) * echelle;
    var ladderZone = scene.add.rectangle(centerX, centerY, (largeur - 8) * echelle, hauteur * echelle, 0, 0);

    scene.physics.add.existing(ladderZone, true);
    ladders.add(ladderZone);
  }

  // Petite poutre du haut.
  ajouterPlateformeMap(this, 88, 56, 48, 8);

  // Poutres principales recalees sur la vraie map jouable.
  ajouterPoutreInclinee(this, 0, 207, 84, 88, 16, 8);
  ajouterPoutreInclinee(this, 16, 222, 121, 109, 16, 8);
  ajouterPoutreInclinee(this, 0, 207, 142, 154, 16, 8);
  ajouterPoutreInclinee(this, 16, 222, 187, 175, 16, 8);
  ajouterPoutreInclinee(this, 0, 207, 208, 220, 16, 8);
  ajouterPoutreInclinee(this, 0, 222, 248, 241, 16, 8);

  // Echelles visuelles et detectables, calees sur la capture de reference.
  ajouterZoneEchelle(this, 76, 32, 16, 50);
  ajouterZoneEchelle(this, 60, 32, 16, 50);
  ajouterEchelle(this, 111, 80, 19, 30);
  ajouterEchelle(this, 78, 118, 19, 28);
  ajouterEchelle(this, 145, 134, 19, 16);
  ajouterEchelle(this, 112, 150, 19, 28);
  ajouterEchelle(this, 78, 180, 19, 28);
  ajouterEchelle(this, 145, 200, 19, 16);
  ajouterEchelle(this, 36, 211, 19, 32);

  barrelBeams = [
    creerPoutreBaril(0, 207, 84, 88, 1),
    creerPoutreBaril(16, 222, 121, 109, -1),
    creerPoutreBaril(0, 207, 142, 154, 1),
    creerPoutreBaril(16, 222, 187, 175, -1),
    creerPoutreBaril(0, 207, 208, 220, 1),
    creerPoutreBaril(0, 222, 248, 241, -1)
  ];

  function creerPoutreBaril(xDebut, xFin, yDebut, yFin, direction) {
    return {
      xStart: mapOffsetX + xDebut * echelle,
      xEnd: mapOffsetX + xFin * echelle,
      yMin: mapOffsetY + Math.min(yDebut, yFin) * echelle,
      yMax: mapOffsetY + Math.max(yDebut, yFin) * echelle,
      direction: direction
    };
  }

  // Cree Mario avec la physique Arcade, sans mouvement pour ce sous-jalon.
  player = this.physics.add.sprite(180, 548, "mario", 0);
  player.setScale(0.45);
  // Notion Phaser en plus du cours : setOrigin permet ici d'aligner le bas
  // du sprite avec le haut de la plateforme.
  player.setOrigin(0.5, 1);
  // Notion Phaser en plus du cours : on ajuste la hitbox pour qu'elle colle
  // mieux au sprite, y compris pour taper une poutre par dessous.
  player.body.setSize(26, 40);
  player.body.setOffset(13, 31);
  player.setCollideWorldBounds(true);

  barrels = this.physics.add.group({
    allowGravity: true
  });

  // Empeche Mario de traverser les poutres du niveau.
  // Pendant la grimpe, on coupe temporairement cette collision.
  platformCollider = this.physics.add.collider(player, platforms, null, function () {
    return !isClimbing;
  });

  // Cree les controles clavier pour le deplacement horizontal.
  cursors = this.input.keyboard.createCursorKeys();

  this.physics.add.collider(barrels, platforms);
  this.physics.add.overlap(player, paulineGoal, atteindrePauline, null, this);
  this.physics.add.overlap(player, barrels, toucherBaril, null, this);

  // L'intro affiche d'abord une image complete du debut avant de lancer
  // la map jouable actuelle.
  introMap = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "introNiveau1");
  introMap.setScale(Math.min(GAME_WIDTH / introMap.width, GAME_HEIGHT / introMap.height));

  gameplayMap.setVisible(false);
  donkeyKong.setVisible(false);
  pauline.setVisible(false);
  statusText.setVisible(false);
  player.setVisible(false);
  player.body.enable = false;

  platforms.children.iterate(function (plateforme) {
    plateforme.body.enable = false;
  });

  ladders.children.iterate(function (ladder) {
    ladder.setVisible(false);
    ladder.body.enable = false;
  });

  this.time.delayedCall(INTRO_DURATION, function () {
    isIntroPlaying = false;
    introMap.destroy();
    gameplayMap.setVisible(true);
    donkeyKong.setVisible(true);
    pauline.setVisible(true);
    statusText.setVisible(true);
    player.setVisible(true);
    player.body.enable = true;

    platforms.children.iterate(function (plateforme) {
      plateforme.body.enable = true;
    });

    ladders.children.iterate(function (ladder) {
      ladder.setVisible(true);
      ladder.body.enable = true;
    });

    barrelTimer = sceneRef.time.addEvent({
      delay: BARREL_DELAY,
      loop: true,
      callback: lancerBaril
    });
  });
}

/***********************************************************************/
/** FONCTION UPDATE 
/***********************************************************************/

function update() {
  if (isIntroPlaying) {
    return;
  }

  if (hasWon) {
    player.setVelocityX(0);
    player.setVelocityY(0);
    mettreAJourBarils();
    return;
  }

  isOnLadder = sceneRef.physics.overlap(player, ladders);

  if (isOnLadder && (cursors.up.isDown || cursors.down.isDown)) {
    isClimbing = true;
  } else if (!isOnLadder) {
    isClimbing = false;
  }

  if (isClimbing && (cursors.left.isDown || cursors.right.isDown)) {
    isClimbing = false;
  }

  if (isClimbing) {
    player.body.allowGravity = false;
    player.setVelocityX(0);

    if (cursors.up.isDown) {
      player.setVelocityY(-CLIMB_SPEED);
    } else if (cursors.down.isDown) {
      player.setVelocityY(CLIMB_SPEED);
    } else {
      player.setVelocityY(0);
    }

    // On continue a mettre a jour les barils meme quand Mario grimpe,
    // sinon leur comportement depend de l'etat du joueur.
    mettreAJourBarils();
    return;
  }

  player.body.allowGravity = true;

  if (cursors.left.isDown) {
    player.setVelocityX(-MOVE_SPEED);
    player.setFlipX(false);
  } else if (cursors.right.isDown) {
    player.setVelocityX(MOVE_SPEED);
    // Notion Phaser en plus du cours : setFlipX retourne le sprite
    // horizontalement sans avoir besoin d'une deuxieme image.
    player.setFlipX(true);
  } else {
    player.setVelocityX(0);
  }

  // Le saut reste volontairement simple : Mario saute seulement s'il est pose
  // sur une plateforme, ce qui evite le double saut infini.
  if (cursors.up.isDown && player.body.blocked.down) {
    player.setVelocityY(JUMP_SPEED);
  }

  mettreAJourBarils();
}

function mettreAJourBarils() {
  barrels.children.iterate(function (barrel) {
    if (!barrel) {
      return;
    }

    if (barrel.y > GAME_HEIGHT + 40 || barrel.x < -40 || barrel.x > GAME_WIDTH + 40) {
      barrel.destroy();
      return;
    }

    if (barrel.body.blocked.down) {
      var poutreBaril = getBarrelBeam(barrel.y);

      if (!poutreBaril) {
        return;
      }

      if (!barrel.getData("isRolling")) {
        barrel.setData("isRolling", true);
        barrel.setData("isDropping", false);
        barrel.setTexture("barrelRoll", 0);
        barrel.setDisplaySize(34, 28);
        barrel.setOrigin(0.5, 1);
        barrel.y = barrel.y - 6;
        barrel.body.setSize(56, 28);
        barrel.body.setOffset(17, 42);
      }

      // Force l'animation du spritesheet pendant tout le roulement,
      // meme quand le baril repart vers la droite.
      barrel.anims.play("barrel-roll", true);
      barrel.setFlipX(poutreBaril.direction > 0);

      if (
        (poutreBaril.direction > 0 && barrel.x >= poutreBaril.xEnd - 12) ||
        (poutreBaril.direction < 0 && barrel.x <= poutreBaril.xStart + 12)
      ) {
        barrel.setData("isDropping", true);
        barrel.setVelocityX(poutreBaril.direction * 36);
      } else {
        barrel.setData("isDropping", false);
        barrel.setVelocityX(poutreBaril.direction * BARREL_SPEED);
      }

      barrel.setAngularVelocity(0);
    }
  });
}

function lancerBaril() {
  if (isIntroPlaying || hasWon) {
    return;
  }

  var barrel = barrels.create(donkeyKong.x + 14, donkeyKong.y + 6, "barrelLaunch");

  barrel.setDisplaySize(28, 20);
  barrel.setOrigin(0.5, 1);
  barrel.setCircle(20, 12, 12);
  barrel.setBounce(0);
  barrel.setCollideWorldBounds(false);
  barrel.setData("isRolling", false);
  barrel.setData("isDropping", false);
  barrel.setVelocityX(BARREL_SPEED);
}

function getBarrelBeam(y) {
  for (var i = 0; i < barrelBeams.length; i++) {
    if (y >= barrelBeams[i].yMin - 18 && y <= barrelBeams[i].yMax + 18) {
      return barrelBeams[i];
    }
  }

  return null;
}

function toucherBaril(playerSprite, barrel) {
  barrel.destroy();
  isClimbing = false;
  playerSprite.body.allowGravity = true;
  playerSprite.setVelocity(0, 0);
  playerSprite.setPosition(180, 548);
  statusText.setText("Aie ! Retour au depart");

  sceneRef.time.delayedCall(900, function () {
    if (!hasWon) {
      statusText.setText("");
    }
  });
}

function atteindrePauline() {
  hasWon = true;
  statusText.setText("Bravo ! Pauline est atteinte");
  if (barrelTimer) {
    barrelTimer.remove(false);
  }
}
