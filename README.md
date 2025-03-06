# Brian Eno's "2/1" Web Recreation

*__NOTE:__ This entire project was created using [Roo Code](https://github.com/RooVetGit/Roo-Code) with me acting mostly as artistic director and doing almost zero coding. The work is derivative: of course the composition closely follows Eno's masterpiece, and the orbit visualization is inspired by a beautiful explanation of the Eno piece that I saw online before, but can no longer find.*

A minimal web application that recreates Brian Eno's piece "2/1" from Music for Airports (1978) with accurate musical timing and a visual representation of the looping voices.

## Overview

This project recreates Brian Eno's ambient masterpiece "2/1" from the album "Music for Airports" as a web application. The recreation features:

- **Accurate Musical Recreation**: Uses the exact 7 notes and precise loop durations from the original piece
- **Audio Implementation**: Electric piano sounds with spacious reverb using the Web Audio API
- **Visual Representation**: Each voice is represented as a dot orbiting on a concentric circle, with a fixed playhead line
- **Minimal Controls**: Simple play/pause functionality

## Musical Details

The piece "2/1" consists of 7 vocal loops with the following notes and durations:

1. High A♭ - 17.8 second loop
2. C - 20.1 second loop
3. D♭ - 31.8 second loop
4. High F - 19.6 second loop
5. E♭ - 16.2 second loop
6. Low A♭ - 21.3 second loop
7. Low F - 24.7 second loop

## Running Locally

To run the application locally:

1. Clone this repository:
   ```
   git clone https://github.com/wright-io/eno-2-1.git
   cd eno-2-1
   ```

2. Start a local server:

   Using Python:
   ```
   python -m http.server 8000
   ```

   Or using Node.js:
   ```
   npx serve
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:8000
   ```

## Running Tests

This project includes both unit tests and interactive component tests:

### Unit Tests

To run the automated unit tests:

1. Start a local server as described above
2. Open your browser and navigate to:
   ```
   http://localhost:8000/tests/run-unit-tests.html
   ```
3. Click the "Run Audio Engine Tests" or "Run Visualization Tests" buttons to execute the tests
4. Test results will be displayed in the corresponding output area

You can also run the tests directly from the GitHub Pages deployment:
```
https://wright-io.github.io/eno-2-1/tests/run-unit-tests.html
```

### Interactive Component Tests

For manual testing of individual components:

1. Audio Test: `http://localhost:8000/tests/audio-test.html`
2. Visualization Test: `http://localhost:8000/tests/visualization-test.html`

These interactive tests allow you to manually verify the behavior of each component in isolation.

## Deployment

### Live Demo

Visit the live demo at: [https://wright-io.github.io/eno-2-1/](https://wright-io.github.io/eno-2-1/)

### Deploying to GitHub Pages

The project is set up to automatically deploy to GitHub Pages when changes are pushed to the main branch.

1. The GitHub Actions workflow in `.github/workflows/deploy.yml` handles the deployment process.
2. After pushing changes to the main branch, the site will be automatically deployed to GitHub Pages.
3. You can check the status of the deployment in the "Actions" tab of your GitHub repository.

### Alternative: Deploying to Vercel

If you prefer to use Vercel:

1. Install the Vercel CLI:
   ```
   npm install -g vercel
   ```

2. Login to Vercel:
   ```
   vercel login
   ```

3. Deploy the project:
   ```
   vercel
   ```

4. Deploy to production:
   ```
   vercel --prod
   ```

## Technical Implementation

### Audio Engine

The audio engine uses the Web Audio API to:

- Create and play piano-like tones for each voice
- Apply reverb using a ConvolverNode
- Schedule notes with precise timing using the Web Audio API's timing system

### Visualization

The visualization uses HTML5 Canvas to:

- Draw concentric circles representing each voice's loop
- Animate dots along these circles based on the current playback time
- Display a fixed playhead line that dots cross when their notes trigger

### Project Structure

```
/ (root)
├─ index.html           # Main HTML file
├─ styles/
│   └─ main.css         # CSS styles
├─ scripts/
│   ├─ main.js          # Application entry point
│   ├─ audio-engine.js  # Audio processing and scheduling
│   ├─ visualization.js # Canvas visualization
│   └─ ui-controls.js   # User interface controls
└─ README.md            # This documentation
```

## Browser Compatibility

This application works best in modern browsers that support the Web Audio API, including:

- Chrome 14+
- Firefox 23+
- Safari 6+
- Edge 12+

### Mobile Device Support

The application includes special handling for mobile devices:

- **Screen Lock Prevention**: The app uses NoSleep.js to prevent the screen from locking on mobile devices, allowing the music to continue playing even when the screen would normally turn off. This is particularly important for iOS devices, which would otherwise stop audio playback when the screen locks.

## Debugging

If you encounter issues with audio playback or visualization, you can use the following test files to isolate and debug problems:

### Audio Test

The audio test file allows you to test the Web Audio API functionality in isolation:

```
http://localhost:8000/tests/audio-test.html
```

This test page provides:
- Audio context initialization
- Test tone playback
- Individual note playback
- Detailed logging of audio events

### Visualization Test

The visualization test file allows you to test the canvas animation in isolation:

```
http://localhost:8000/tests/visualization-test.html
```

This test page provides:
- Canvas visualization without audio dependencies
- Animation start/stop controls
- FPS monitoring
- Detailed logging of animation events

These test files can help identify whether issues are related to audio, visualization, or their integration.

## Credits

- Original Music: Brian Eno, "2/1" from Music for Airports (1978)
- Implementation: Doug Wright (wright-io)

## License

MIT License

Copyright (c) 2025 Doug Wright

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Acknowledgments

- Brian Eno for the original composition
- The Web Audio API for enabling precise audio scheduling
- [Any other acknowledgments]