class l {
  id;
  type;
  state = "inactive";
  threshold;
  signalQueue = [];
  activationTime = null;
  errorCount = 0;
  metricsData = {
    signalsReceived: 0,
    signalsEmitted: 0,
    processedInputs: 0,
    errors: 0
  };
  constructor(t) {
    this.id = t.id, this.type = t.type, this.threshold = t.threshold, this.validateThreshold();
  }
  validateThreshold() {
    if (this.threshold < 0 || this.threshold > 1)
      throw new Error("Threshold must be between 0 and 1");
  }
  /**
   * LIFECYCLE MANAGEMENT
   */
  async activate() {
    if (this.state === "active" || this.state === "firing")
      throw new Error("Node is already active");
    return this.state = "active", this.activationTime = /* @__PURE__ */ new Date(), this.signalQueue = [], this.errorCount = 0, Promise.resolve();
  }
  async deactivate() {
    return this.state = "inactive", this.activationTime = null, this.signalQueue = [], Promise.resolve();
  }
  getStatus() {
    return this.state;
  }
  healthCheck() {
    const t = Date.now(), e = this.activationTime !== null ? t - this.activationTime.getTime() : 0;
    return {
      healthy: this.state !== "failed" && this.errorCount < 10,
      lastCheck: /* @__PURE__ */ new Date(),
      uptime: e,
      errors: this.errorCount,
      metrics: { ...this.metricsData }
    };
  }
  /**
   * DENDRITE FUNCTIONS - Receive inputs
   */
  async receive(t) {
    if (this.state !== "active" && this.state !== "firing")
      throw new Error("Node is not active");
    this.signalQueue.push(t), this.metricsData.signalsReceived = (this.metricsData.signalsReceived ?? 0) + 1, this.signalQueue.length >= 10 && await this.processSignalQueue();
  }
  listen(t) {
    const e = {
      id: t.id,
      sourceId: t.source,
      type: "excitatory",
      strength: 0.5,
      payload: t.data,
      timestamp: t.timestamp,
      metadata: { correlationId: t.correlationId }
    };
    this.signalQueue.push(e), this.metricsData.signalsReceived = (this.metricsData.signalsReceived ?? 0) + 1;
  }
  /**
   * SOMA FUNCTIONS - Process inputs
   */
  async process(t) {
    if (this.state !== "active" && this.state !== "firing")
      throw new Error("Node is not active");
    try {
      this.state = "firing", this.metricsData.processedInputs = (this.metricsData.processedInputs ?? 0) + 1;
      const e = await this.executeProcessing(t);
      return this.state = "active", {
        data: e,
        success: !0,
        metadata: t.metadata
      };
    } catch (e) {
      return this.errorCount++, this.metricsData.errors = (this.metricsData.errors ?? 0) + 1, this.state = this.errorCount > 10 ? "failed" : "active", {
        data: void 0,
        success: !1,
        error: e instanceof Error ? e : new Error("Unknown error"),
        metadata: t.metadata
      };
    }
  }
  /**
   * Template method for actual processing logic - override in subclasses
   */
  async executeProcessing(t) {
    return Promise.resolve(t.data);
  }
  integrate(t) {
    let e = 0;
    for (const i of t)
      i.type === "excitatory" ? e += i.strength : e -= i.strength;
    e = Math.max(0, e);
    const s = e >= this.threshold;
    return {
      shouldFire: s,
      threshold: this.threshold,
      accumulated: e,
      reason: s ? `Accumulated strength ${e} exceeds threshold ${this.threshold}` : `Accumulated strength ${e} below threshold ${this.threshold}`
    };
  }
  /**
   * AXON FUNCTIONS - Transmit outputs
   */
  emit(t) {
    if (this.state !== "active" && this.state !== "firing")
      throw new Error("Node is not active");
    this.metricsData.signalsEmitted = (this.metricsData.signalsEmitted ?? 0) + 1;
  }
  async transmit(t, e) {
    if (this.state !== "active" && this.state !== "firing")
      throw new Error("Node is not active");
    this.emit(e), await t.receive(e);
  }
  /**
   * INTERNAL METHODS
   */
  async processSignalQueue() {
    if (this.signalQueue.length === 0)
      return;
    if (this.integrate(this.signalQueue).shouldFire) {
      const e = {
        data: this.signalQueue.map((s) => s.payload),
        metadata: { signalCount: this.signalQueue.length }
      };
      await this.process(e);
    }
    this.signalQueue = [];
  }
}
class h {
  events = /* @__PURE__ */ new Map();
  on(t, e) {
    this.events.has(t) || this.events.set(t, /* @__PURE__ */ new Set()), this.events.get(t).add(e);
  }
  off(t, e) {
    const s = this.events.get(t);
    s && (s.delete(e), s.size === 0 && this.events.delete(t));
  }
  emit(t, ...e) {
    const s = this.events.get(t);
    s && s.forEach((i) => {
      try {
        i(...e);
      } catch (a) {
        console.error(`Error in event listener for '${t}':`, a);
      }
    });
  }
  removeAllListeners(t) {
    t ? this.events.delete(t) : this.events.clear();
  }
}
class u extends l {
  // Receptive field - component props (inputs)
  receptiveField;
  // Visual state - component's internal state
  visualState;
  // Render tracking
  renderCount = 0;
  lastRenderTime = 0;
  // Event emitter for component events
  emitter;
  constructor(t) {
    super({
      id: t.id,
      type: t.type,
      threshold: t.threshold
    }), this.receptiveField = t.props, this.visualState = t.initialState || {}, this.emitter = new h();
  }
  /**
   * Get current props (receptive field)
   */
  getProps() {
    return { ...this.receptiveField };
  }
  /**
   * Update component props
   */
  updateProps(t) {
    const e = { ...this.receptiveField, ...t };
    this.shouldUpdate(e) && (this.receptiveField = e, this.requestRender());
  }
  /**
   * Get current state
   */
  getState() {
    return { ...this.visualState };
  }
  /**
   * Update component state
   */
  setState(t) {
    const e = { ...this.visualState };
    this.visualState = { ...this.visualState, ...t }, this.emitStateSignal(e, this.visualState), this.requestRender();
  }
  /**
   * Get render count
   */
  getRenderCount() {
    return this.renderCount;
  }
  /**
   * Get last render timestamp
   */
  getLastRenderTime() {
    return this.lastRenderTime;
  }
  /**
   * Emit UI event to connected neurons
   */
  emitUIEvent(t) {
    const e = {
      id: crypto.randomUUID(),
      sourceId: this.id,
      type: "excitatory",
      strength: t.strength,
      payload: t,
      timestamp: new Date(t.timestamp)
    };
    this.emit(e), this.emitter.emit("signal", t);
  }
  /**
   * Emit state update signal
   */
  emitStateSignal(t, e) {
    const s = {
      type: "state:update",
      data: {
        path: this.id,
        value: e,
        prevValue: t
      },
      strength: 1,
      timestamp: Date.now()
    }, i = {
      id: crypto.randomUUID(),
      sourceId: this.id,
      type: "excitatory",
      strength: s.strength,
      payload: s,
      timestamp: new Date(s.timestamp)
    };
    this.emit(i), this.emitter.emit("signal", s);
  }
  /**
   * Listen to component events
   */
  on(t, e) {
    this.emitter.on(t, e);
  }
  /**
   * Remove event listener
   */
  off(t, e) {
    this.emitter.off(t, e);
  }
  /**
   * Determine if component should update
   * Override this for custom update logic (similar to React's shouldComponentUpdate)
   */
  shouldUpdate(t) {
    return JSON.stringify(t) !== JSON.stringify(this.receptiveField);
  }
  /**
   * Request a re-render (batched/debounced in real implementation)
   */
  requestRender() {
  }
  /**
   * Render the component (Axon output)
   */
  render() {
    return this.trackRender(), this.performRender();
  }
  /**
   * Track render execution
   */
  trackRender() {
    this.renderCount++, this.lastRenderTime = Date.now();
  }
  /**
   * Get refractory period for this neuron (debouncing)
   * Override to customize
   */
  getRefractoryPeriod() {
    return 16;
  }
  /**
   * Lifecycle: Component mounted
   */
  async onMount() {
  }
  /**
   * Lifecycle: Component will unmount
   */
  async onUnmount() {
  }
  /**
   * Override activate to call onMount
   */
  async activate() {
    await super.activate(), await this.onMount();
  }
  /**
   * Override deactivate to call onUnmount
   */
  async deactivate() {
    await this.onUnmount(), await super.deactivate();
  }
  /**
   * Override receive to process UI signals immediately
   * UI components need immediate feedback, not batched processing
   */
  async receive(t) {
    if (this.state !== "active" && this.state !== "firing")
      throw new Error("Node is not active");
    const e = t.payload || t;
    try {
      await this.executeProcessing({ data: e });
    } catch (s) {
      console.error(`Error processing signal in ${this.id}:`, s);
    }
  }
}
class c extends u {
  constructor(t) {
    super(t);
  }
  /**
   * Capture a DOM interaction and convert it to a neural signal
   */
  async captureInteraction(t, e, s, i = !0) {
    const a = this.toNeuralSignal(t, e, s, i), r = {
      id: crypto.randomUUID(),
      sourceId: this.id,
      type: "excitatory",
      strength: a.strength,
      payload: a,
      timestamp: new Date(a.timestamp)
    };
    await this.receive(r);
  }
  /**
   * Convert DOM event to neural signal
   */
  toNeuralSignal(t, e, s, i = !0) {
    const a = this.getSignalStrength(e);
    return {
      type: e,
      data: {
        domEvent: t,
        payload: s,
        target: this.id,
        bubbles: i
      },
      strength: a,
      timestamp: Date.now()
    };
  }
  /**
   * Determine signal strength based on event type
   * Direct interactions (click, input) have higher strength
   * Indirect interactions (hover) have lower strength
   */
  getSignalStrength(t) {
    return {
      "ui:click": 1,
      "ui:input": 0.9,
      "ui:change": 0.9,
      "ui:submit": 1,
      "ui:keydown": 0.8,
      "ui:keyup": 0.7,
      "ui:focus": 0.8,
      "ui:blur": 0.8,
      "ui:hover": 0.3,
      "ui:scroll": 0.4,
      "ui:resize": 0.5
    }[t] || 0.5;
  }
  /**
   * Handle keyboard events with special key detection
   */
  isSpecialKey(t) {
    return [
      "Enter",
      "Escape",
      "Tab",
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "Backspace",
      "Delete"
    ].includes(t);
  }
  /**
   * Get refractory period for sensory neurons (debouncing)
   * Can be overridden for custom debounce timing
   */
  getRefractoryPeriod() {
    return 16;
  }
}
class p extends c {
  performRender() {
    const t = this.getProps(), e = this.getState(), s = t.variant || "primary", i = t.size || "medium", a = t.disabled || e.disabled;
    return {
      type: "render",
      data: {
        vdom: {
          tag: "button",
          props: {
            disabled: a,
            className: `btn btn-${s} btn-${i} ${e.pressed ? "pressed" : ""} ${t.loading ? "loading" : ""}`,
            "aria-label": t.label,
            "aria-disabled": a
          },
          children: [t.loading ? "Loading..." : t.label]
        },
        styles: {
          backgroundColor: this.getBackgroundColor(s, a),
          color: this.getTextColor(s),
          padding: this.getPadding(i),
          opacity: a ? 0.6 : 1,
          cursor: a ? "not-allowed" : "pointer",
          border: "none",
          borderRadius: "4px",
          fontSize: this.getFontSize(i),
          fontWeight: "500",
          transition: "all 0.2s",
          transform: e.pressed ? "scale(0.98)" : "scale(1)"
        },
        metadata: {
          componentId: this.id,
          renderCount: this.getRenderCount(),
          lastRenderTime: Date.now()
        }
      },
      strength: 1,
      timestamp: Date.now()
    };
  }
  async executeProcessing(t) {
    const e = this.getProps(), s = this.getState();
    e.disabled || s.disabled || e.loading || (t.type === "ui:click" || t?.payload?.type === "ui:click" ? e.onClick && e.onClick(t) : t.type === "ui:mousedown" || t?.payload?.type === "ui:mousedown" ? (this.setState({ pressed: !0 }), setTimeout(() => this.setState({ pressed: !1 }), 150)) : t.type === "ui:hover" || t?.payload?.type === "ui:hover" ? this.setState({ hovered: !0 }) : (t.type === "ui:blur" || t?.payload?.type === "ui:blur") && this.setState({ hovered: !1 }));
  }
  getBackgroundColor(t, e) {
    if (e) return "#cccccc";
    const s = {
      primary: "#007bff",
      secondary: "#6c757d",
      danger: "#dc3545",
      success: "#28a745"
    };
    return s[t] || s.primary;
  }
  getTextColor(t) {
    return "#ffffff";
  }
  getPadding(t) {
    const e = {
      small: "4px 8px",
      medium: "8px 16px",
      large: "12px 24px"
    };
    return e[t] || e.medium;
  }
  getFontSize(t) {
    const e = {
      small: "12px",
      medium: "14px",
      large: "16px"
    };
    return e[t] || e.medium;
  }
}
class m extends HTMLElement {
  button = null;
  shadowRoot;
  static get observedAttributes() {
    return ["label", "variant", "size", "disabled", "loading"];
  }
  constructor() {
    super(), this.shadowRoot = this.attachShadow({ mode: "open" });
  }
  connectedCallback() {
    this.render();
  }
  disconnectedCallback() {
    this.button && this.button.deactivate();
  }
  attributeChangedCallback() {
    this.button && this.render();
  }
  async render() {
    const t = this.getAttribute("label") || "Button", e = this.getAttribute("variant") || "primary", s = this.getAttribute("size") || "medium", i = this.hasAttribute("disabled"), a = this.hasAttribute("loading");
    this.button && await this.button.deactivate(), this.button = new p({
      id: `button-${Math.random()}`,
      type: "reflex",
      threshold: 0.5,
      props: {
        label: t,
        variant: e,
        size: s,
        disabled: i,
        loading: a,
        onClick: () => {
          this.dispatchEvent(
            new CustomEvent("synapse-click", {
              bubbles: !0,
              composed: !0,
              detail: { label: t }
            })
          );
        }
      },
      initialState: {
        pressed: !1,
        hovered: !1,
        disabled: i
      }
    }), await this.button.activate();
    const r = this.button.render();
    this.renderToShadowDOM(r.data.vdom, r.data.styles);
  }
  renderToShadowDOM(t, e) {
    this.shadowRoot.innerHTML = "";
    const s = document.createElement("style");
    s.textContent = `
      :host {
        display: inline-block;
      }
      button {
        font-family: system-ui, -apple-system, sans-serif;
        cursor: pointer;
        transition: all 0.2s;
      }
      button:hover:not(:disabled) {
        filter: brightness(1.1);
      }
      button:active:not(:disabled) {
        transform: scale(0.98);
      }
    `, this.shadowRoot.appendChild(s);
    const i = document.createElement(t.tag);
    t.props && Object.entries(t.props).forEach(([a, r]) => {
      a === "className" ? i.className = r : a.startsWith("aria-") ? i.setAttribute(a, String(r)) : i[a] = r;
    }), e && Object.entries(e).forEach(([a, r]) => {
      i.style[a] = r;
    }), t.children && t.children.forEach((a) => {
      typeof a == "string" && i.appendChild(document.createTextNode(a));
    }), i.addEventListener("click", async () => {
      this.button && await this.button.receive({
        id: crypto.randomUUID(),
        sourceId: "user",
        type: "excitatory",
        strength: 1,
        payload: { type: "ui:click" },
        timestamp: /* @__PURE__ */ new Date()
      });
    }), this.shadowRoot.appendChild(i);
  }
}
customElements.get("synapse-button") || customElements.define("synapse-button", m);
class g extends c {
  performRender() {
    const t = this.getProps(), e = this.getState();
    return {
      type: "render",
      data: {
        vdom: {
          tag: "div",
          props: { className: "input-wrapper" },
          children: [
            t.label ? { tag: "label", children: [t.label] } : "",
            {
              tag: "input",
              props: {
                type: t.type || "text",
                placeholder: t.placeholder,
                value: e.value,
                disabled: t.disabled,
                className: `input ${e.focused ? "focused" : ""} ${t.error ? "error" : ""}`,
                "aria-label": t.label || t.placeholder,
                "aria-invalid": !!t.error
              }
            },
            t.error ? { tag: "span", props: { className: "error-message" }, children: [t.error] } : ""
          ]
        },
        styles: {
          borderColor: t.error ? "#dc3545" : e.focused ? "#007bff" : "#ced4da",
          outline: e.focused ? "2px solid #007bff" : "none"
        },
        metadata: {
          componentId: this.id,
          renderCount: this.getRenderCount(),
          lastRenderTime: Date.now()
        }
      },
      strength: 1,
      timestamp: Date.now()
    };
  }
  async executeProcessing(t) {
    const e = this.getProps();
    if (t.type === "ui:focus" || t?.payload?.type === "ui:focus")
      this.setState({ focused: !0 });
    else if (t.type === "ui:blur" || t?.payload?.type === "ui:blur")
      this.setState({ focused: !1 });
    else if (t.type === "ui:input" || t?.payload?.type === "ui:input") {
      const s = t?.payload?.payload?.value || t?.data?.payload?.value || "";
      this.setState({ value: s }), e.onChange(s);
    }
  }
}
class y extends HTMLElement {
  input = null;
  shadowRoot;
  static get observedAttributes() {
    return ["type", "placeholder", "value", "disabled", "label", "error"];
  }
  constructor() {
    super(), this.shadowRoot = this.attachShadow({ mode: "open" });
  }
  connectedCallback() {
    this.render();
  }
  disconnectedCallback() {
    this.input && this.input.deactivate();
  }
  attributeChangedCallback() {
    this.input && this.render();
  }
  async render() {
    const t = this.getAttribute("type") || "text", e = this.getAttribute("placeholder") || "", s = this.getAttribute("value") || "", i = this.hasAttribute("disabled"), a = this.getAttribute("label") || "", r = this.getAttribute("error") || "";
    this.input && await this.input.deactivate(), this.input = new g({
      id: `input-${Math.random()}`,
      type: "reflex",
      threshold: 0.3,
      props: {
        type: t,
        placeholder: e,
        value: s,
        disabled: i,
        label: a,
        error: r,
        onChange: (d) => {
          this.setAttribute("value", d), this.dispatchEvent(
            new CustomEvent("synapse-change", {
              bubbles: !0,
              composed: !0,
              detail: { value: d }
            })
          );
        }
      },
      initialState: {
        focused: !1,
        value: s,
        hasError: !!r
      }
    }), await this.input.activate();
    const o = this.input.render();
    this.renderToShadowDOM(o.data.vdom, o.data.styles);
  }
  renderToShadowDOM(t, e) {
    this.shadowRoot.innerHTML = "";
    const s = document.createElement("style");
    s.textContent = `
      :host {
        display: block;
      }
      .input-wrapper {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      label {
        font-size: 14px;
        font-weight: 500;
        color: #333;
      }
      input {
        padding: 8px 12px;
        border: 1px solid #ced4da;
        border-radius: 4px;
        font-size: 14px;
        font-family: system-ui;
        transition: all 0.2s;
      }
      input:focus {
        outline: none;
        border-color: #007bff;
        box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
      }
      input.error {
        border-color: #dc3545;
      }
      .error-message {
        font-size: 12px;
        color: #dc3545;
      }
    `, this.shadowRoot.appendChild(s), this.renderVNode(t, this.shadowRoot);
  }
  renderVNode(t, e) {
    if (typeof t == "string") {
      t.trim() && e.appendChild(document.createTextNode(t));
      return;
    }
    const s = document.createElement(t.tag);
    t.props && Object.entries(t.props).forEach(([i, a]) => {
      i === "className" ? s.className = a : i.startsWith("aria-") ? s.setAttribute(i, String(a)) : i === "value" && t.tag === "input" ? s.value = String(a) : s[i] = a;
    }), t.tag === "input" && (s.addEventListener("input", async (i) => {
      const a = i.target.value;
      this.input && await this.input.receive({
        id: crypto.randomUUID(),
        sourceId: "user",
        type: "excitatory",
        strength: 0.9,
        payload: {
          type: "ui:input",
          data: { payload: { value: a } }
        },
        timestamp: /* @__PURE__ */ new Date()
      });
    }), s.addEventListener("focus", async () => {
      this.input && await this.input.receive({
        id: crypto.randomUUID(),
        sourceId: "user",
        type: "excitatory",
        strength: 0.8,
        payload: { type: "ui:focus" },
        timestamp: /* @__PURE__ */ new Date()
      });
    }), s.addEventListener("blur", async () => {
      this.input && await this.input.receive({
        id: crypto.randomUUID(),
        sourceId: "user",
        type: "excitatory",
        strength: 0.8,
        payload: { type: "ui:blur" },
        timestamp: /* @__PURE__ */ new Date()
      });
    })), t.children && t.children.forEach((i) => {
      this.renderVNode(i, s);
    }), e.appendChild(s);
  }
}
customElements.get("synapse-input") || customElements.define("synapse-input", y);
export {
  m as SynapseButton,
  y as SynapseInput
};
