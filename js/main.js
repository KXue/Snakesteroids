var GameState = {
    init: function(){
        
        this.scale.pageAlignHorizontally = true;
        this.scale.pageAlignVertically = true;
    },
    preload: function() {
        
        this.load.image('ship', 'assets/ship.png');
        this.load.image('ring', 'assets/ring.png');
    },
    create: function() {
        
        this.game.renderer.clearBeforeRender = false;
        this.game.renderer.roundPixels = true;
        this.gameOverState = false;
        
        this.physics.startSystem(Phaser.Physics.ARCADE);
        
        this.time.desiredFps = 30;
        
        this.cursors = this.input.keyboard.createCursorKeys();

        this.shipSprite = this.add.sprite(175, 20, 'ship');
        this.shipSprite.scale.setTo(0.6, 0.6);
        this.shipSprite.anchor.set(0.5);
        this.physics.enable(this.shipSprite, Phaser.Physics.ARCADE);
        this.shipSprite.body.drag.set(100);
        this.shipSprite.body.maxVelocity.set(200);
        this.shipSprite.trailQueueX = new Queue();
        this.shipSprite.trailQueueY = new Queue();
        
        this.spawnRing();
        
        this.shipSprite.directionQueue = new Queue();
        
        this.trailGroup = this.add.physicsGroup(Phaser.Physics.ARCADE);
        
        this.trailNumber = 1;
        this.lastShip = this.shipSprite;
        
        this.trailLoop = this.time.events.loop(Phaser.Timer.SECOND/48.0, this.updateTrail, this);
        
        this.textArray = [];
    },
    update: function() {
        
        if(this.cursors.up.isDown)
        {
            this.physics.arcade.accelerationFromRotation(this.shipSprite.rotation, 500, this.shipSprite.body.acceleration);
        }
        else
        {
            if(this.shipSprite.body.speed < 50)
            {
                this.physics.arcade.accelerationFromRotation(this.shipSprite.rotation, 500, this.shipSprite.body.acceleration);
            }
            else
            {
                this.shipSprite.body.acceleration.set(0);
            }
        }
        
        if (this.cursors.left.isDown)
        {
            this.shipSprite.body.angularVelocity = -250;
        }
        else if (this.cursors.right.isDown)
        {
            this.shipSprite.body.angularVelocity = 250;
        }
        else
        {
            this.shipSprite.body.angularVelocity = 0;
        }
        this.screenWrap(this.shipSprite);
        
        this.physics.arcade.overlap(this.shipSprite, this.ringSprite, this.eatHandler, null, this);
        this.physics.arcade.overlap(this.shipSprite, this.trailGroup, this.gameOverHandler, null, this);

        if(this.gameOverState && this.physics.arcade.isPaused && this.input.keyboard.isDown(Phaser.KeyCode.R))
        {
            this.game.state.start('GameState');
        }
    },
    
    gameOverHandler: function()
    {
        if(!this.gameOverState)
        {
            var style = { font: "bold 32px Arial", fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle" };
            var gameOverText = this.add.text(0, this.stage.height/2.0, "Game Over\n(Press \"r\" to restart)", style);
            gameOverText.anchor.set(0, 0.5);
            this.gameOverState = true;
            this.physics.arcade.isPaused = true;
        }
    },
        
    eatHandler: function()
    {
        this.spawnRing();
        this.trailNumber++;
        this.lastShip.trailQueueX = new Queue();
        this.lastShip.trailQueueY = new Queue();
        this.lastShip.directionQueue = new Queue();
    },
    
    screenWrap: function(sprite)
    {
    
        if (sprite.x < 0)
        {
            sprite.x = this.game.width;
        }
        else if (sprite.x > this.game.width)
        {
            sprite.x = 0;
        }

        if (sprite.y < 0)
        {
            sprite.y = this.game.height;
        }
        else if (sprite.y > this.game.height)
        {
            sprite.y = 0;
        }
    },
    
    addTrailSprite: function(lastSprite)
    {
        var trailSprite
        
        trailSprite = this.trailGroup.create(lastSprite.trailQueueX.peek(), lastSprite.trailQueueY.peek(), 'ship');
        
        trailSprite.rotation = lastSprite.directionQueue.peek();
        lastSprite.nextSprite = trailSprite;
        trailSprite.tint = 0xff0000;
        trailSprite.anchor.setTo(0.5);
        trailSprite.scale.setTo(0.6, 0.6);
        trailSprite.body.setSize(40, 40, 4, 4);
        console.log(trailSprite.body.width);
        trailSprite.trailQueueX = new Queue();
        trailSprite.trailQueueY = new Queue();
        trailSprite.directionQueue = new Queue();
        this.lastShip = trailSprite;
    },
    
    updateTrailQueue: function(sprite)
    {
        sprite.trailQueueX.enqueue(sprite.position.x);
        sprite.trailQueueY.enqueue(sprite.position.y);
        
        sprite.directionQueue.enqueue(sprite.rotation);
        
        if(sprite.trailQueueX.getLength() > 45)
        {
            sprite.trailQueueX.dequeue();
        }
        if(sprite.trailQueueY.getLength() > 45)
        {
            sprite.trailQueueY.dequeue();
        }
        if(sprite.directionQueue.getLength() > 45)
        {
            sprite.directionQueue.dequeue();
        }
    },
    
    updateTrail: function(spriteGroup)
    {
        var firstSprite = this.shipSprite;
        
        while(firstSprite)
        {
            //if(this.trailNumber > 0)
            //{
                this.updateTrailQueue(firstSprite);
            //}
            
            if('nextSprite' in firstSprite)
            {
                firstSprite.nextSprite.position.x = firstSprite.trailQueueX.peek();
                
                firstSprite.nextSprite.position.y = firstSprite.trailQueueY.peek();
            
                firstSprite.nextSprite.rotation = firstSprite.directionQueue.peek();

            }
            firstSprite = firstSprite.nextSprite;
        }
        
        if(this.lastShip.directionQueue.getLength() >= 45 && this.trailNumber > 0)
        {
            this.addTrailSprite(this.lastShip);
            this.trailNumber--;
        }
    },
    
    spawnRing: function()
    {
        var playerPosition = this.shipSprite.position;
        var randomQuad = this.rnd.between(1,3);
        
        var ringx;
        var ringy;
        
        var wmin = 50;
        var wmax = 750;
        
        var hmin = 50;
        var hmax = 400;
        
        var wavg = (wmin + wmax)/2.0;
        var havg = (hmin + hmax)/2.0;
        
        if(randomQuad != 1)
        {
            if(playerPosition.x < wavg){
                ringx = this.rnd.between(wavg, wmax);
            }
            else{
                ringx = this.rnd.between(wmin, wavg);
            }
            ringy = this.rnd.between(hmin, hmax);
        }
        else
        {
            if(playerPosition.x < wavg){
                ringx = this.rnd.between(wmin, wavg);
            }
            else{
                ringx = this.rnd.between(wmin, wavg);
            }
            
            if(playerPosition.y < havg){
                ringy = this.rnd.between(havg, hmax);
            }
            else
            {
                ringy = this.rnd.between(hmin, havg);
            }
        }
        if(this.ringSprite == null || !this.ringSprite.exists)
        {
            this.ringSprite = this.add.sprite(ringx, ringy, 'ring');
            this.ringSprite.anchor.set(0.5);
            this.physics.enable(this.ringSprite, Phaser.Physics.ARCADE);
        }
        else
        {
            this.ringSprite.position = new Phaser.Point(ringx, ringy);
        }
    },
    
    render:function()
    {
        //this.game.debug.body(this.shipSprite);
        //this.trailGroup.forEach(function(item){
        //    this.game.debug.body(item);
        //});
    }
};
var game = new Phaser.Game(800, 450, Phaser.AUTO);
game.state.add('GameState', GameState);
game.state.start('GameState');