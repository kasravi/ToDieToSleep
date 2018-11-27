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
        Tone.Transport.cancel();
    }

    destroy() {
        this.shutdown();
        this.scene = undefined;
    }

    init(level) {
        this.level = level;
    }

    files(name) {
        return "../../assets/sounds/" + name + ".mid"
    }

    preload(name) {
        name = name || "gameplay"
        let self = this;
        MidiConvert.load(this.files(name), function (midi) {
            self.midi = midi;
        })

    }

    FadeInOUt(){
        this.synth.volume.rampTo(-30,4);
        this.synth.volume.rampTo(0,4,10);
    }

    play() {

        Tone.Transport.bpm.value = this.midi.header.bpm;

        Tone.Transport.loop = true;
        Tone.Transport.loopStart = 0;
        this.getLength();
        Tone.Transport.loopEnd = this.midiLength;

        let self = this;
        var midiPart = new Tone.Part(function (time, note) {
            self.synth.triggerAttackRelease(note.name, note.duration, time, note.velocity)
        }, this.midi.tracks[0].notes, this.midi.tracks[1].notes).start();

        midiPart.probability = 1 - ((self.level || 1) - 1) / 10; // more than that? 

        Tone.Transport.start();
    }

    stop() {
        Tone.Transport.stop();
    }

    getLength() {
        const lastNote = this.midi.tracks[0].notes[this.midi.tracks[0].notes.length - 1]; //TODO check other tracks
        this.midiLength = (lastNote.time + lastNote.duration);
        return this.midiLength;
    }

    mute() {
        if (this.isMute) {
            this.synth.volume.rampTo(0, 1);
            this.isMute = false;
        } else {
            this.synth.volume.rampTo(-Infinity, 1);
            this.isMute = true;
        }
    }
}

