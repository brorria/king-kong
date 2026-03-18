// Variables globales du jeu.
// On les garde en haut pour que preload, create et update
// puissent partager le meme etat simplement.
var player;
var platforms;
var cursors;
var ladders;
var sceneRef;
var isOnLadder = false;
var isClimbing = false;
var gameplayMap;
var introMap;
var introClimber;
var isIntroPlaying = true;
var platformCollider;
var debugMode = true;
var donkeyKong;
var pauline;
var barrelStackDisplay;
var paulineGoal;
var barrels;
var barrelTimer;
var firstBarrelTimer;
var statusText;
var scoreText;
var isGameOver = false;
var currentLives = 3;
var currentRound = 1;
var speedMultiplier = 1;
var targetRounds = 5;
var totalScore = 0;
var roundStartTime = 0;
var lifeIcons = [];
var isRespawning = false;
var barrelBeams = [];
var endScreen;
var endTitleText;
var endHintText;
var startScreenImage;
var startScreenDonkeyKong;
var startMenuOverlay;
var startButtonBg;
var startButtonText;

var GAME_WIDTH = 800;
var GAME_HEIGHT = 600;
var MOVE_SPEED = 80;
var JUMP_SPEED = -165;
var CLIMB_SPEED = 60;
var INTRO_DURATION = 1800;
var FIRST_BARREL_DELAY = 1000;
var BARREL_SPEED = 90;
var BARREL_DELAY = 2000;
var BARREL_DROP_SPEED_X = 42;
var BARREL_BEAM_MARGIN = 20;
var BARREL_EDGE_MARGIN = 10;
var BARREL_SPAWN_OFFSET_X = 45;
var BARREL_SPAWN_OFFSET_Y = 22;
var PLAYER_START_X = 180;
var PLAYER_START_Y = 548;
var LADDER_BIG_WIDTH = 10;
var LADDER_BIG_HEIGHT = 17;
var LADDER_SMALL_WIDTH = 10;
var LADDER_SMALL_HEIGHT = 20;

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
      debug: false // passe a false quand tu veux cacher les hitbox
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
  // Charge toutes les images avant create().
  // On separe bien les assets par usage : map, personnages, UI et animations.
  this.load.image("niveau1", "src/asset/vrai map 1.png");
  this.load.image("introNiveau1", "src/asset/vrai map 1.png");
  this.load.image("startScreen", "src/asset/image debu king kong - copie 2.png");
  this.load.image("ladder", "src/asset/echelle avec arrière-plan supprimé.png");
  this.load.image("barrelLaunch", "src/asset/barel-normal avec arrière-plan supprimé.png");
  this.load.image("barrelStack", "src/asset/barel-normal-x4 avec arrière-plan supprimé.png");
  this.load.spritesheet("barrelRoll", "src/asset/barel-normal-lancé avec arrière-plan supprimé.png", {
    frameWidth: 90,
    frameHeight: 74
  });
  this.load.spritesheet("dkThrow", "src/asset/king-kong-lance+pose avec arrière-plan supprimé.png", {
    frameWidth: 191,
    frameHeight: 164
  });
  this.load.spritesheet("dkTurn", "src/asset/king-kong-right+left avec arrière-plan supprimé.png", {
    frameWidth: 195,
    frameHeight: 148
  });
  this.load.spritesheet("dkClimb", "src/asset/king-kong-grimpe avec arrière-plan supprimé.png", {
    frameWidth: 199,
    frameHeight: 162
  });
  this.load.spritesheet("dkAngry", "src/asset/king-kong-enervé avec arrière-plan supprimé.png", {
    frameWidth: 199,
    frameHeight: 146
  });
  this.load.spritesheet("pauline", "src/asset/princesse avec arrière-plan supprimé.png", {
    frameWidth: 114,
    frameHeight: 145
  });
  this.load.image("lifeMario", "src/asset/vie mario avec arrière-plan supprimé.png");
  this.load.spritesheet("marioDie", "src/asset/mario-die avec arrière-plan supprimé.png", {
    frameWidth: 32,
    frameHeight: 55
  });
  this.load.image("marioStand", "src/asset/mario stand avec arrière-plan supprimé.png");
  this.load.image("marioStep1", "src/asset/mario first step  avec arrière-plan supprimé.png");
  this.load.image("marioStep2", "src/asset/mario secend step avec arrière-plan supprimé.png");
  this.load.spritesheet("marioClimb", "src/asset/mario-grimpe+stand avec arrière-plan supprimé.png", {
    frameWidth: 73,
    frameHeight: 74
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

  // Fond noir simple pour rester proche du rendu arcade
  // et eviter les bords blancs autour des assets.
  this.cameras.main.setBackgroundColor("#000000");

  // On garde le ratio de la map pour ne pas l'etirer.
  // C'est plus propre visuellement que de forcer l'image au format ecran.
  gameplayMap = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "niveau1");
  var echelle = Math.min(GAME_WIDTH / gameplayMap.width, GAME_HEIGHT / gameplayMap.height);

  gameplayMap.setScale(echelle);

  // Place les personnages fixes du niveau.
  // Ils existent des le debut de la scene, mais ils sont parfois caches
  // pendant l'ecran d'accueil et la sequence d'ouverture.
  donkeyKong = this.add.sprite(236, 158, "dkTurn", 0);
  donkeyKong.setScale(0.48);

  pauline = this.add.sprite(361, 110, "pauline", 0);
  pauline.setScale(0.35);

  barrelStackDisplay = this.add.image(168, 154, "barrelStack");
  barrelStackDisplay.setScale(0.46);

  // Pauline n'est pas prise directement comme zone de victoire.
  // On cree une petite zone separee pour avoir une collision plus propre.
  paulineGoal = this.add.rectangle(361, 121, 26, 36, 0x00ff00, 0);
  this.physics.add.existing(paulineGoal, true);

  // Toutes les animations sont creees une seule fois dans create().
  // Ensuite on les joue au bon moment selon l'etat du jeu.
  this.anims.create({
    key: "barrel-roll",
    frames: this.anims.generateFrameNumbers("barrelRoll", { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1
  });

  this.anims.create({
    key: "dk-gameplay",
    // Notion Phaser en plus du cours : une animation peut melanger
    // des frames venant de plusieurs spritesheets differentes.
    frames: [
      { key: "dkTurn", frame: 0 },
      { key: "dkThrow", frame: 1 },
      { key: "dkTurn", frame: 1 },
      { key: "dkThrow", frame: 0 }
    ],
    frameRate: 2,
    repeat: -1
  });

  this.anims.create({
    key: "dk-climb",
    frames: this.anims.generateFrameNumbers("dkClimb", { start: 0, end: 1 }),
    frameRate: 4,
    repeat: -1
  });

  this.anims.create({
    key: "dk-start-angry",
    frames: this.anims.generateFrameNumbers("dkAngry", { start: 0, end: 1 }),
    frameRate: 3,
    repeat: -1,
    yoyo: true
  });

  this.anims.create({
    key: "pauline-intro",
    frames: this.anims.generateFrameNumbers("pauline", { start: 0, end: 4 }),
    frameRate: 4,
    repeat: -1,
    yoyo: true
  });

  this.anims.create({
    key: "mario-walk",
    // Notion Phaser en plus du cours : on peut aussi construire une animation
    // avec plusieurs images separees au lieu d'une spritesheet.
    frames: [
      { key: "marioStand" },
      { key: "marioStep1" },
      { key: "marioStand" },
      { key: "marioStep2" }
    ],
    frameRate: 8,
    repeat: -1
  });

  this.anims.create({
    key: "mario-die",
    frames: this.anims.generateFrameNumbers("marioDie", { start: 0, end: 2 }),
    frameRate: 5,
    repeat: 0
  });

  this.anims.create({
    key: "mario-climb",
    frames: this.anims.generateFrameNumbers("marioClimb", { start: 0, end: 3 }),
    frameRate: 8,
    repeat: -1
  });

  donkeyKong.anims.play("dk-gameplay");
  pauline.anims.play("pauline-intro");

  // Petit texte libre pour afficher des infos de tour ou d'etat.
  statusText = this.add.text(18, 18, "", {
    fontSize: "18px",
    color: "#ffffff"
  });

  // Affichage du score total.
  // Il sera mis a jour a chaque fois que Mario atteint Pauline.
  scoreText = this.add.text(180, 25, "000000", {
    fontSize: "22px",
    color: "#ffffff"
  });

  // Les vies sont creees comme 3 images separees pour simplifier
  // leur masquage quand Mario en perd une.
  creerAffichageDesVies(this);

  // Ecran de fin par-dessus le reste du jeu.
  // On utilise setDepth pour etre sur qu'il passe devant tout.
  endScreen = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.8);
  endScreen.setDepth(20);
  endScreen.setVisible(false);

  endTitleText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, "", {
    fontSize: "40px",
    color: "#ffffff"
  });
  endTitleText.setOrigin(0.5);
  endTitleText.setDepth(21);
  endTitleText.setVisible(false);

  endHintText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 26, "", {
    fontSize: "18px",
    color: "#ffffff"
  });
  endHintText.setOrigin(0.5);
  endHintText.setDepth(21);
  endHintText.setVisible(false);

  // Ecran d'accueil.
  // Ici on affiche l'image de start fournie par l'utilisateur
  // et un Donkey Kong anime pose dessus.
  startScreenImage = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "startScreen");
  startScreenImage.setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
  startScreenImage.setDepth(14);
  startScreenImage.setVisible(false);
  startScreenImage.setInteractive({ useHandCursor: true });

  startScreenDonkeyKong = this.add.sprite(400, 432, "dkAngry", 0);
  startScreenDonkeyKong.setScale(0.62);
  startScreenDonkeyKong.setDepth(15);
  startScreenDonkeyKong.setVisible(false);
  startScreenDonkeyKong.anims.play("dk-start-angry");

  startMenuOverlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.45);
  startMenuOverlay.setDepth(15);
  startMenuOverlay.setVisible(false);

  startButtonBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, 180, 56, 0x000000, 0.85);
  startButtonBg.setStrokeStyle(3, 0xffffff, 1);
  startButtonBg.setDepth(16);
  startButtonBg.setVisible(false);
  startButtonBg.setInteractive({ useHandCursor: true });

  startButtonText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, "START", {
    fontSize: "28px",
    color: "#ffffff"
  });
  startButtonText.setOrigin(0.5);
  startButtonText.setDepth(17);
  startButtonText.setVisible(false);

  // Groupes physiques principaux du niveau.
  // staticGroup est adapte ici car poutres et echelles ne bougent pas.
  ladders = this.physics.add.staticGroup();

  // Les collisions sont posees a la main avec des rectangles invisibles.
  // C'est plus simple a regler qu'un systeme de tiles ou de pentes reelles.
  platforms = this.physics.add.staticGroup();
  var mapOffsetX = (GAME_WIDTH - gameplayMap.displayWidth) / 2;
  var mapOffsetY = (GAME_HEIGHT - gameplayMap.displayHeight) / 2;

  function ajouterPlateformeMap(scene, x, y, largeur, hauteur) {
    // Convertit des coordonnees "map arcade" en coordonnees Phaser.
    // Cela permet de placer plus facilement les hitbox a partir de l'image.
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
    // Une poutre inclinee est reconstruite avec plusieurs petits rectangles.
    // On garde des hitbox droites car Arcade Physics ne gere pas les vraies pentes.
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
    // Une echelle a 2 parties :
    // 1. une zone de collision invisible pour grimper
    // 2. un ou plusieurs sprites visuels pour l'affichage
    var centerX = mapOffsetX + (x + largeur / 2) * echelle;
    var centerY = mapOffsetY + (y + hauteur / 2) * echelle;
    var ladderZone = scene.add.rectangle(centerX, centerY, (largeur - 8) * echelle, hauteur * echelle, 0, 0);
    var ladderWidth = LADDER_BIG_WIDTH;
    var ladderHeight = LADDER_BIG_HEIGHT;
    var spriteCount = 2;

    // Les petites echelles "cassees" gardent une taille plus courte
    // pour rester proches du decor arcade.
    if (hauteur <= 16) {
      ladderWidth = LADDER_SMALL_WIDTH;
      ladderHeight = LADDER_SMALL_HEIGHT;
      spriteCount = 1;
    }

    scene.physics.add.existing(ladderZone, true);
    ladders.add(ladderZone);

    for (var i = 0; i < spriteCount; i++) {
      var spriteY = centerY;

      if (spriteCount > 1) {
        spriteY = centerY + (i - 0.5) * ladderHeight * echelle + 8;
      }

      var ladderSprite = scene.add.image(
        centerX,
        spriteY,
        "ladder"
      );

      ladderSprite.setDisplaySize(ladderWidth * echelle, ladderHeight * echelle);
    }
  }

  function ajouterZoneEchelle(scene, x, y, largeur, hauteur) {
    // Variante utile quand l'echelle est deja dessinee dans la map :
    // on garde seulement la hitbox sans rajouter de sprite visible.
    var centerX = mapOffsetX + (x + largeur / 2) * echelle;
    var centerY = mapOffsetY + (y + hauteur / 2) * echelle;
    var ladderZone = scene.add.rectangle(centerX, centerY, (largeur - 8) * echelle, hauteur * echelle, 0, 0);

    scene.physics.add.existing(ladderZone, true);
    ladders.add(ladderZone);
  }

  // Petite poutre du haut.
  // Elle est separee car elle ne suit pas la meme pente que les autres.
  ajouterPlateformeMap(this, 88, 56, 48, 8);

  // Poutres principales recalees sur la vraie map jouable.
  // Chaque appel reconstruit un etage du niveau.
  ajouterPoutreInclinee(this, 0, 207, 84, 88, 16, 8);
  ajouterPoutreInclinee(this, 16, 222, 121, 109, 16, 8);
  ajouterPoutreInclinee(this, 0, 207, 142, 154, 16, 8);
  ajouterPoutreInclinee(this, 16, 222, 187, 175, 16, 8);
  ajouterPoutreInclinee(this, 0, 207, 208, 220, 16, 8);
  ajouterPoutreInclinee(this, 0, 222, 248, 241, 16, 8);

  // Echelles placees a la main a partir de la capture de reference.
  // Certaines sont completes, d'autres sont "cassees".
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
    // Ces donnees servent uniquement a guider les barils.
    // On separe cette logique des plateformes pour regler la trajectoire plus facilement.
    return {
      xStart: mapOffsetX + xDebut * echelle,
      xEnd: mapOffsetX + xFin * echelle,
      yMin: mapOffsetY + Math.min(yDebut, yFin) * echelle,
      yMax: mapOffsetY + Math.max(yDebut, yFin) * echelle,
      direction: direction
    };
  }

  // Mario est cree comme sprite physique.
  // On garde une hitbox manuelle car le dessin ne remplit pas toute l'image.
  player = this.physics.add.sprite(PLAYER_START_X, PLAYER_START_Y, "marioStand");
  player.setScale(0.45);
  // Notion Phaser en plus du cours : setOrigin permet ici d'aligner le bas
  // du sprite avec le haut de la plateforme.
  player.setOrigin(0.5, 1);
  // Notion Phaser en plus du cours : on ajuste la hitbox pour qu'elle colle
  // mieux au sprite, y compris pour taper une poutre par dessous.
  player.body.setSize(26, 40);
  player.body.setOffset(13, 31);
  player.setCollideWorldBounds(true);

  // Groupe de barils dynamiques.
  // Chaque baril est gere individuellement dans update().
  barrels = this.physics.add.group({
    allowGravity: true
  });

  // Collision Mario/poutres.
  // On la coupe temporairement pendant la grimpe pour eviter les blocages sur les echelles.
  platformCollider = this.physics.add.collider(player, platforms, null, function () {
    return !isClimbing;
  });

  // Clavier principal du jeu.
  cursors = this.input.keyboard.createCursorKeys();

  // Les overlaps servent ici pour des interactions non bloquantes :
  // toucher Pauline ou se faire toucher par un baril.
  this.physics.add.collider(barrels, platforms);
  this.physics.add.overlap(player, paulineGoal, atteindrePauline, null, this);
  this.physics.add.overlap(player, barrels, toucherBaril, null, this);

  function coordXMap(x) {
    return mapOffsetX + x * echelle;
  }

  function coordYMap(y) {
    return mapOffsetY + y * echelle;
  }

  function masquerNiveauPourOuverture() {
    // Cache et desactive le niveau pendant l'accueil et la sequence d'intro.
    // Cela evite qu'un baril ou Mario bouge avant que la partie commence vraiment.
    donkeyKong.setVisible(false);
    pauline.setVisible(false);
    barrelStackDisplay.setVisible(false);
    statusText.setVisible(false);
    scoreText.setVisible(false);
    changerVisibiliteDesVies(false);
    player.setVisible(false);
    player.body.enable = false;

    platforms.children.iterate(function (plateforme) {
      plateforme.body.enable = false;
    });

    ladders.children.iterate(function (ladder) {
      ladder.setVisible(false);
      ladder.body.enable = false;
    });
  }

  function afficherMenuDebut() {
    // L'accueil reste volontairement simple :
    // une image de fond et Donkey Kong anime.
    startScreenImage.setVisible(true);
    startScreenDonkeyKong.setVisible(true);
  }

  function lancerNiveauJouable() {
    // Cette fonction marque le vrai debut d'une partie jouable.
    // Elle reactive le decor, Mario, les vies, le score et le cycle des barils.
    if (!isIntroPlaying) {
      return;
    }

    isIntroPlaying = false;
    startScreenImage.setVisible(false);
    startScreenDonkeyKong.setVisible(false);
    statusText.setVisible(true);
    scoreText.setVisible(true);
    changerVisibiliteDesVies(true);
    player.setVisible(true);
    player.body.enable = true;
    player.setPosition(PLAYER_START_X, PLAYER_START_Y);
    player.setTexture("marioStand");
    player.setScale(0.45);
    roundStartTime = sceneRef.time.now;

    platforms.children.iterate(function (plateforme) {
      plateforme.body.enable = true;
    });

    ladders.children.iterate(function (ladder) {
      ladder.setVisible(true);
      ladder.body.enable = true;
    });

    donkeyKong.anims.restart();
    appliquerVitesseDeJeu();
    relancerCycleDesBarils();
  }

  function jouerSceneOuverture() {
    // Reproduction simplifiee de la scene d'ouverture :
    // Donkey Kong grimpe avec Pauline jusqu'en haut.
    var cheminOuverture = [
      { x: coordXMap(112), y: coordYMap(223), duration: 850 },
      { x: coordXMap(112), y: coordYMap(190), duration: 700 },
      { x: coordXMap(112), y: coordYMap(158), duration: 700 },
      { x: coordXMap(112), y: coordYMap(126), duration: 700 },
      { x: coordXMap(96), y: coordYMap(82), duration: 850 },
      { x: coordXMap(77), y: coordYMap(56), duration: 650 }
    ];

    introClimber = sceneRef.add.sprite(coordXMap(112), coordYMap(248), "dkClimb", 0);
    introClimber.setScale(0.5);
    introClimber.setDepth(8);
    introClimber.anims.play("dk-climb");

    function jouerEtape(index) {
      // On enchaine plusieurs tweens simples plutot qu'une seule grande trajectoire.
      // C'est plus facile a comprendre et a ajuster ensuite.
      if (index >= cheminOuverture.length) {
        introClimber.destroy();
        donkeyKong.setVisible(true);
        pauline.setVisible(true);
        barrelStackDisplay.setVisible(true);
        lancerNiveauJouable();
        return;
      }

      sceneRef.tweens.add({
        targets: introClimber,
        x: cheminOuverture[index].x,
        y: cheminOuverture[index].y,
        duration: cheminOuverture[index].duration,
        ease: "Linear",
        onComplete: function () {
          jouerEtape(index + 1);
        }
      });
    }

    sceneRef.time.delayedCall(250, function () {
      jouerEtape(0);
    });
  }

  function demarrerSequenceDebut() {
    // L'accueil lance uniquement la sequence d'ouverture.
    // Le niveau jouable commence ensuite automatiquement.
    if (!isIntroPlaying || introClimber) {
      return;
    }

    startScreenImage.setVisible(false);
    startScreenDonkeyKong.setVisible(false);
    jouerSceneOuverture();
  }

  startButtonBg.on("pointerdown", demarrerSequenceDebut);
  startButtonText.setInteractive({ useHandCursor: true });
  startButtonText.on("pointerdown", demarrerSequenceDebut);
  startScreenImage.on("pointerdown", demarrerSequenceDebut);
  this.input.keyboard.on("keydown-SPACE", demarrerSequenceDebut);
  this.input.keyboard.on("keydown-R", relancerPartie);

  masquerNiveauPourOuverture();
  afficherMenuDebut();
}

/***********************************************************************/
/** FONCTION UPDATE 
/***********************************************************************/

function update() {
  // update() gere seulement le niveau jouable.
  // Si on est sur l'accueil, un ecran de fin ou un respawn, on sort vite.
  if (isIntroPlaying) {
    return;
  }

  if (isGameOver) {
    player.setVelocityX(0);
    player.setVelocityY(0);
    return;
  }

  if (isRespawning) {
    player.setVelocityX(0);
    player.setVelocityY(0);
    return;
  }

  // overlap detecte si Mario est sur une echelle sans le bloquer.
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
    // Quand Mario grimpe, on coupe sa gravite et on n'utilise plus
    // l'animation de marche.
    player.body.allowGravity = false;
    player.setVelocityX(0);

    if (cursors.up.isDown) {
      player.setVelocityY(-CLIMB_SPEED);
      player.anims.play("mario-climb", true);
    } else if (cursors.down.isDown) {
      player.setVelocityY(CLIMB_SPEED);
      player.anims.play("mario-climb", true);
    } else {
      player.setVelocityY(0);
      player.anims.stop();
      player.setTexture("marioStand");
    }

    // On continue a mettre a jour les barils meme ici,
    // sinon leur comportement dependrait du joueur.
    mettreAJourBarils();
    return;
  }

  player.body.allowGravity = true;

  if (cursors.left.isDown) {
    player.setVelocityX(-MOVE_SPEED);
    player.setFlipX(false);
    player.anims.play("mario-walk", true);
  } else if (cursors.right.isDown) {
    player.setVelocityX(MOVE_SPEED);
    // Notion Phaser en plus du cours : setFlipX retourne le sprite
    // horizontalement sans avoir besoin d'une deuxieme image.
    player.setFlipX(true);
    player.anims.play("mario-walk", true);
  } else {
    player.setVelocityX(0);
    player.anims.stop();
    player.setTexture("marioStand");
  }

  // Le saut est limite au sol pour eviter le double saut infini.
  if (cursors.up.isDown && player.body.blocked.down) {
    player.setVelocityY(JUMP_SPEED);
  }

  mettreAJourBarils();
}

function mettreAJourBarils() {
  // Toute la logique des barils est centralisee ici.
  // Cela evite de la disperser dans plusieurs callbacks de collision.
  barrels.children.iterate(function (barrel) {
    if (!barrel) {
      return;
    }

    if (barrel.y > GAME_HEIGHT + 40 || barrel.x < -40 || barrel.x > GAME_WIDTH + 40) {
      barrel.destroy();
      return;
    }

    // On identifie la poutre courante pour savoir dans quel sens
    // le baril doit rouler.
    var poutreBaril = getBarrelBeam(barrel.x, barrel.y);

    if (!poutreBaril) {
      return;
    }

    if (barrel.body.blocked.down) {
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

      // On force l'animation tant que le baril roule,
      // puis on retourne le sprite selon la direction.
      barrel.anims.play("barrel-roll", true);
      barrel.setFlipX(poutreBaril.direction > 0);

      if (
        (poutreBaril.direction > 0 && barrel.x >= poutreBaril.xEnd - BARREL_EDGE_MARGIN) ||
        (poutreBaril.direction < 0 && barrel.x <= poutreBaril.xStart + BARREL_EDGE_MARGIN)
      ) {
        barrel.setData("isDropping", true);
        barrel.setVelocityX(poutreBaril.direction * BARREL_DROP_SPEED_X * speedMultiplier);
      } else {
        barrel.setData("isDropping", false);
        barrel.setVelocityX(poutreBaril.direction * BARREL_SPEED * speedMultiplier);
      }

      barrel.setAngularVelocity(0);
    } else if (barrel.getData("isDropping")) {
      barrel.setVelocityX(poutreBaril.direction * BARREL_DROP_SPEED_X * speedMultiplier);
    }
  });
}

function lancerBaril() {
  // Cree un nouveau baril a la main de Donkey Kong.
  // Les offsets servent a le faire partir du bon endroit visuellement.
  if (isIntroPlaying || isGameOver) {
    return;
  }

  // Le point de sortie est decale pour que le baril parte
  // de la main de Donkey Kong sur la derniere frame de lancer.
  var barrel = barrels.create(
    donkeyKong.x + BARREL_SPAWN_OFFSET_X,
    donkeyKong.y + BARREL_SPAWN_OFFSET_Y,
    "barrelLaunch"
  );

  barrel.setDisplaySize(28, 20);
  barrel.setOrigin(0.5, 1);
  barrel.setCircle(20, 12, 12);
  barrel.setBounce(0);
  barrel.setCollideWorldBounds(false);
  barrel.setData("isRolling", false);
  barrel.setData("isDropping", false);
  barrel.setVelocityX(BARREL_SPEED * speedMultiplier);
}

function getBarrelBeam(x, y) {
  // Cherche sur quelle poutre se trouve un baril.
  // On prend une marge pour rendre la detection plus stable.
  for (var i = 0; i < barrelBeams.length; i++) {
    if (
      x >= barrelBeams[i].xStart - BARREL_BEAM_MARGIN &&
      x <= barrelBeams[i].xEnd + BARREL_BEAM_MARGIN &&
      y >= barrelBeams[i].yMin - BARREL_BEAM_MARGIN &&
      y <= barrelBeams[i].yMax + BARREL_BEAM_MARGIN
    ) {
      return barrelBeams[i];
    }
  }

  return null;
}

function toucherBaril(playerSprite, barrel) {
  // Une collision baril/Mario retire une vie.
  // Si c'etait la derniere, on joue la mort puis GAME OVER.
  barrel.destroy();
  isClimbing = false;
  playerSprite.body.allowGravity = true;
  playerSprite.setVelocity(0, 0);
  statusText.setText("");
  currentLives -= 1;
  mettreAJourAffichageDesVies();

  if (currentLives <= 0) {
    isGameOver = true;
    playerSprite.body.enable = false;
    playerSprite.anims.stop();
    playerSprite.setTexture("marioDie", 0);
    playerSprite.setScale(0.72);
    playerSprite.play("mario-die");

    sceneRef.time.delayedCall(700, function () {
      afficherEcranDeFin("GAME OVER", "Mario n'a plus de vies");
    });
    return;
  }

  isRespawning = true;
  playerSprite.body.enable = false;
  playerSprite.setVisible(false);

  sceneRef.time.delayedCall(700, function () {
    isRespawning = false;
    isClimbing = false;
    playerSprite.setPosition(PLAYER_START_X, PLAYER_START_Y);
    playerSprite.setVisible(true);
    playerSprite.setTexture("marioStand");
    playerSprite.setScale(0.45);
    playerSprite.body.enable = true;
    playerSprite.body.allowGravity = true;
    playerSprite.setVelocity(0, 0);
  });
}

function atteindrePauline() {
  // Pauline ne termine plus la partie tout de suite.
  // Elle valide un tour, ajoute du score, puis augmente la difficulte.
  if (currentRound >= targetRounds) {
    ajouterScoreDeTour();
    isGameOver = true;
    player.body.enable = false;
    statusText.setText("");
    afficherEcranDeFin("YOU WIN", "5 passages chez Pauline\nScore " + formaterScore(totalScore));
    return;
  }

  ajouterScoreDeTour();
  currentRound += 1;
  speedMultiplier += 0.5;
  statusText.setText("Round " + currentRound + " - vitesse x" + speedMultiplier.toFixed(1));
  redemarrerDepuisLeDebut();
}

function afficherEcranDeFin(titre, sousTitre) {
  // Meme ecran pour victoire et defaite.
  // On fige aussi les barils pour eviter qu'ils continuent en fond.
  endScreen.setVisible(true);
  endTitleText.setText(titre);
  endTitleText.setVisible(true);
  endHintText.setText(sousTitre + "\nPress R to restart");
  endHintText.setVisible(true);

  if (barrelTimer) {
    barrelTimer.remove(false);
  }

  barrels.children.iterate(function (barrel) {
    if (!barrel) {
      return;
    }

    barrel.setVelocity(0, 0);
    barrel.body.enable = false;
  });
}

function redemarrerDepuisLeDebut() {
  // Sert a recommencer un nouveau tour sans remettre a zero toute la partie.
  // On garde les vies et le score, mais on remet Mario et les barils au debut.
  isClimbing = false;
  isRespawning = false;
  player.body.enable = true;
  player.body.allowGravity = true;
  player.setVisible(true);
  player.setVelocity(0, 0);
  player.setPosition(PLAYER_START_X, PLAYER_START_Y);
  player.setTexture("marioStand");
  player.setScale(0.45);
  roundStartTime = sceneRef.time.now;

  barrels.children.iterate(function (barrel) {
    if (!barrel) {
      return;
    }

    barrel.destroy();
  });

  appliquerVitesseDeJeu();
  relancerCycleDesBarils();
}

function appliquerVitesseDeJeu() {
  // La fonction existe pour centraliser les regles de vitesse du jeu.
  // Pour l'instant Donkey Kong reste a vitesse normale.
  donkeyKong.anims.timeScale = 1;
}

function relancerCycleDesBarils() {
  // Redemarre proprement le cycle des barils.
  // On nettoie d'abord les anciens timers pour eviter les doublons.
  if (firstBarrelTimer) {
    firstBarrelTimer.remove(false);
  }

  if (barrelTimer) {
    barrelTimer.remove(false);
  }

  firstBarrelTimer = sceneRef.time.delayedCall(FIRST_BARREL_DELAY, function () {
    lancerBaril();
    firstBarrelTimer = null;

    barrelTimer = sceneRef.time.addEvent({
      delay: BARREL_DELAY,
      loop: true,
      callback: lancerBaril
    });
  });
}

function relancerPartie() {
  // Restart complet avec la touche R :
  // vies, score, tour, vitesse et barils repartent de zero.
  isGameOver = false;
  isIntroPlaying = false;
  isRespawning = false;
  isClimbing = false;
  currentLives = 3;
  currentRound = 1;
  speedMultiplier = 1;
  totalScore = 0;
  roundStartTime = sceneRef.time.now;

  endScreen.setVisible(false);
  endTitleText.setVisible(false);
  endHintText.setVisible(false);
  startScreenImage.setVisible(false);
  startScreenDonkeyKong.setVisible(false);
  startMenuOverlay.setVisible(false);
  startButtonBg.setVisible(false);
  startButtonText.setVisible(false);

  gameplayMap.setVisible(true);
  donkeyKong.setVisible(true);
  pauline.setVisible(true);
  barrelStackDisplay.setVisible(true);
  statusText.setVisible(true);
  scoreText.setVisible(true);
  statusText.setText("");
  changerVisibiliteDesVies(true);

  platforms.children.iterate(function (plateforme) {
    plateforme.body.enable = true;
  });

  ladders.children.iterate(function (ladder) {
    ladder.setVisible(true);
    ladder.body.enable = true;
  });

  mettreAJourAffichageDesVies();
  player.setVisible(true);
  player.body.enable = true;
  player.body.allowGravity = true;
  player.setVelocity(0, 0);
  player.setPosition(PLAYER_START_X, PLAYER_START_Y);
  player.setTexture("marioStand");
  player.setScale(0.45);
  donkeyKong.anims.restart();

  if (firstBarrelTimer) {
    firstBarrelTimer.remove(false);
    firstBarrelTimer = null;
  }

  if (barrelTimer) {
    barrelTimer.remove(false);
    barrelTimer = null;
  }

  barrels.children.iterate(function (barrel) {
    if (!barrel) {
      return;
    }

    barrel.destroy();
  });

  appliquerVitesseDeJeu();
  mettreAJourAffichageDuScore();
  relancerCycleDesBarils();
}

function ajouterScoreDeTour() {
  // Score du tour :
  // (numero du tour * 100000) / temps mis en secondes
  var tempsEnSecondes = Math.max(1, Math.floor((sceneRef.time.now - roundStartTime) / 1000));
  var scoreDuTour = Math.floor((currentRound * 100000) / tempsEnSecondes);

  totalScore += scoreDuTour;
  mettreAJourAffichageDuScore();
}

function mettreAJourAffichageDuScore() {
  // Petit helper pour eviter de reecrire l'affichage partout.
  scoreText.setText(formaterScore(totalScore));
}

function formaterScore(score) {
  // Ajoute des zeros devant pour rappeler l'affichage arcade.
  var texte = String(score);

  while (texte.length < 6) {
    texte = "0" + texte;
  }

  return texte;
}

function creerAffichageDesVies(scene) {
  // Cree 3 icones fixes en haut a gauche.
  // On masque simplement les images quand Mario perd des vies.
  var startX = 165;
  var startY = 66;
  var gap = 20;

  lifeIcons = [];

  for (var i = 0; i < 3; i++) {
    var lifeIcon = scene.add.image(startX + i * gap, startY, "lifeMario");
    lifeIcon.setScale(0.35);
    lifeIcons.push(lifeIcon);
  }
}

function mettreAJourAffichageDesVies() {
  // Affiche seulement le nombre de vies restantes.
  for (var i = 0; i < lifeIcons.length; i++) {
    lifeIcons[i].setVisible(i < currentLives);
  }
}

function changerVisibiliteDesVies(estVisible) {
  // Utilise pour cacher les vies pendant l'accueil ou les ecrans speciaux.
  for (var i = 0; i < lifeIcons.length; i++) {
    lifeIcons[i].setVisible(estVisible && i < currentLives);
  }
}
