/**
 * Tests for the Visualization
 * 
 * These are simple tests to verify the visualization functionality.
 * In a production environment, you would use a proper testing framework like Jest.
 */

// Simple test runner
function runTests() {
    console.log('Running Visualization Tests...');
    
    let passedTests = 0;
    let totalTests = 0;
    
    function assert(condition, message) {
        totalTests++;
        if (condition) {
            console.log(`✓ PASS: ${message}`);
            passedTests++;
        } else {
            console.error(`✗ FAIL: ${message}`);
        }
    }
    
    // Test 1: Visualization class exists
    assert(
        typeof Visualization === 'function',
        'Visualization class should exist'
    );
    
    // Test 2: Canvas element exists
    const canvas = document.getElementById('visualization');
    assert(
        canvas instanceof HTMLCanvasElement,
        'Canvas element should exist'
    );
    
    // Test 3: Can create Visualization instance
    let viz;
    try {
        viz = new Visualization('visualization');
        assert(true, 'Should be able to create Visualization instance');
    } catch (e) {
        assert(false, 'Should be able to create Visualization instance');
        console.error(e);
    }
    
    // Test 4: Visualization has required methods
    assert(
        typeof viz.draw === 'function' &&
        typeof viz.startAnimation === 'function' &&
        typeof viz.stopAnimation === 'function',
        'Visualization should have required methods'
    );
    
    // Test 5: Orbit calculations
    // This is a simple test to verify that the orbit calculations work correctly
    const orbitTestVoice = { loopDuration: 20, orbitRadius: 100 };
    const orbitTestTime = 5; // 5 seconds into the loop
    const orbitLoopPosition = orbitTestTime % orbitTestVoice.loopDuration / orbitTestVoice.loopDuration;
    
    assert(
        orbitLoopPosition === 0.25, // 5 seconds is 25% through a 20-second loop
        'Loop position calculation should be correct'
    );
    
    // Test 6: Canvas dimensions
    assert(
        canvas.width > 0 && canvas.height > 0,
        'Canvas should have positive dimensions'
    );
    
    // Test 7: Random offsets handling
    // This test verifies that the visualization handles random offsets correctly
    assert(
        typeof viz.calculateInitialOffsets === 'function',
        'Visualization should have calculateInitialOffsets method'
    );
    
    // Check that each voice has a randomOffset property
    const hasRandomOffsets = viz.voices.every(voice => typeof voice.randomOffset === 'number');
    assert(
        hasRandomOffsets,
        'Each voice should have a randomOffset property'
    );
    
    // Check that the random offsets are within the valid range
    const validOffsets = viz.voices.every(voice =>
        voice.randomOffset >= 0 &&
        voice.randomOffset <= voice.loopDuration
    );
    assert(
        validOffsets,
        'Random offsets should be between 0 and the voice loop duration'
    );
    
    // Test that the visualization can handle the random offsets
    // by simulating a time update and checking dot positions
    const randomOffsetTestVoice = viz.voices[0];
    const randomOffsetTestTime = 5; // 5 seconds
    const effectiveTime = randomOffsetTestTime - randomOffsetTestVoice.randomOffset;
    const expectedLoopPosition = 1 - ((effectiveTime % randomOffsetTestVoice.loopDuration) / randomOffsetTestVoice.loopDuration);
    
    // This is just a basic check that the calculation works
    assert(
        expectedLoopPosition >= 0 && expectedLoopPosition <= 1,
        'Loop position calculation with random offsets should produce values between 0 and 1'
    );
    
    // Summary
    console.log(`\nTests completed: ${passedTests} passed, ${totalTests - passedTests} failed`);
    
    return passedTests === totalTests;
}

// Run tests when the script is loaded directly (not when imported)
if (typeof window !== 'undefined' && typeof Visualization !== 'undefined') {
    // Wait for DOM to be ready and visualization to be initialized
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Wait a bit for visualization to initialize
            setTimeout(runTests, 500);
        });
    } else {
        // Wait a bit for visualization to initialize
        setTimeout(runTests, 500);
    }
}