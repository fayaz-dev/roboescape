/**
 * White noise generator AudioWorkletProcessor
 */
class NoiseProcessor extends AudioWorkletProcessor {
  process(inputs, outputs) {
    const output = outputs[0];
    
    for (let channel = 0; channel < output.length; channel++) {
      const outputChannel = output[channel];
      for (let i = 0; i < outputChannel.length; i++) {
        outputChannel[i] = Math.random() * 2 - 1; // White noise: random value between -1 and 1
      }
    }
    
    // Return true to keep the processor alive
    return true;
  }
}

// Register the processor
registerProcessor('noise-processor', NoiseProcessor);
