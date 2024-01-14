document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    const imageLoader = document.getElementById('imageLoader');
    const toneOutput = document.getElementById('toneOutput');
    const audioContext = new AudioContext();

    imageLoader.addEventListener('change', handleImage, false);

    function handleImage(e) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                canvas.width = img.width;
                canvas.height = img.height;
                context.drawImage(img, 0, 0);
                setTimeout(() => {
                    const colorThief = new ColorThief();
                    const dominantColors = colorThief.getPalette(canvas, 8);
                    const tones = dominantColors.map(color => colorToTone(color));
                    const uniqueTones = [...new Set(tones)];
                    toneOutput.innerText = `Arpeggio toner: ${uniqueTones.join(', ')}`;
                    playArpeggio(uniqueTones, 120, 3);
                }, 100);
            }
            img.src = event.target.result;
        }
        reader.readAsDataURL(e.target.files[0]);
    }

    function playArpeggio(tones, tempo, loopCount) {
        const totalTones = tones.length * 2 * loopCount;
        let startTime = 0;

        playTone(tones[0], 0, totalTones * (60 / tempo), -1); // Baston

        for (let i = 0; i < totalTones; i++) {
            let toneIndex = i % (tones.length * 2);
            let tone = tones[toneIndex % tones.length];
            let octaveOffset = Math.floor(toneIndex / tones.length);
            playTone(tone, startTime, 1, octaveOffset);
            startTime += (60 / tempo);
        }
    }

    function playTone(tone, startTime, duration, octaveOffset = 0) {
        const frequency = toneToFrequency(tone, octaveOffset);
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.frequency.value = frequency;
        oscillator.type = 'triangle';
        gainNode.gain.value = 0.5;

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start(audioContext.currentTime + startTime);
        oscillator.stop(audioContext.currentTime + startTime + duration);
    }

    function toneToFrequency(tone, octaveOffset = 0) {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'Bb'];
        const baseOctave = 4;
        const index = notes.indexOf(tone);
        return 440 * Math.pow(2, (index - 9) / 12 + (baseOctave - 4 + octaveOffset));
    }

    function colorToTone(rgbColor) {
        const [h, s, l] = rgbToHsl(...rgbColor);
        const tones = ["C", "G", "D", "A", "E", "B", "F#", "Db", "Ab", "Eb", "Bb", "F"];
        const toneIndex = Math.floor(h / 30) % 12;
        return tones[toneIndex];
    }


    function rgbToHsl(r, g, b) {
        r /= 255, g /= 255, b /= 255;
        let h, s, l = (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
        if (r === g && g === b) {
            h = s = 0;
        } else {
            let d = Math.max(r, g, b) - Math.min(r, g, b);
            s = l > 0.5 ? d / (2 - Math.max(r, g, b) - Math.min(r, g, b)) : d / (Math.max(r, g, b) + Math.min(r, g, b));
            switch (Math.max(r, g, b)) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return [h * 360, s * 100, l * 100];
    }
});
