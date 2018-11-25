class MusicUtility extends Phaser.Plugins.ScenePlugin {

    constructor(scene, pluginManager) {
        super(scene, pluginManager);

        this.scene = scene;
        this.systems = scene.sys;

        if (!scene.sys.settings.isBooted) {
            scene.sys.events.once('boot', this.boot, this);
        }

        var options = {
            harmonicity: 3,
            modulationIndex: 0.1,
            detune: 10,
            oscillator: {
                type: "sine"
            },
            envelope: {
                attack: 0.01,
                decay: 0.4,
                sustain: 0.7,
                release: 1
            },
            modulation: {
                type: "square"
            },
            modulationEnvelope: {
                attack: 0.01,
                decay: 0.5,
                sustain: 0.7,
                release: 1
            }
        }
        this.synth = new Tone.PolySynth(8, Tone.FMSynth, options).toMaster();

    }

    boot() {
        var eventEmitter = this.systems.events;
        eventEmitter.on('shutdown', this.shutdown, this);
        eventEmitter.on('destroy', this.destroy, this);
    }

    shutdown() { 
        
    }

    destroy() {
        this.shutdown();
        this.scene = undefined;
    }

    init(level){
        this.level = level;
    }

    play() {
        let self = this;
        MidiConvert.load("../../assets/sounds/gameplay.mid", function (midi) {

            Tone.Transport.bpm.value = midi.header.bpm;

            Tone.Transport.loop = true;
            Tone.Transport.loopStart = 0;
            const lastNote = midi.tracks[0].notes[midi.tracks[0].notes.length-1]; //TODO check other tracks
            Tone.Transport.loopEnd = lastNote.time + lastNote.duration;
            

            var midiPart = new Tone.Part(function (time, note) {
                self.synth.triggerAttackRelease(note.name, note.duration, time, note.velocity)
            }, midi.tracks[0].notes, midi.tracks[1].notes).start();

            midiPart.probability = 1 - (self.level-1)/10; // more than that? 

            Tone.Transport.start();
        })
    }

    stop(){
        Tone.Transport.stop();
    }

    mute() {
        if(this.isMute){
            this.synth.volume.rampTo(0,1);
            this.isMute = false;
        } else {
            this.synth.volume.rampTo(-Infinity,1);
            this.isMute = true;
        }
    }
}

