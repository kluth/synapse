# Synapse Framework: Skin Layer & WebNN Integration Architecture

## Overview

This document outlines the enhancement of Synapse's biological metaphor by:
1. **Renaming the UI layer to "Skin"** - the organism's interface with the external world
2. **Integrating WebNN** - actual neural network inference for intelligent UI responses

## 1. Skin Layer Architecture

### Biological Metaphor

The **skin** is the body's largest organ and primary interface with the external environment. It:
- Detects external stimuli (touch, temperature, pressure)
- Protects internal systems
- Regulates what enters and exits
- Provides visible representation of internal state
- Adapts to environmental conditions

### Skin Layer Structure

```
Skin (Integumentary System)
├── Epidermis (Visual Layer)
│   ├── Keratinocytes (Visual Components)
│   ├── Melanocytes (Theming/Styling)
│   └── Langerhans Cells (Event Detection)
├── Dermis (Structural Layer)
│   ├── Fibroblasts (Layout/Structure)
│   ├── Blood Vessels (Data Flow)
│   └── Nerve Endings (Sensory Receptors)
└── Hypodermis (Foundation Layer)
    ├── Adipocytes (State Storage)
    └── Connective Tissue (Glial Support)
```

### Component Mapping

#### Current → New Terminology

| Current | New Skin Term | Biological Role |
|---------|---------------|-----------------|
| `VisualNeuron` | `SkinCell` | Base UI component |
| `SensoryNeuron` | `Receptor` | Input detection |
| `MotorNeuron` | `Effector` | Action execution |
| `InterneuronUI` | `DermalLayer` | Container/layout |
| `VisualAstrocyte` | `Adipocyte` | State management |
| `VisualOligodendrocyte` | `Melanocyte` | Rendering optimization |

#### New Receptor Types (Input Components)

```typescript
// Mechanoreceptors - Physical interaction
- TouchReceptor (Button, TouchArea)
- PressureReceptor (Slider, Pressure-sensitive input)
- VibrationReceptor (Haptic feedback components)

// Thermoreceptors - State indication
- WarmReceptor (Success/positive states)
- ColdReceptor (Error/negative states)

// Nociceptors - Error/warning detection
- AlertReceptor (Error messages)
- WarningReceptor (Warning messages)

// Proprioceptors - Position/layout awareness
- PositionReceptor (Drag & drop)
- OrientationReceptor (Rotation/orientation controls)

// Chemoreceptors - Data input
- TextReceptor (Text input)
- DataReceptor (Form inputs)
```

### File Structure

```
src/skin/
├── cells/              # Base skin cell components
│   ├── SkinCell.ts     # Base class (was VisualNeuron)
│   ├── Keratinocyte.ts # Visual components
│   └── Melanocyte.ts   # Styling/theming
├── receptors/          # Input components (was SensoryNeuron)
│   ├── Receptor.ts     # Base receptor class
│   ├── TouchReceptor.ts
│   ├── TextReceptor.ts
│   ├── DataReceptor.ts
│   └── AlertReceptor.ts
├── effectors/          # Action components (was MotorNeuron)
│   ├── Effector.ts     # Base effector class
│   ├── GlandEffector.ts # State-changing actions
│   └── MuscleEffector.ts # Motion/animation actions
├── dermis/             # Structural layer (was InterneuronUI)
│   ├── DermalLayer.ts
│   ├── Fibroblast.ts   # Layout structures
│   └── BloodVessel.ts  # Data flow pipes
├── support/            # Support cells (glial equivalent)
│   ├── Adipocyte.ts    # State storage (was VisualAstrocyte)
│   ├── Melanocyte.ts   # Render optimization (was VisualOligodendrocyte)
│   └── LangerhansCell.ts # Event handling/immunity
└── components/         # Concrete implementations
    ├── Button.ts       # TouchReceptor implementation
    ├── Input.ts        # TextReceptor implementation
    ├── Form.ts         # DermalLayer implementation
    └── ...
```

## 2. WebNN Integration Architecture

### Biological Metaphor Enhancement

WebNN allows us to implement **actual neural network inference** within our framework, creating "intelligent neurons" that can:
- Learn from user interactions
- Predict user intent
- Optimize UI responsiveness
- Personalize experiences
- Detect anomalies

### WebNN Neuron Types

```typescript
// ML-Powered Neurons using WebNN
├── PerceptronNeuron      # Single-layer inference
├── ConvolutionalNeuron   # Image/pattern processing
├── RecurrentNeuron       # Sequential/temporal data
├── TransformerNeuron     # Attention-based processing
└── GAN_Neuron           # Generative capabilities
```

### Integration Architecture

```
┌─────────────────────────────────────────────────┐
│           Synapse Application Layer             │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────┐         ┌─────────────────┐  │
│  │  Skin Layer  │◄────────┤  WebNN Neurons  │  │
│  │  (UI/UX)     │         │  (ML Inference) │  │
│  └──────────────┘         └─────────────────┘  │
│         ▲                         ▲             │
│         │                         │             │
│  ┌──────┴───────┐         ┌──────┴──────────┐  │
│  │   Receptors  │────────►│  MLGraphBuilder │  │
│  │   (Inputs)   │         │   (Build Graph) │  │
│  └──────────────┘         └─────────────────┘  │
│         │                         │             │
│         ▼                         ▼             │
│  ┌──────────────┐         ┌─────────────────┐  │
│  │  Effectors   │◄────────┤    MLContext    │  │
│  │  (Actions)   │         │   (Execute AI)  │  │
│  └──────────────┘         └─────────────────┘  │
│         │                         │             │
├─────────┴─────────────────────────┴─────────────┤
│         Core Neural Network (Synapse)           │
│  ┌──────────────────────────────────────────┐   │
│  │  EventBus • Plasticity • Health Monitoring│  │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### WebNN Neuron Base Class

```typescript
/**
 * Base class for WebNN-powered neurons
 * Combines Synapse's neural abstraction with WebNN inference
 */
export abstract class WebNNNeuron extends CorticalNeuron {
  protected mlContext?: MLContext;
  protected mlGraph?: MLGraph;
  protected graphBuilder?: MLGraphBuilder;
  protected isModelLoaded = false;

  constructor(id: string) {
    super(id, 'webnn-neuron');
  }

  /**
   * Initialize WebNN context
   */
  async activate(): Promise<void> {
    await super.activate();

    // Create ML context with device preferences
    this.mlContext = await navigator.ml.createContext({
      powerPreference: 'high-performance' // or 'low-power', 'default'
    });

    this.graphBuilder = new MLGraphBuilder(this.mlContext);
    await this.loadModel();
  }

  /**
   * Load and compile the neural network model
   * Override in subclasses to define network architecture
   */
  protected abstract loadModel(): Promise<void>;

  /**
   * Execute inference using WebNN
   */
  protected async infer(inputs: MLNamedTensors): Promise<MLNamedTensors> {
    if (!this.mlGraph || !this.mlContext) {
      throw new Error('WebNN model not initialized');
    }

    const outputs: MLNamedTensors = {};
    await this.mlContext.dispatch(this.mlGraph, inputs, outputs);
    return outputs;
  }

  /**
   * Process signal with ML inference
   */
  protected async executeProcessing(input: Signal): Promise<Signal> {
    // Convert signal to tensor
    const tensor = this.signalToTensor(input);

    // Run inference
    const result = await this.infer({ input: tensor });

    // Convert result back to signal
    return this.tensorToSignal(result.output);
  }

  protected abstract signalToTensor(signal: Signal): MLTensor;
  protected abstract tensorToSignal(tensor: MLTensor): Signal;
}
```

### Use Cases

#### 1. Predictive Text Input (RecurrentNeuron)

```typescript
/**
 * Smart text input that predicts next words
 */
export class PredictiveTextReceptor extends WebNNNeuron {
  protected async loadModel(): Promise<void> {
    // Build LSTM network for text prediction
    const input = this.graphBuilder!.input('input', {
      dataType: 'float32',
      dimensions: [1, 100, 128] // [batch, sequence, embedding]
    });

    const lstm = this.graphBuilder!.lstm(input, /*weight, recurrentWeight, bias*/);
    const output = this.graphBuilder!.reshape(lstm.output, [1, 100, vocab_size]);

    this.mlGraph = await this.graphBuilder!.build({ output });
  }

  // Predicts next word as user types
  async predictNext(text: string): Promise<string[]> {
    const embedding = await this.embedText(text);
    const result = await this.infer({ input: embedding });
    return this.decodeTokens(result.output);
  }
}
```

#### 2. Gesture Recognition (ConvolutionalNeuron)

```typescript
/**
 * Recognizes touch gestures and patterns
 */
export class GestureReceptor extends WebNNNeuron {
  protected async loadModel(): Promise<void> {
    const input = this.graphBuilder!.input('input', {
      dataType: 'float32',
      dimensions: [1, 28, 28, 1] // Touch heatmap
    });

    // Build CNN for gesture recognition
    let conv1 = this.graphBuilder!.conv2d(input, filter1);
    let relu1 = this.graphBuilder!.relu(conv1);
    let pool1 = this.graphBuilder!.maxPool2d(relu1);

    let conv2 = this.graphBuilder!.conv2d(pool1, filter2);
    let relu2 = this.graphBuilder!.relu(conv2);
    let pool2 = this.graphBuilder!.maxPool2d(relu2);

    let flatten = this.graphBuilder!.reshape(pool2, [1, -1]);
    let output = this.graphBuilder!.gemm(flatten, weights);

    this.mlGraph = await this.graphBuilder!.build({ output });
  }

  // Recognizes swipe, pinch, rotate gestures
  async recognizeGesture(touchPoints: TouchPoint[]): Promise<Gesture> {
    const heatmap = this.touchToHeatmap(touchPoints);
    const result = await this.infer({ input: heatmap });
    return this.decodeGesture(result.output);
  }
}
```

#### 3. Anomaly Detection (AutoencoderNeuron)

```typescript
/**
 * Detects unusual user interactions or system states
 */
export class AnomalyDetectorNeuron extends WebNNNeuron {
  protected async loadModel(): Promise<void> {
    // Autoencoder for anomaly detection
    const input = this.graphBuilder!.input('input', {
      dataType: 'float32',
      dimensions: [1, 50] // Feature vector
    });

    // Encoder
    let encoded = this.graphBuilder!.gemm(input, encoderWeights1);
    encoded = this.graphBuilder!.relu(encoded);
    encoded = this.graphBuilder!.gemm(encoded, encoderWeights2);

    // Decoder
    let decoded = this.graphBuilder!.gemm(encoded, decoderWeights1);
    decoded = this.graphBuilder!.relu(decoded);
    decoded = this.graphBuilder!.gemm(decoded, decoderWeights2);

    this.mlGraph = await this.graphBuilder!.build({
      encoded,
      reconstructed: decoded
    });
  }

  // Returns anomaly score (0-1)
  async detectAnomaly(metrics: SystemMetrics): Promise<number> {
    const features = this.metricsToFeatures(metrics);
    const result = await this.infer({ input: features });
    return this.calculateReconstructionError(features, result.reconstructed);
  }
}
```

#### 4. Personalization Engine (TransformerNeuron)

```typescript
/**
 * Learns user preferences and personalizes UI
 */
export class PersonalizationNeuron extends WebNNNeuron {
  protected async loadModel(): Promise<void> {
    // Transformer for preference learning
    const input = this.graphBuilder!.input('input', {
      dataType: 'float32',
      dimensions: [1, 512, 768] // [batch, sequence, embedding]
    });

    // Multi-head attention
    const attention = await this.buildMultiHeadAttention(input);
    const feedForward = await this.buildFeedForward(attention);

    this.mlGraph = await this.graphBuilder!.build({ output: feedForward });
  }

  // Predicts user preferences based on interaction history
  async predictPreference(history: UserInteraction[]): Promise<Preferences> {
    const embedding = this.encodeHistory(history);
    const result = await this.infer({ input: embedding });
    return this.decodePreferences(result.output);
  }
}
```

## 3. Implementation Roadmap

### Phase 1: Skin Layer Refactoring (Week 1-2)

1. **Create new file structure**
   - Set up `src/skin/` directory
   - Create base classes: `SkinCell`, `Receptor`, `Effector`, `DermalLayer`

2. **Refactor existing UI components**
   - Migrate `VisualNeuron` → `SkinCell`
   - Migrate `SensoryNeuron` → `Receptor`
   - Migrate `MotorNeuron` → `Effector`
   - Update all imports across codebase

3. **Implement new receptor types**
   - `TouchReceptor` (Button, ClickArea)
   - `TextReceptor` (Text input)
   - `DataReceptor` (Form inputs)
   - `AlertReceptor` (Notifications)

4. **Update support cells**
   - `Adipocyte` (state storage)
   - `Melanocyte` (render optimization)
   - `LangerhansCell` (event handling)

5. **Update Storybook stories**
   - Rename stories to use new terminology
   - Update documentation strings

### Phase 2: WebNN Foundation (Week 3-4)

1. **Create WebNN neuron base class**
   - `WebNNNeuron` abstract class
   - Context management
   - Tensor conversion utilities
   - Model loading infrastructure

2. **Implement simple WebNN neurons**
   - `PerceptronNeuron` - basic classification
   - `SimpleRegressionNeuron` - value prediction

3. **Add WebNN detection and fallback**
   - Check for WebNN support: `navigator.ml`
   - Graceful degradation for unsupported browsers
   - Feature detection utilities

4. **Create model loading infrastructure**
   - Model file loaders (ONNX, TFLite support)
   - Weight initialization
   - Model caching

### Phase 3: Intelligent Components (Week 5-6)

1. **Implement ML-powered receptors**
   - `PredictiveTextReceptor` with LSTM
   - `GestureReceptor` with CNN
   - `VoiceReceptor` with RNN (if WebAudio integration)

2. **Add system intelligence**
   - `AnomalyDetectorNeuron` for error detection
   - `PersonalizationNeuron` for UX adaptation
   - `PerformancePredictor` for optimization

3. **Create training infrastructure**
   - Online learning support (if WebNN supports it)
   - User feedback collection
   - Model fine-tuning

### Phase 4: Integration & Optimization (Week 7-8)

1. **Integrate Skin + WebNN**
   - Connect receptors to WebNN inference
   - Intelligent effector responses
   - Adaptive UI behavior

2. **Performance optimization**
   - Model quantization
   - Caching strategies
   - Lazy loading of models

3. **Testing & documentation**
   - Unit tests for WebNN neurons
   - Integration tests for intelligent components
   - API documentation
   - Example applications

## 4. API Examples

### Skin Layer API

```typescript
// Create a touch receptor (button)
const submitButton = new TouchReceptor('submit-btn', {
  label: 'Submit',
  sensitivity: 'high', // How sensitive to touch
  hapticFeedback: true
});

// Create a text receptor (input)
const emailInput = new TextReceptor('email', {
  placeholder: 'Enter email',
  validation: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  receptorType: 'chemoreceptor' // Receives chemical/data input
});

// Create a dermal layer (container)
const formLayer = new DermalLayer('login-form', {
  layout: 'vertical',
  bloodSupply: true, // Enable data flow
  nerveSupply: true  // Enable event propagation
});

// Add receptors to dermal layer
formLayer.addCell(emailInput);
formLayer.addCell(submitButton);

// Connect to effector
const submitEffector = new GlandEffector('submit-action', {
  secretion: 'api-call', // What action to perform
  reactionTime: 100 // ms
});

submitButton.connect(submitEffector);
```

### WebNN API

```typescript
// Create intelligent text input with prediction
const smartInput = new PredictiveTextReceptor('smart-input', {
  modelPath: '/models/text-prediction.onnx',
  predictionCount: 3,
  minConfidence: 0.7
});

await smartInput.activate();

// Listen for predictions
smartInput.on('prediction', (predictions: string[]) => {
  console.log('Next word predictions:', predictions);
});

// Create gesture-aware touch area
const gestureArea = new GestureReceptor('gesture-area', {
  modelPath: '/models/gesture-recognition.onnx',
  supportedGestures: ['swipe', 'pinch', 'rotate']
});

await gestureArea.activate();

gestureArea.on('gesture-detected', (gesture: Gesture) => {
  console.log(`Detected ${gesture.type} with confidence ${gesture.confidence}`);
});

// Create anomaly detection for health monitoring
const anomalyDetector = new AnomalyDetectorNeuron('anomaly-detector');
await anomalyDetector.activate();

setInterval(async () => {
  const metrics = collectSystemMetrics();
  const anomalyScore = await anomalyDetector.detectAnomaly(metrics);

  if (anomalyScore > 0.8) {
    console.warn('Anomaly detected! Score:', anomalyScore);
  }
}, 1000);
```

## 5. Benefits

### Skin Layer Benefits
- **Consistent biological metaphor** throughout the framework
- **Clearer separation of concerns** (UI is truly the "skin" of the application)
- **More intuitive API** for developers familiar with biology
- **Better organization** with receptor types matching real sensory receptors

### WebNN Integration Benefits
- **True neural network capabilities** in a neural-inspired framework
- **On-device ML inference** without server round-trips
- **Hardware acceleration** via GPU/NPU when available
- **Privacy-preserving** - data stays on device
- **Offline-capable** AI features
- **Cost-effective** - no server ML infrastructure needed
- **Intelligent UI** that learns and adapts
- **W3C standard** with growing browser support

## 6. Browser Support & Fallbacks

### WebNN Support Status (2025)
- Chrome/Edge: Preview support (behind flag)
- Safari: Under consideration
- Firefox: No public signals yet

### Fallback Strategy

```typescript
// Feature detection
const hasWebNN = 'ml' in navigator && 'createContext' in navigator.ml;

if (hasWebNN) {
  // Use WebNN-powered neurons
  const smartComponent = new PredictiveTextReceptor('input');
} else {
  // Fall back to traditional component
  const basicComponent = new TextReceptor('input');
}

// Or use progressive enhancement
export class SmartTextReceptor extends TextReceptor {
  private mlEnhancement?: PredictiveEngine;

  async activate(): Promise<void> {
    await super.activate();

    if ('ml' in navigator) {
      this.mlEnhancement = new PredictiveEngine();
      await this.mlEnhancement.activate();
    }
  }

  // Enhanced behavior when ML available, basic behavior otherwise
}
```

## 7. Next Steps

1. **Get user approval** for this architectural direction
2. **Choose implementation approach**:
   - Option A: Refactor Skin first, then add WebNN
   - Option B: Add WebNN first to prove concept, then refactor Skin
   - Option C: Do both in parallel (more complex)
3. **Start with Phase 1** (Skin Layer Refactoring) or proof-of-concept WebNN neuron
4. **Update test suite** to cover new components
5. **Create migration guide** for existing users

## 8. Questions to Resolve

1. Should we maintain backward compatibility with `VisualNeuron` names, or breaking change?
2. Which WebNN use case should we implement first as proof-of-concept?
3. Should we bundle pre-trained models or require users to provide them?
4. What's the minimum WebNN browser support we want to target?
5. Should Storybook showcase WebNN features (may require polyfill)?
