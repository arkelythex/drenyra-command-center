const { chromium } = require("playwright");

(async () => {
	const browser = await chromium.launch({ headless: true });
	const page = await browser.newPage({
		viewport: { width: 1280, height: 800 },
	});

	// 1. Explore signup form
	await page.goto("http://localhost:3000/signup", { waitUntil: "networkidle" });
	await page.waitForTimeout(1000);

	console.log("=== SIGNUP PAGE ===");
	console.log("URL:", page.url());

	const formElements = await page.evaluate(() => {
		const inputs = document.querySelectorAll(
			'input, button, select, textarea, [role="button"]',
		);
		return Array.from(inputs).map((el) => ({
			tag: el.tagName.toLowerCase(),
			type: el.getAttribute("type"),
			name: el.getAttribute("name"),
			id: el.getAttribute("id"),
			placeholder: el.getAttribute("placeholder"),
			"aria-label": el.getAttribute("aria-label"),
			class: el.className?.slice(0, 60),
			text: el.textContent?.trim()?.slice(0, 80),
		}));
	});

	const labels = await page.evaluate(() => {
		return Array.from(document.querySelectorAll("label")).map((l) => ({
			htmlFor: l.getAttribute("for"),
			text: l.textContent?.trim()?.slice(0, 80),
		}));
	});

	console.log("\n--- Form Elements ---");
	formElements.forEach((el, i) => {
		if (el.type !== "hidden") {
			console.log(
				`[${i}] <${el.tag}> type=${el.type} name=${el.name} id=${el.id} placeholder="${el.placeholder}" aria-label="${el["aria-label"]}" text="${el.text?.slice(0, 60)}"`,
			);
		}
	});

	console.log("\n--- Labels ---");
	labels.forEach((l, i) =>
		console.log(`[${i}] for="${l.htmlFor}" text="${l.text}"`),
	);

	// 2. Explore dashboard sidebar with auth mock
	await page.route("**/api/auth/session", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({
				user: {
					id: "test-user-001",
					name: "Test User",
					email: "test@drenyra.com",
					emailVerified: true,
					image: null,
				},
				session: {
					id: "test-session-001",
					expiresAt: new Date(Date.now() + 86400000).toISOString(),
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
					ipAddress: null,
					userAgent: null,
					token: "mock-token",
				},
			}),
		});
	});

	await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
	await page.waitForTimeout(2000);

	console.log("\n\n=== DASHBOARD PAGE ===");
	console.log("URL:", page.url());

	const navElements = await page.evaluate(() => {
		const results = [];
		document
			.querySelectorAll('nav, aside, [role="navigation"], [role="menubar"]')
			.forEach((el) => {
				results.push({
					tag: el.tagName.toLowerCase(),
					role: el.getAttribute("role"),
					id: el.getAttribute("id"),
					"aria-label": el.getAttribute("aria-label"),
					class: el.className?.slice(0, 80),
					children: el.children.length,
				});
			});

		const sidebarEls = [];
		document
			.querySelectorAll('[class*="sidebar" i], [class*="Sidebar" i], aside')
			.forEach((el) => {
				const rect = el.getBoundingClientRect();
				sidebarEls.push({
					tag: el.tagName.toLowerCase(),
					class: el.className?.slice(0, 80),
					id: el.getAttribute("id"),
					"aria-label": el.getAttribute("aria-label"),
					role: el.getAttribute("role"),
					rect: {
						x: Math.round(rect.x),
						y: Math.round(rect.y),
						w: Math.round(rect.width),
						h: Math.round(rect.height),
					},
					children: el.children.length,
				});
			});

		// Get all links
		const links = Array.from(document.querySelectorAll("a"))
			.slice(0, 30)
			.map((a) => ({
				href: a.getAttribute("href")?.slice(0, 50),
				text: a.textContent?.trim()?.slice(0, 60),
				role: a.getAttribute("role"),
				class: a.className?.slice(0, 40),
			}));

		return { navRegions: results, sidebarElements: sidebarEls, links };
	});

	console.log("\n--- Nav Regions ---");
	navElements.navRegions.forEach((n, i) =>
		console.log(
			`[${i}] <${n.tag}> role=${n.role} aria-label="${n["aria-label"]}" class="${n.class}`,
		),
	);

	console.log("\n--- Sidebar Elements ---");
	navElements.sidebarElements.forEach((s, i) =>
		console.log(
			`[${i}] <${s.tag}> role=${s.role} class="${s.class}" rect=${JSON.stringify(s.rect)}`,
		),
	);

	console.log("\n--- Dashboard Links (first 30) ---");
	navElements.links.forEach((l, i) =>
		console.log(`[${i}] href="${l.href}" text="${l.text}"`),
	);

	await browser.close();
})();
