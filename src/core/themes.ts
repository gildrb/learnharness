/** Built-in named themes — the fork's own palettes, mapped onto the app's
 *  CSS-variable skin. A theme replaces the whole base palette (background,
 *  surfaces, edges, text); the per-field appearance knobs (font, size,
 *  emphasis inks) still ride on top. Values mirror gildrb/dotfiles
 *  theme/forge.json. */
export const THEME_VARS: Record<string, Record<string, string>> = {
	forge: {
		"--background": "#110b07", // ink
		"--foreground": "#e0d6c6", // paper
		"--card": "#1e1711", // surface0
		"--card-foreground": "#e0d6c6",
		"--popover": "#1e1711",
		"--popover-foreground": "#e0d6c6",
		"--primary": "#e0d6c6",
		"--primary-foreground": "#110b07",
		"--secondary": "#1e1711",
		"--secondary-foreground": "#e0d6c6",
		"--muted": "#1e1711",
		"--muted-foreground": "#a9a098", // comment
		"--accent": "#251d17", // surface1
		"--accent-foreground": "#e0d6c6",
		"--destructive": "#f69c8e",
		"--border": "#7f5e47",
		"--input": "#7f5e47",
		"--ring": "#a8907b", // bronze
	},
};

/** Display names for the settings row (source of truth for the options). */
export const THEME_LABELS: Record<string, string> = {
	forge: "Forge",
};
