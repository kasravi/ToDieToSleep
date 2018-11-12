var sampleNodes = [
    {
        id:0,
        content:'lala',
        next:[
            {
                id:1,
                prob:1
            }
        ]
    },
    {
        id:1,
        content:'laaaa',
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
        content:'silence',
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
        content:'yaya',
        next:[
            {
                id:3,
                prob:2
            },
            {
                id:4,
                prob:1
            }
        ]
    },
    {
        id:4,
        content:'yaaaa',
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

var state = {};
var nodes;

function init(i){
    nodes = i || sampleNodes; //TODOonly for test
}

function reset(id){
    state.id = id;
}

function next(id){
    if(!nodes){
        init();
    }
    
    if(!id){
        if(!state.id){
            id = Math.min(...nodes.map(n => n.id));
        } else {
            id = state.id;
        }
    }

    var currentNode = nodes.filter(n => n.id === id)[0];

    var nextNodeIds = currentNode.next.reduce((a,c)=> {
        for(var i = 0 ; i < c.prob; i++){
            a.push(c.id);
        }
        return a
    },[]);

    var nextNodeId = nextNodeIds[Math.floor(Math.random() * nextNodeIds.length)]

    state.id = nextNodeId;

    return nodes.filter(n => n.id === nextNodeId)[0].content;
}

var sound = new Howl({
    src: ['../assets/session.wav'],
    sprite: {
      lala: [40, 1640],
      laaaa: [2700, 1640],
      yaya: [4560, 1640],
      yaaaa: [6420, 1640],
      silence:[12000,1640]
    }
  });

sound.fade(0.0, 1.0, 100);
sound.play(next());
sound.on('end', function(){
    sound.fade(0.0, 1.0, 100);
    sound.play(next());
  });

//sound.play('laaaa')