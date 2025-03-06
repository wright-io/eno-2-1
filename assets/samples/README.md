# Piano Samples Directory

This directory is intended for piano sample files that can be used by the application.

## Recommended Samples

For a high-quality implementation, consider adding piano samples such as:

1. **Electric piano sample** - A high-quality electric piano sample with a clean, sustained tone
2. **Multiple velocity layers** - Different samples for different note velocities
3. **Multiple note samples** - Different samples for different pitches

## Current Implementation

The current implementation generates piano-like tones programmatically using the Web Audio API's oscillators and envelopes. To use real samples instead:

1. Place your .mp3 or .wav files in this directory
2. Update the `loadPianoSample()` method in `audio-engine.js` to load these files
3. Adjust the playback mechanism to use the loaded samples

## Recommended Resources

- [Salamander Piano](https://freepats.zenvoid.org/Piano/acoustic-grand-piano.html) - Free, high-quality sampled grand piano
- [PianoBook](https://www.pianobook.co.uk/) - Collection of free, high-quality piano samples
- [Virtual Playing Orchestra](http://virtualplaying.com/) - Free orchestral samples including piano