class Sing extends Phaser.Plugins.ScenePlugin {

    constructor(scene, pluginManager) {
        super(scene, pluginManager);

        this.scene = scene;
        this.systems = scene.sys;

        if (!scene.sys.settings.isBooted) {
            scene.sys.events.once('boot', this.boot, this);
        }

        this.sampleNodes = [
            {
                id:0,
                content:'C#3,0.5,G#3,0.5',
                next:[
                    {
                        id:1,
                        prob:1
                    }
                ]
            },
            {
                id:1,
                content:'G#3,1',
                next:[
                    {
                        id:1,
                        prob:2
                    },
                    {
                        id:0,
                        prob:1
                    },
                    {
                        id:2,
                        prob:1
                    }
                ]
            },
            {
                id:2,
                content:' ,1',
                next:[
                    {
                        id:0,
                        prob:1
                    },
                    {
                        id:3,
                        prob:1
                    }
                ]
            },
            {
                id:3,
                content:'A3,0.5,G3,0.5',
                next:[
                    {
                        id:4,
                        prob:1
                    }
                ]
            },
            {
                id:4,
                content:'E3,1',
                next:[
                    {
                        id:5,
                        prob:1
                    }
                ]
            },
            {
                id:5,
                content:'G3,1',
                next:[
                    {
                        id:4,
                        prob:2
                    },
                    {
                        id:3,
                        prob:1
                    },
                    {
                        id:2,
                        prob:2
                    }
                ]
            }
        ]
        
        this.state = {};
        this.state.lullaby =[];
        this.nodes;
        var crusher = new Tone.BitCrusher(8);
        this.sound = new Tone.PolySynth(6, Tone.Synth, {
			"oscillator" : {
				"partials" : [0, 2, 3, 4],
			}
		}).connect(crusher).toMaster();
        
        this.sound.volume.value = 0;
    }

    boot() {
        var eventEmitter = this.systems.events;
        eventEmitter.on('shutdown', this.shutdown, this);
        eventEmitter.on('destroy', this.destroy, this);
    }

    //  Called when a Scene shuts down, it may then come back again later
    // (which will invoke the 'start' event) but should be considered dormant.
    shutdown() {
        this.stop();
    }

    // called when a Scene is destroyed by the Scene Manager
    destroy() {
        this.shutdown();
        this.scene = undefined;
    }

    sing(){
        let t = this.playSegment(this.next());
        let self = this;
        if(this.state.singing){
            setTimeout(()=>self.sing(),t * 1000);
        }
    }

    found(){
        if(!this.theLullaby){return false;}
        if(this.theLullaby.length > this.state.lullaby.length)
            return false;
        let count =1;
        for(var i = this.theLullaby.length-1; i>-1;i--) {
            if(this.theLullaby[i] !== this.state.lullaby[this.state.lullaby.length-(count++)])
                return false;
        }

        return true;
    }

    recognized(){
        let self = this;
        return new Promise(function (resolve, reject) {
            (function waitForFound(){
                if (self.found()) return resolve();
                setTimeout(waitForFound, 0.5);
            })();
        });
    }

    playSegment(content){
        if(!content)return;
        let con = content.split(',');
        let t = 0;
        for(let i=0;i<con.length/2;i++){
            let self = this;
            setTimeout(()=> {
                self.sound.triggerAttackRelease(con[2*i], parseFloat(con[2*i+1]));
            },t*1000);
            t += parseFloat(con[2*i+1]);
        }
        return t;
    }

    init(i){
        this.nodes = i || this.sampleNodes; //TODOonly for test
        this.state.singing = true;
    }

    setTheLullaby(l){
        this.theLullaby = l;//["C#3,0.5,G#3,0.5", " ,4n", "C#3,0.5,G#3,0.5", " ,4n"];
    }
    
    reset(id){
        this.state.id = id;
        this.state.singing = true;
    }

    stop(){
        this.state.singing = false;
    }

    isSinging(){
        return this.state.singing;
    }
    
    next(id){
        if(!this.nodes){
            init();
        }
        
        if(!id){
            if(!this.state.id){
                id = Math.min(...this.nodes.map(n => n.id));
            } else {
                id = this.state.id;
            }
        }
    
        var currentNode = this.nodes.filter(n => n.id === id)[0];
    
        let self = this;
        var nextNodeIds = currentNode.next.reduce((a,c)=> {
            if(self.nodes.some(f=>(f.id === c.id) && (c.prob > 0))){
                for(var i = 0 ; i < c.prob; i++){
                    a.push(c.id);
                }
            }
            return a
        },[]);
    
        var allAvailableNodes = this.nodes.map(f=>f.id);

        var nextNodeId = nextNodeIds[Math.floor(Math.random() * nextNodeIds.length)];

        if(nextNodeId === undefined){
            nextNodeId = allAvailableNodes[Math.floor(Math.random()*allAvailableNodes.length)];
        }
        
        this.state.id = nextNodeId;

        let nextContent = this.nodes.filter(n => n.id === nextNodeId)[0].content;

        this.state.lullaby.push(nextContent);
    
        return nextContent;
    }
    
    
    
    
}