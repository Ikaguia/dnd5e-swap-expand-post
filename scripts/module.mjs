async function _onToggleDescription(event, app) {
	const target = event.currentTarget;
	const icon = target.querySelector(":scope > i");
	const row = target.closest("[data-item-id]");
	const summary = row.querySelector(":scope > .item-description > .wrapper");
	const { itemId } = row.dataset;
	const expanded = app._expanded.has(itemId);
	const item = app.actor.items.get(itemId);
	if ( !item ) return;

	if ( expanded ) {
		summary.addEventListener("transitionend", () => {
			if ( row.classList.contains("collapsed") ) summary.replaceChildren();
		}, { once: true });
		app._expanded.delete(itemId);
	} else {
		const context = await item.getChatData({ secrets: item.isOwner });
		summary.innerHTML = await renderTemplate("systems/dnd5e/templates/items/parts/item-summary.hbs", context);
		await new Promise(resolve => requestAnimationFrame(resolve));
		app._expanded.add(itemId);
	}

	row.classList.toggle("collapsed", expanded);
}

async function _onItemUse(event, app) {
	const target = event.currentTarget;
	const row = target.closest("[data-item-id]");
	const { itemId } = row.dataset;
	const item = app.actor.items.get(itemId);
	if ( !item ) return;

	item.use();
}

function registerModuleSettings() {
	// Internal System Migration Version
	game.settings.register("dnd5e-swap-expand-post", "swap-expand-post", {
		name: "Swap expand/post",
		scope: "client",
		config: true,
		default: true,
		type: Boolean
	});
}



Hooks.once('init', async function() {
	registerModuleSettings();

	Hooks.on("renderActorSheet5e", (app, html, data) => {
		if (!game.settings.get("dnd5e-swap-expand-post", "swap-expand-post")) return;
		const use = html.find("[data-item-id] [data-action='use']");
		use.each((idx, el) => {
			delete el.dataset.action;
			el.addEventListener("click", (event) => {
				_onToggleDescription(event, app);
			});
		});

		const toggle = html.find("[data-toggle-description]");
		toggle.off();
		toggle.each((idx, el) => {
			delete el.dataset["toggleDescription"];
			const icon = el.querySelector(":scope > i");
			icon.classList.toggle("fa-expand", false);
			icon.classList.toggle("fa-terminal", true);
			el.addEventListener("click", (event) => {
				_onItemUse(event, app);
			});
		});
	});
});
