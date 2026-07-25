/* ═══════════════════════════════════════════════════════════
   ANDINO STUDIO — Application Logic
   Agent management, chat simulation, phase transitions
   ═══════════════════════════════════════════════════════════ */

const ANDINO = (() => {
	/* ── State ──────────────────────────────────────────── */
	const state = {
		currentPhase: "explore",
		currentAgent: 0,
		agents: [
			{
				id: 0,
				name: "Nova",
				type: "design",
				status: "busy",
				task: "Evolving morphology for tunnel inspection",
				progress: 67,
			},
			{
				id: 1,
				name: "Pulse",
				type: "simulate",
				status: "busy",
				task: "Running CFD on wing profile v3",
				progress: 34,
			},
			{
				id: 2,
				name: "Forge",
				type: "build",
				status: "idle",
				task: "Waiting for design approval",
				progress: 0,
			},
			{
				id: 3,
				name: "Horizon",
				type: "explore",
				status: "success",
				task: "Survey complete — 12 tunnel types found",
				progress: 100,
			},
		],
		phases: [
			"explore",
			"propose",
			"spec",
			"design",
			"simulate",
			"build",
			"fly",
			"verify",
			"archive",
		],
		metrics: {
			payload: { value: 2.4, unit: "kg", trend: "up" },
			endurance: { value: 38, unit: "min", trend: "up" },
			twr: { value: 1.8, unit: "", trend: "up" },
			cost: { value: 1240, unit: "USD", trend: "down" },
			altitude: { value: 120, unit: "m", trend: "up" },
		},
		sidebarTab: "skills",
		messages: [],
		chatOpen: true,
		missionStarted: false,
	};

	/* ── Canned Chat Responses ──────────────────────────── */
	const responses = [
		{
			steps: [
				"Analyzing mission requirements: tunnel inspection drone with 500m range, 15min flight time, obstacle avoidance.",
				"Searching morphology database for tunnel-optimized configurations...",
				"Found 3 candidates: X4 compact, Y6 coaxial, and H-frame with ducted fans.",
				"Running trade studies on each configuration against your constraints.",
			],
			final:
				"I recommend the **Y6 coaxial configuration**. It provides the best thrust-to-weight ratio for confined spaces while offering redundancy. The smaller footprint vs an X8 makes it ideal for tunnel diameters under 2m. Want me to proceed to the design phase?",
		},
		{
			steps: [
				"Evaluating Y6 coaxial vs X4 compact tradeoffs for tunnel inspection.",
				"The Y6 gives you 50% more thrust redundancy at the cost of 12% more drag.",
				"For tunnel environments with potential debris strikes, redundancy is critical.",
				"Calculating optimal arm angles for 1.8m diameter tunnel clearance.",
			],
			final:
				"For a **1.8m diameter tunnel**, I recommend a **38° arm angle** with **9-inch propellers**. This yields:\n- Max clearance: 0.4m on each side\n- Thrust-to-weight: 2.1:1\n- Estimated endurance: 22 min with payload\n\nWould you like to see the CAD model?",
		},
		{
			steps: [
				"Simulating Y6 configuration in tunnel environment with varying airflow.",
				"Detected vortex ring state risk in high-turbulence sections near ventilation shafts.",
				"Adjusting motor mixing algorithm to compensate for asymmetric thrust in crosswinds.",
				"Running Monte Carlo simulation across 10,000 tunnel profiles...",
			],
			final:
				"✅ **Simulation complete.** The Y6 passes all safety margins with:\n- 99.7% stability in turbulent zones\n- 18% vortex ring state margin (above 15% threshold)\n- 32 min average mission time\n\n**Recommended action:** Proceed to build phase. All critical parameters validated.",
		},
	];

	const _designSuggestions = [
		"Try increasing arm angle to 42° for better stability in crosswinds.",
		"Consider 10-inch props — they improve hover efficiency by 15% in this weight class.",
		"A 4S 2200mAh battery would give you 8% more endurance with only 3% weight penalty.",
		"Ducted fans could reduce noise by 60% but add 22% drag — tradeoff for urban operations.",
		"Moving the payload mount 12mm forward improves CG balance by 8%.",
	];

	const _telemetryData = {
		altitude: 45.2,
		speed: 12.8,
		battery: 78,
		gps: 4,
		voltage: 15.6,
		current: 8.2,
		temp: 38.4,
		rssi: -62,
	};

	/* ── DOM Refs ────────────────────────────────────────── */
	const _els = {};

	function _init(el, selector) {
		if (typeof selector === "string") {
			return el ? el.querySelector(selector) : null;
		}
		return null;
	}

	/* ── Rendering ───────────────────────────────────────── */

	function renderAgentList() {
		const list = document.getElementById("agent-list");
		if (!list) return;
		list.innerHTML = state.agents
			.map(
				(a, i) => `
      <div class="agent-item ${i === state.currentAgent ? "active" : ""}" data-agent="${i}">
        <div class="agent-item-header">
          <div class="agent-item-left">
            <span class="agent-status-dot ${a.status}"></span>
            <span class="agent-name">${a.name}</span>
            <span class="agent-type-badge">${a.type}</span>
          </div>
        </div>
        <div class="agent-task">${a.task}</div>
        ${
					a.status !== "idle"
						? `
        <div class="agent-progress">
          <div class="progress-bar">
            <div class="progress-bar-fill" style="width:${a.progress}%"></div>
          </div>
          <div class="progress-label">
            <span>${a.progress}%</span>
          </div>
        </div>`
						: ""
				}
      </div>
    `,
			)
			.join("");

		list.querySelectorAll(".agent-item").forEach((item) => {
			item.addEventListener("click", () => {
				const idx = parseInt(item.dataset.agent, 10);
				focusAgent(idx);
			});
		});
	}

	function renderMetrics() {
		const strip = document.getElementById("metrics-strip");
		if (!strip) return;
		strip.innerHTML = Object.entries(state.metrics)
			.map(
				([k, m]) => `
      <div class="metric-card">
        <div class="metric-label">${k}</div>
        <div class="metric-value ${m.trend === "up" && k !== "cost" ? "secondary" : m.trend === "down" && k === "cost" ? "secondary" : ""}">
          ${m.value}<span class="metric-unit">${m.unit}</span>
        </div>
        <div class="metric-trend ${m.trend}">${m.trend === "up" ? "↑" : "↓"} ${m.trend}</div>
      </div>
    `,
			)
			.join("");
	}

	function renderPhases() {
		const header = document.getElementById("phase-header");
		if (!header) return;
		const idx = state.phases.indexOf(state.currentPhase);
		header.innerHTML = state.phases
			.map(
				(p, i) => `
      ${i > 0 ? '<span class="phase-connector"></span>' : ""}
      <span class="phase-step ${i < idx ? "passed" : i === idx ? "active" : ""}">
        <span class="step-icon">${i < idx ? "✓" : i === idx ? "●" : "○"}</span>
        ${p.charAt(0).toUpperCase() + p.slice(1)}
      </span>
    `,
			)
			.join("");
	}

	function renderChat() {
		const container = document.getElementById("chat-messages");
		if (!container) return;
		container.innerHTML = state.messages
			.map(
				(m, _i) => `
      <div class="chat-msg ${m.role}">
        <div class="chat-avatar">${m.role === "user" ? "H" : m.agentName ? m.agentName[0] : "A"}</div>
        <div class="chat-bubble">${m.text}</div>
      </div>
    `,
			)
			.join("");
		container.scrollTop = container.scrollHeight;
	}

	function renderPhaseContent() {
		const sections = document.querySelectorAll(".phase-content");
		sections.forEach((el) => {
			el.classList.toggle("active", el.dataset.phase === state.currentPhase);
		});
	}

	function renderSidebarTab() {
		const contents = document.querySelectorAll(".sidebar-tab-content");
		contents.forEach((el) => {
			el.style.display = el.dataset.tab === state.sidebarTab ? "block" : "none";
		});
		document.querySelectorAll(".sidebar-tab").forEach((el) => {
			el.classList.toggle("active", el.dataset.tab === state.sidebarTab);
		});
	}

	/* ── Actions ─────────────────────────────────────────── */

	function goToPhase(phase) {
		if (!state.phases.includes(phase)) return;
		state.currentPhase = phase;
		renderPhases();
		renderPhaseContent();
	}

	function focusAgent(idx) {
		state.currentAgent = idx;
		renderAgentList();
		updateWorkspaceForAgent(idx);
	}

	function updateWorkspaceForAgent(idx) {
		const agent = state.agents[idx];
		const workspace = document.getElementById("workspace-content");
		if (!workspace) return;
		const phaseLabels = {
			explore: "Survey Analysis",
			propose: "Design Proposals",
			spec: "Engineering Spec",
			design: "Morphology Evolution",
			simulate: "Simulation Stream",
			build: "Assembly Instructions",
			fly: "Mission Control",
			verify: "Verification",
			archive: "Documentation",
		};
		const phaseHeader = workspace.querySelector(".canvas-header span");
		if (phaseHeader) {
			phaseHeader.textContent = `${agent.name}: ${phaseLabels[state.currentPhase] || state.currentPhase}`;
		}
	}

	function sendMessage(text) {
		if (!text.trim()) return;
		state.messages.push({ role: "user", text: text.trim() });
		renderChat();
		document.getElementById("chat-input").value = "";

		const thinking = document.createElement("div");
		thinking.className = "thinking-indicator";
		thinking.id = "thinking-indicator";
		thinking.innerHTML = `
      <span>Agent thinking</span>
      <div class="thinking-dots">
        <span></span><span></span><span></span>
      </div>
    `;
		document.getElementById("chat-messages").appendChild(thinking);
		thinking.scrollIntoView({ behavior: "smooth" });

		const resp = responses[Math.floor(Math.random() * responses.length)];
		const delay = 600 + Math.random() * 800;

		setTimeout(() => {
			const ti = document.getElementById("thinking-indicator");
			if (ti) ti.remove();

			const steps = resp.steps;
			let stepIdx = 0;

			function showStep() {
				if (stepIdx < steps.length) {
					state.messages.push({
						role: "agent",
						agentName: state.agents[0].name,
						text: `<div class="reasoning-step">${steps[stepIdx]}</div>`,
					});
					renderChat();
					stepIdx++;
					setTimeout(showStep, 800 + Math.random() * 600);
				} else {
					state.messages.push({
						role: "agent",
						agentName: state.agents[0].name,
						text: resp.final,
					});
					renderChat();
				}
			}

			showStep();
		}, delay);
	}

	/* ── Phase content generators ────────────────────────── */

	function generateExploreContent(container) {
		if (!container) return;
		container.innerHTML = `
      <div class="content-card animate-fade-in">
        <div class="content-card-header">
          <span>Mission Analysis</span>
          <span class="tag tag-accent">Tunnel Inspection</span>
        </div>
        <div class="content-card-body">
          <p style="color:var(--text-secondary);font-size:var(--font-size-sm);margin-bottom:12px;">
            Analyzing requirements for autonomous tunnel inspection drone.
          </p>
          <div class="highlight-block">
            <div class="highlight-label">KEY REQUIREMENT</div>
            <div>500m operational range in GPS-denied tunnel environment with 1.8m diameter clearance, 15min+ flight time, real-time obstacle avoidance, and HD video feedback.</div>
          </div>
          <div class="highlight-block" style="border-left-color:var(--secondary);">
            <div class="highlight-label" style="color:var(--secondary);">CONSTRAINT FOUND</div>
            <div>Tunnel ventilation shafts create turbulence zones up to 8m/s crosswind — requires >1.6:1 thrust-to-weight ratio for stability.</div>
          </div>
          <div class="highlight-block" style="border-left-color:var(--warning);">
            <div class="highlight-label" style="color:var(--warning);">RISK IDENTIFIED</div>
            <div>GPS-denied navigation requires optical flow + LiDAR fusion. Recommend dual-redundant IMU for safety.</div>
          </div>
        </div>
      </div>
    `;
	}

	function generateProposeContent(container) {
		if (!container) return;
		container.innerHTML = `
      <div class="content-card animate-fade-in">
        <div class="content-card-header">
          <span>Design Proposals</span>
          <span class="tag tag-accent">3 Candidates</span>
        </div>
        <div class="content-card-body">
          <div class="comparison-grid">
            <div class="design-card selected">
              <div class="design-title">Y6 Coaxial <span class="design-badge recommended">RECOMMENDED</span></div>
              <div class="design-spec">
                <div>• Motors: 6x 2205 2300KV</div>
                <div>• Props: 9x4.5 3-blade</div>
                <div>• Battery: 4S 2200mAh</div>
                <div>• TWR: 2.1:1</div>
                <div>• Endurance: 22 min</div>
                <div>• Redundancy: ⭐⭐⭐</div>
              </div>
            </div>
            <div class="design-card">
              <div class="design-title">X4 Compact</div>
              <div class="design-spec">
                <div>• Motors: 4x 2306 2450KV</div>
                <div>• Props: 10x4.5</div>
                <div>• Battery: 4S 1800mAh</div>
                <div>• TWR: 1.8:1</div>
                <div>• Endurance: 18 min</div>
                <div>• Redundancy: ⭐</div>
              </div>
            </div>
            <div class="design-card">
              <div class="design-title">H-Frame Ducted</div>
              <div class="design-spec">
                <div>• Motors: 4x 2004 1900KV</div>
                <div>• Props: 8x4.5 ducted</div>
                <div>• Battery: 6S 1500mAh</div>
                <div>• TWR: 1.6:1</div>
                <div>• Endurance: 15 min</div>
                <div>• Redundancy: ⭐⭐</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
	}

	function generateSpecContent(container) {
		if (!container) return;
		container.innerHTML = `
      <div class="content-card animate-fade-in">
        <div class="content-card-header">
          <span>Engineering Specification — Y6 Coaxial</span>
          <span class="tag tag-secondary">v0.3.2</span>
        </div>
        <div class="content-card-body">
          <table class="bom-table">
            <thead>
              <tr><th>Parameter</th><th>Value</th><th>Tolerance</th><th>Status</th></tr>
            </thead>
            <tbody>
              <tr><td>Frame Size</td><td>250mm wheelbase</td><td>±2mm</td><td><span class="tag tag-secondary">VERIFIED</span></td></tr>
              <tr><td>Motor KV</td><td>2300KV</td><td>±50KV</td><td><span class="tag tag-secondary">VERIFIED</span></td></tr>
              <tr><td>Propeller</td><td>9x4.5 3-blade</td><td>—</td><td><span class="tag tag-secondary">VERIFIED</span></td></tr>
              <tr><td>Battery</td><td>4S 2200mAh</td><td>100C</td><td><span class="tag tag-warning">REVIEW</span></td></tr>
              <tr><td>AUW</td><td>680g</td><td>±20g</td><td><span class="tag tag-secondary">VERIFIED</span></td></tr>
              <tr><td>Thrust Total</td><td>1440g</td><td>±5%</td><td><span class="tag tag-secondary">VERIFIED</span></td></tr>
              <tr><td>Flight Controller</td><td>STM32F7 + ICM-20689</td><td>—</td><td><span class="tag tag-secondary">VERIFIED</span></td></tr>
              <tr><td>Payload Camera</td><td>4K 60fps + Thermal</td><td>120g</td><td><span class="tag tag-accent">SELECTED</span></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
	}

	function generateDesignContent(container) {
		if (!container) return;
		container.innerHTML = `
      <div class="canvas-area" style="flex:1;">
        <div class="canvas-header">
          <span>3D Viewport — Morphology Evolution</span>
          <div class="flex gap-8">
            <button class="btn btn-sm" onclick="ANDINO.goToPhase('simulate')">Simulate →</button>
          </div>
        </div>
        <div class="canvas-body" style="background: radial-gradient(ellipse at center, #0d0d1a 0%, #080810 100%);">
          <div style="position:relative;width:100%;height:100%;display:flex;align-items:center;justify-content:center;">
            <div style="position:relative;width:240px;height:240px;">
              <svg viewBox="0 0 240 240" style="width:100%;height:100%;">
                <defs>
                  <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.15"/>
                    <stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/>
                  </radialGradient>
                </defs>
                <circle cx="120" cy="120" r="100" fill="url(#glow)"/>
                <circle cx="120" cy="120" r="80" fill="none" stroke="var(--border-default)" stroke-width="0.5" stroke-dasharray="4 4"/>
                <circle cx="120" cy="120" r="40" fill="none" stroke="var(--border-subtle)" stroke-width="0.5"/>
                <!-- Main frame arms (Y6 - 3 arms, 60° apart, top layer) -->
                <g stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round">
                  <line x1="120" y1="120" x2="120" y2="35" opacity="0.9"/>
                  <line x1="120" y1="120" x2="193.7" y2="75" opacity="0.9"/>
                  <line x1="120" y1="120" x2="193.7" y2="165" opacity="0.9"/>
                </g>
                <!-- Coaxial (bottom) motors - offset slightly -->
                <g stroke="var(--secondary)" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="3 3">
                  <line x1="120" y1="120" x2="120" y2="45" opacity="0.6"/>
                  <line x1="120" y1="120" x2="185" y2="80" opacity="0.6"/>
                  <line x1="120" y1="120" x2="185" y2="160" opacity="0.6"/>
                </g>
                <!-- Motor nodes top -->
                <circle cx="120" cy="35" r="5" fill="var(--accent)" stroke="var(--bg-deep)" stroke-width="2"/>
                <circle cx="193.7" cy="75" r="5" fill="var(--accent)" stroke="var(--bg-deep)" stroke-width="2"/>
                <circle cx="193.7" cy="165" r="5" fill="var(--accent)" stroke="var(--bg-deep)" stroke-width="2"/>
                <!-- Motor nodes bottom (coaxial) -->
                <circle cx="120" cy="45" r="3" fill="var(--secondary)" stroke="var(--bg-deep)" stroke-width="2"/>
                <circle cx="185" cy="80" r="3" fill="var(--secondary)" stroke="var(--bg-deep)" stroke-width="2"/>
                <circle cx="185" cy="160" r="3" fill="var(--secondary)" stroke="var(--bg-deep)" stroke-width="2"/>
                <!-- Center hub -->
                <circle cx="120" cy="120" r="8" fill="var(--bg-surface)" stroke="var(--accent)" stroke-width="2"/>
                <circle cx="120" cy="120" r="3" fill="var(--accent)"/>
                <!-- Prop arcs -->
                <g fill="none" stroke="var(--accent)" stroke-width="0.5" opacity="0.3">
                  <ellipse cx="120" cy="35" rx="20" ry="6" transform="rotate(0 120 35)"/>
                  <ellipse cx="193.7" cy="75" rx="20" ry="6" transform="rotate(-60 193.7 75)"/>
                  <ellipse cx="193.7" cy="165" rx="20" ry="6" transform="rotate(60 193.7 165)"/>
                </g>
                <!-- Payload indicator -->
                <rect x="110" y="145" width="20" height="30" rx="4" fill="var(--warning)" opacity="0.6" stroke="var(--warning)" stroke-width="1"/>
              </svg>
            </div>
            <!-- Labels -->
            <span style="position:absolute;bottom:12px;left:50%;transform:translateX(-50%);font-size:10px;color:var(--text-muted);font-family:var(--font-mono);">
              Y6 Coaxial · 250mm · 680g AUW
            </span>
          </div>
        </div>
      </div>
    `;
	}

	function generateSimulateContent(container) {
		if (!container) return;
		container.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div class="canvas-area" style="min-height:200px;">
          <div class="canvas-header">
            <span>CFD Simulation</span>
            <span class="tag tag-secondary">LIVE</span>
          </div>
          <div class="canvas-body" style="background:radial-gradient(ellipse at 30% 40%, #0d0d1a, #080810);min-height:200px;">
            <div style="position:relative;width:100%;height:100%;display:flex;align-items:center;justify-content:center;">
              <svg viewBox="0 0 200 160" style="width:80%;max-width:300px;">
                <defs>
                  <linearGradient id="flow1" x1="0" y1="0.5" x2="1" y2="0.5">
                    <stop offset="0%" stop-color="var(--accent)" stop-opacity="0"/>
                    <stop offset="50%" stop-color="var(--accent)" stop-opacity="0.3"/>
                    <stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/>
                  </linearGradient>
                </defs>
                <!-- Airflow lines -->
                ${[0, 1, 2, 3, 4, 5, 6, 7]
									.map((i) => {
										const y = 20 + i * 17;
										return `<line x1="0" y1="${y}" x2="200" y2="${y + (i % 2 === 0 ? 8 : -8)}" stroke="var(--accent)" stroke-opacity="${0.1 + i * 0.04}" stroke-width="0.5" stroke-dasharray="${4 + i} ${2 + i}"/>`;
									})
									.join("")}
                <!-- Drone silhouette -->
                <ellipse cx="100" cy="80" rx="40" ry="10" fill="none" stroke="var(--text-muted)" stroke-width="1" opacity="0.5"/>
                <line x1="60" y1="80" x2="140" y2="80" stroke="var(--text-muted)" stroke-width="1.5" opacity="0.5"/>
                <circle cx="100" cy="80" r="5" fill="var(--accent)" opacity="0.5"/>
                <text x="10" y="150" fill="var(--text-muted)" font-size="8" font-family="var(--font-mono)">Velocity: 8.2 m/s</text>
                <text x="10" y="140" fill="var(--text-muted)" font-size="8" font-family="var(--font-mono)">Turbulence: κ 0.23</text>
              </svg>
            </div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <div class="content-card" style="flex:1;">
            <div class="content-card-header"><span>Simulation Results</span></div>
            <div class="content-card-body">
              <div class="flex justify-between gap-8" style="font-size:var(--font-size-sm);padding:4px 0;border-bottom:1px solid var(--border-subtle);">
                <span style="color:var(--text-muted)">Drag Coefficient</span>
                <span class="font-mono" style="color:var(--secondary)">0.042</span>
              </div>
              <div class="flex justify-between gap-8" style="font-size:var(--font-size-sm);padding:4px 0;border-bottom:1px solid var(--border-subtle);">
                <span style="color:var(--text-muted)">Lift/Drag Ratio</span>
                <span class="font-mono" style="color:var(--secondary)">4.8:1</span>
              </div>
              <div class="flex justify-between gap-8" style="font-size:var(--font-size-sm);padding:4px 0;border-bottom:1px solid var(--border-subtle);">
                <span style="color:var(--text-muted)">Motor Efficiency</span>
                <span class="font-mono" style="color:var(--warning)">78%</span>
              </div>
              <div class="flex justify-between gap-8" style="font-size:var(--font-size-sm);padding:4px 0;">
                <span style="color:var(--text-muted)">Stability Margin</span>
                <span class="font-mono" style="color:var(--secondary)">18%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
	}

	function generateBuildContent(container) {
		if (!container) return;
		container.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div class="content-card">
          <div class="content-card-header">
            <span>Bill of Materials</span>
            <span class="tag tag-accent">12 items</span>
          </div>
          <div class="content-card-body" style="max-height:280px;overflow-y:auto;">
            <table class="bom-table">
              <thead>
                <tr><th>Item</th><th>Qty</th><th>Part #</th><th>Cost</th></tr>
              </thead>
              <tbody>
                <tr><td>Frame Kit Y6-250</td><td>1</td><td>FR-Y6-250</td><td>$42</td></tr>
                <tr><td>Motor 2205 2300KV</td><td>6</td><td>MT-2205-23</td><td>$78</td></tr>
                <tr><td>ESC 30A BLHeli_32</td><td>6</td><td>ESC-30-BH</td><td>$90</td></tr>
                <tr><td>Prop 9x4.5 3-blade</td><td>6</td><td>PR-945-3B</td><td>$18</td></tr>
                <tr><td>Flight Controller F7</td><td>1</td><td>FC-F7-V2</td><td>$65</td></tr>
                <tr><td>Battery 4S 2200mAh</td><td>2</td><td>BT-4S-22</td><td>$96</td></tr>
                <tr><td>Camera 4K + Thermal</td><td>1</td><td>CM-4K-TH</td><td>$180</td></tr>
                <tr><td>VTX 5.8GHz 800mW</td><td>1</td><td>VTX-58-800</td><td>$32</td></tr>
                <tr><td>GPS + Compass</td><td>1</td><td>GPS-M9N</td><td>$45</td></tr>
                <tr><td>LiDAR TF-Luna</td><td>1</td><td>LD-TFLUNA</td><td>$38</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="content-card">
          <div class="content-card-header">
            <span>Assembly Progress</span>
            <span class="tag tag-warning">IN PROGRESS</span>
          </div>
          <div class="content-card-body" style="max-height:280px;overflow-y:auto;">
            <div class="mission-step completed"><span class="step-num">✓</span> Frame assembly</div>
            <div class="mission-step completed"><span class="step-num">✓</span> Motor mounting</div>
            <div class="mission-step completed"><span class="step-num">✓</span> ESC soldering</div>
            <div class="mission-step active"><span class="step-num">4</span> Flight controller wiring</div>
            <div class="mission-step pending"><span class="step-num">5</span> Propeller installation</div>
            <div class="mission-step pending"><span class="step-num">6</span> Camera mount</div>
            <div class="mission-step pending"><span class="step-num">7</span> Firmware flash</div>
            <div class="mission-step pending"><span class="step-num">8</span> Calibration</div>
          </div>
        </div>
      </div>
    `;
	}

	function generateFlyContent(container) {
		if (!container) return;
		container.innerHTML = `
      <div class="content-card">
        <div class="content-card-header">
          <span>Mission Control — Tunnel Inspection Alpha</span>
          <span class="tag tag-warning">ARMED</span>
        </div>
        <div class="content-card-body">
          <div class="flex gap-16" style="flex-wrap:wrap;">
            <div class="gauge">
              <div class="gauge-ring">
                <svg viewBox="0 0 36 36">
                  <circle class="bg" cx="18" cy="18" r="15.9"/>
                  <circle class="fill secondary" cx="18" cy="18" r="15.9" stroke-dasharray="100" stroke-dashoffset="${100 - 62}"/>
                </svg>
                <div class="gauge-value" style="color:var(--secondary);">62%</div>
              </div>
              <div class="gauge-label">Battery</div>
            </div>
            <div class="gauge">
              <div class="gauge-ring">
                <svg viewBox="0 0 36 36">
                  <circle class="bg" cx="18" cy="18" r="15.9"/>
                  <circle class="fill accent" cx="18" cy="18" r="15.9" stroke-dasharray="100" stroke-dashoffset="${100 - 45}"/>
                </svg>
                <div class="gauge-value" style="color:var(--accent);">45m</div>
              </div>
              <div class="gauge-label">Altitude</div>
            </div>
            <div class="gauge">
              <div class="gauge-ring">
                <svg viewBox="0 0 36 36">
                  <circle class="bg" cx="18" cy="18" r="15.9"/>
                  <circle class="fill warning" cx="18" cy="18" r="15.9" stroke-dasharray="100" stroke-dashoffset="${100 - 28}"/>
                </svg>
                <div class="gauge-value" style="color:var(--warning);">12.8</div>
              </div>
              <div class="gauge-label">Speed m/s</div>
            </div>
            <div class="gauge">
              <div class="gauge-ring">
                <svg viewBox="0 0 36 36">
                  <circle class="bg" cx="18" cy="18" r="15.9"/>
                  <circle class="fill secondary" cx="18" cy="18" r="15.9" stroke-dasharray="100" stroke-dashoffset="${100 - 80}"/>
                </svg>
                <div class="gauge-value" style="color:var(--secondary);">80%</div>
              </div>
              <div class="gauge-label">Signal</div>
            </div>
            <div class="gauge">
              <div class="gauge-ring">
                <svg viewBox="0 0 36 36">
                  <circle class="bg" cx="18" cy="18" r="15.9"/>
                  <circle class="fill" cx="18" cy="18" r="15.9" stroke-dasharray="100" stroke-dashoffset="${100 - 95}" style="stroke:var(--info);"/>
                </svg>
                <div class="gauge-value" style="color:var(--info);">95%</div>
              </div>
              <div class="gauge-label">GPS</div>
            </div>
          </div>
        </div>
      </div>
    `;
	}

	function generateVerifyContent(container) {
		if (!container) return;
		container.innerHTML = `
      <div class="content-card">
        <div class="content-card-header">
          <span>Verification Results</span>
          <span class="tag tag-secondary">PASSED 7/8</span>
        </div>
        <div class="content-card-body">
          <div class="flex flex-col gap-4">
            <div class="flex justify-between items-center p-16" style="border-bottom:1px solid var(--border-subtle);border-radius:0;padding:8px 0;">
              <span style="font-size:var(--font-size-sm);">Structural Integrity</span>
              <span class="tag tag-secondary">PASS</span>
            </div>
            <div class="flex justify-between items-center" style="padding:8px 0;border-bottom:1px solid var(--border-subtle);">
              <span style="font-size:var(--font-size-sm);">Thrust Output</span>
              <span class="tag tag-secondary">PASS</span>
            </div>
            <div class="flex justify-between items-center" style="padding:8px 0;border-bottom:1px solid var(--border-subtle);">
              <span style="font-size:var(--font-size-sm);">Flight Stability</span>
              <span class="tag tag-secondary">PASS</span>
            </div>
            <div class="flex justify-between items-center" style="padding:8px 0;border-bottom:1px solid var(--border-subtle);">
              <span style="font-size:var(--font-size-sm);">Endurance</span>
              <span class="tag tag-secondary">PASS</span>
            </div>
            <div class="flex justify-between items-center" style="padding:8px 0;border-bottom:1px solid var(--border-subtle);">
              <span style="font-size:var(--font-size-sm);">Signal Range</span>
              <span class="tag tag-warning">MARGINAL</span>
            </div>
            <div class="flex justify-between items-center" style="padding:8px 0;">
              <span style="font-size:var(--font-size-sm);">Payload Integration</span>
              <span class="tag tag-secondary">PASS</span>
            </div>
          </div>
        </div>
      </div>
    `;
	}

	function generateArchiveContent(container) {
		if (!container) return;
		container.innerHTML = `
      <div class="empty-state">
        <div class="icon">📦</div>
        <p>Mission archived. All artifacts, logs, and simulations saved to project history.</p>
        <div style="margin-top:12px;display:flex;gap:8px;">
          <button class="btn btn-secondary btn-sm">Export PDF</button>
          <button class="btn btn-sm">View Logs</button>
        </div>
      </div>
    `;
	}

	const phaseGenerators = {
		explore: generateExploreContent,
		propose: generateProposeContent,
		spec: generateSpecContent,
		design: generateDesignContent,
		simulate: generateSimulateContent,
		build: generateBuildContent,
		fly: generateFlyContent,
		verify: generateVerifyContent,
		archive: generateArchiveContent,
	};

	/* ── WebSocket Simulation ────────────────────────────── */

	let wsInterval = null;

	function startSimulation() {
		// Simulate agent progress
		wsInterval = setInterval(() => {
			state.agents.forEach((a, _i) => {
				if (a.status === "busy") {
					a.progress = Math.min(
						100,
						a.progress + Math.floor(Math.random() * 5) + 1,
					);
					if (a.progress >= 100) {
						a.status = Math.random() > 0.2 ? "success" : "idle";
						a.task =
							a.status === "success"
								? "Task complete"
								: "Waiting for confirmation";
					}
				}
			});
			renderAgentList();
		}, 3000);
	}

	function stopSimulation() {
		if (wsInterval) {
			clearInterval(wsInterval);
			wsInterval = null;
		}
	}

	/* ── Init ────────────────────────────────────────────── */

	function initApp() {
		renderAgentList();
		renderMetrics();
		renderPhases();
		renderChat();
		renderSidebarTab();

		// Generate all phase content containers
		document.querySelectorAll(".phase-content").forEach((el) => {
			const phase = el.dataset.phase;
			if (phaseGenerators[phase]) {
				phaseGenerators[phase](el);
			}
		});

		// Sidebar tab switching
		document.querySelectorAll(".sidebar-tab").forEach((el) => {
			el.addEventListener("click", () => {
				state.sidebarTab = el.dataset.tab;
				renderSidebarTab();
			});
		});

		// Phase steps click
		document.querySelectorAll(".phase-step").forEach((_el) => {
			// In a real app this would navigate phases
		});

		// Chat send
		const sendBtn = document.getElementById("chat-send");
		const chatInput = document.getElementById("chat-input");
		if (sendBtn && chatInput) {
			sendBtn.addEventListener("click", () => sendMessage(chatInput.value));
			chatInput.addEventListener("keydown", (e) => {
				if (e.key === "Enter" && !e.shiftKey) {
					e.preventDefault();
					sendMessage(chatInput.value);
				}
			});
		}

		// New mission button
		const newMissionBtn = document.getElementById("new-mission-btn");
		if (newMissionBtn) {
			newMissionBtn.addEventListener("click", () => {
				state.messages.push({
					role: "user",
					text: "Start new mission: tunnel inspection drone",
				});
				renderChat();
				setTimeout(() => {
					sendMessage(
						"Design a drone for tunnel inspection with 500m range and 15min flight time",
					);
				}, 500);
			});
		}

		// Start WebSocket simulation
		startSimulation();

		// Focus first agent's workspace
		updateWorkspaceForAgent(0);
	}

	/* ── Public API ──────────────────────────────────────── */
	return {
		init: initApp,
		goToPhase,
		focusAgent,
		sendMessage,
		startSimulation,
		stopSimulation,
		state,
	};
})();

/* ── Auto-init on DOM ready ────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
	ANDINO.init();
});
