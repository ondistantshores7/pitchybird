export class AudioManager {
    constructor(scene) {
        this.scene = scene;
        this.audioContext = null;
        this.analyserNode = null;
        this.dataArray = null;
    }

    init() {
        return navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false
        })
        .then(stream => {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyserNode = this.audioContext.createAnalyser();
            const source = this.audioContext.createMediaStreamSource(stream);
            source.connect(this.analyserNode);
            this.analyserNode.fftSize = 2048;
            this.dataArray = new Uint8Array(this.analyserNode.fftSize);
            console.log("Microphone access granted.");
        })
        .catch(err => {
            console.error('ERROR accessing microphone:', err);
            alert('Microphone access denied. Please allow microphone access to play.');
        });
    }

    autoCorrelate(buffer, sampleRate) {
        let SIZE = buffer.length;
        let sumOfSquares = 0;
        for (let i = 0; i < SIZE; i++) {
            let val = (buffer[i] - 128) / 128;
            sumOfSquares += val * val;
        }
        let rms = Math.sqrt(sumOfSquares / SIZE);
        if (rms < 0.01) {
            return -1;
        }

        let r1 = 0, r2 = SIZE - 1, threshold = 0.2;
        for (let i = 0; i < SIZE / 2; i++) {
            if (Math.abs((buffer[i] - 128) / 128) > threshold) {
                r1 = i;
                break;
            }
        }
        for (let i = 1; i < SIZE / 2; i++) {
            if (Math.abs((buffer[SIZE - i] - 128) / 128) > threshold) {
                r2 = SIZE - i;
                break;
            }
        }

        buffer = buffer.slice(r1, r2);
        SIZE = buffer.length;
        if (SIZE < 2) return -1;

        let c = new Array(SIZE).fill(0);
        for (let i = 0; i < SIZE; i++) {
            for (let j = 0; j < SIZE - i; j++) {
                c[i] = c[i] + ((buffer[j] - 128) / 128) * ((buffer[j + i] - 128) / 128);
            }
        }

        let d = 0;
        while (d < c.length - 1 && c[d] > c[d + 1]) {
            d++;
        }

        let maxval = -1, maxpos = -1;
        for (let i = d; i < SIZE; i++) {
            if (c[i] > maxval) {
                maxval = c[i];
                maxpos = i;
            }
        }

        if (maxpos === -1 || maxpos >= SIZE - 1) return -1;

        let T0 = maxpos;
        let x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
        let a = (x1 + x3 - 2 * x2) / 2;
        let b = (x3 - x1) / 2;
        if (a !== 0) {
            T0 = T0 - b / (2 * a);
        }

        if (T0 === 0) return -1;
        return sampleRate / T0;
    }

    playNote(frequency, duration = 0.5) {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, this.audioContext.currentTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration);
    }
} 