# Reverb Impulse Response Directory

This directory is intended for reverb impulse response files that can be used by the application to create realistic spatial effects.

## Impulse Responses

Impulse responses (IRs) are audio files that capture the acoustic characteristics of physical spaces. When used with a convolution reverb, they can make sounds appear as if they were played in those spaces.

## Recommended Impulse Responses

For Brian Eno's "2/1", consider using impulse responses with:

1. **Long decay times** - To create the spacious, ambient feel of the original piece
2. **Large spaces** - Cathedral, concert hall, or large room IRs
3. **Smooth tails** - Avoid IRs with strong early reflections or flutter echoes

## Current Implementation

The current implementation generates a synthetic impulse response programmatically. To use real impulse responses instead:

1. Place your .wav files in this directory
2. Update the `setupReverb()` method in `audio-engine.js` to load these files
3. Adjust the convolution reverb settings as needed

## Recommended Resources

- [OpenAIR](https://www.openair.hosted.york.ac.uk/) - The Open Acoustic Impulse Response Library
- [Voxengo Impulse Responses](https://www.voxengo.com/impulses/) - Free impulse responses
- [Fokke van Saane](https://www.fokkie.home.xs4all.nl/IR.htm) - Free impulse responses for various spaces