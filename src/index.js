// chargement des librairies

var player;
var platforms;
var cursors;

/***********************************************************************/
/** CONFIGURATION GLOBALE DU JEU ET LANCEMENT 
/***********************************************************************/

// configuration générale du jeu
var config = {
  type: Phaser.AUTO,
  width: 800, // largeur en pixels
  height: 600, // hauteur en pixels
  physics: {
    // définition des parametres physiques
    default: "arcade", // mode arcade : le plus simple : des rectangles pour gérer les collisions. Pas de pentes
    arcade: {
      // parametres du mode arcade
      gravity: {
        y: 300 // gravité verticale : acceleration ddes corps en pixels par seconde
      },
      debug: true // permet de voir les hitbox et les vecteurs d'acceleration quand mis à true
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
  this.load.image("niveau1", "src/asset/map-base.png");

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
  // Garde un fond noir proche du rendu arcade pendant le développement.
  this.cameras.main.setBackgroundColor("#000000");

  // Notion Phaser en plus du cours : on garde le ratio du sprite et on le centre
  // pour éviter de déformer la vraie map.
  var fond = this.add.image(400, 300, "niveau1");
  var echelle = Math.min(800 / fond.width, 600 / fond.height);

  fond.setScale(echelle);

  // Les collisions sont posees a la main avec des rectangles invisibles
  // pour rester simples a comprendre et a regler.
  platforms = this.physics.add.staticGroup();

  function ajouterPlateforme(scene, x, y, largeur, hauteur) {
    var plateforme = scene.add.rectangle(x, y, largeur, hauteur, 0xff0000, 0);

    scene.physics.add.existing(plateforme, true);
    platforms.add(plateforme);
  }

  ajouterPlateforme(this, 400, 574, 525, 20);
  ajouterPlateforme(this, 381, 497, 487, 20);
  ajouterPlateforme(this, 419, 420, 487, 20);
  ajouterPlateforme(this, 381, 342, 487, 20);
  ajouterPlateforme(this, 419, 264, 487, 20);
  ajouterPlateforme(this, 381, 206, 487, 20);
  ajouterPlateforme(this, 400, 140, 111, 20
  );

  // Cree Mario avec la physique Arcade, sans mouvement pour ce sous-jalon.
  player = this.physics.add.sprite(180, 548, "mario", 0);
  player.setScale(0.45);
  // Notion Phaser en plus du cours : setOrigin permet ici d'aligner le bas
  // du sprite avec le haut de la plateforme.
  player.setOrigin(0.5, 1);
  // Notion Phaser en plus du cours : on ajuste la hitbox pour qu'elle colle
  // mieux au petit sprite redimensionne.
  player.body.setSize(26, 24);
  player.body.setOffset(13, 47);
  player.setCollideWorldBounds(true);

  // Empeche Mario de traverser les poutres du niveau.
  this.physics.add.collider(player, platforms);

  // Cree les controles clavier pour le deplacement horizontal.
  cursors = this.input.keyboard.createCursorKeys();
}

/***********************************************************************/
/** FONCTION UPDATE 
/***********************************************************************/

function update() {
  if (cursors.left.isDown) {
    player.setVelocityX(-160);
    player.setFlipX(false);
  } else if (cursors.right.isDown) {
    player.setVelocityX(160);
    // Notion Phaser en plus du cours : setFlipX retourne le sprite
    // horizontalement sans avoir besoin d'une deuxieme image.
    player.setFlipX(true);
  } else {
    player.setVelocityX(0);
  }

  // Le saut reste volontairement simple : Mario saute seulement s'il est pose
  // sur une plateforme, ce qui evite le double saut infini.
  if (cursors.up.isDown && player.body.blocked.down) {
    player.setVelocityY(-260);
  }
}
