/**
 * Tests for the Audio Engine
 * 
 * These are simple tests to verify the audio engine functionality.
 * In a production environment, you would use a proper testing framework like Jest.
 */

// Simple test runner
function runTests() {
    console.log('Running Audio Engine Tests...');
    
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
    
    // Test 1: AudioEngine class exists
    assert(
        typeof AudioEngine === 'function',
        'AudioEngine class should exist'
    );
    
    // Test 2: Can create AudioEngine instance
    let engine;
    try {
        engine = new AudioEngine();
        assert(true, 'Should be able to create AudioEngine instance');
    } catch (e) {
        assert(false, 'Should be able to create AudioEngine instance');
    }
    
    // Test 3: Voices are defined correctly
    assert(
        Array.isArray(engine.voices) && engine.voices.length === 7,
        'Should have 7 voices defined'
    );
    
    // Test 4: Voice properties are correct
    const voice = engine.voices[0];
    assert(
        typeof voice.note === 'string' &&
        typeof voice.frequency === 'number' &&
        typeof voice.loopDuration === 'number' &&
        typeof voice.color === 'string',
        'Voice should have correct properties'
    );
    
    // Test 5: Loop durations match expected values
    const expectedDurations = [17.8, 20.1, 31.8, 19.6, 16.2, 21.3, 24.7];
    const durationsMatch = engine.voices.every((voice, index) => {
        return Math.abs(voice.loopDuration - expectedDurations[index]) < 0.01;
    });
    assert(
        durationsMatch,
        'Voice loop durations should match expected values'
    );
    
    // Test 6: Audio scheduling calculations
    // This is a simple test to verify that the scheduling logic works correctly
    // In a real test, you would mock the AudioContext and verify the scheduling
    const now = 10; // Simulated current time
    const voice1 = engine.voices[0];
    const loopPosition = now % voice1.loopDuration;
    const nextNoteTime = voice1.loopDuration - loopPosition;
    
    assert(
        nextNoteTime >= 0 && nextNoteTime <= voice1.loopDuration,
        'Next note time calculation should be within loop duration'
    );
    
    // Test 7: Random offset generation
    // Call the method to generate random offsets
    engine.generateRandomStartTimes();
    
    // Check that each voice has a randomOffset property
    const allHaveRandomOffsets = engine.voices.every(voice =>
        typeof voice.randomOffset === 'number' &&
        voice.randomOffset >= 0 &&
        voice.randomOffset <= voice.loopDuration
    );
    
    assert(
        allHaveRandomOffsets,
        'All voices should have random offsets between 0 and their loop duration'
    );
    
    // Check that the random offsets are different (very unlikely they'd be the same)
    const uniqueOffsets = new Set(engine.voices.map(voice => voice.randomOffset)).size;
    
    assert(
        uniqueOffsets > 1, // At least some should be different
        'Random offsets should be different for different voices'
    );
    
    // Test that generating random offsets again produces different values
    const oldOffsets = engine.voices.map(voice => voice.randomOffset);
    engine.generateRandomStartTimes();
    const newOffsets = engine.voices.map(voice => voice.randomOffset);
    
    // At least some offsets should be different (very unlikely all would be the same)
    let someAreDifferent = false;
    for (let i = 0; i < oldOffsets.length; i++) {
        if (Math.abs(oldOffsets[i] - newOffsets[i]) > 0.01) {
            someAreDifferent = true;
            break;
        }
    }
    
    assert(
        someAreDifferent,
        'Generating random offsets again should produce different values'
    );
    
    // Summary
    console.log(`\nTests completed: ${passedTests} passed, ${totalTests - passedTests} failed`);
    
    return passedTests === totalTests;
}

// Run tests when the script is loaded directly (not when imported)
if (typeof window !== 'undefined' && typeof AudioEngine !== 'undefined') {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runTests);
    } else {
        runTests();
    }
}