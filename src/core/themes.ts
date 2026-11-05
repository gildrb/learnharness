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
		"--lh-code-ink": "#8ec184", // mdCode = string
	},
};

/** A shiki (TextMate-scope) registration for a named theme's CODE
 *  highlighting, translated 1:1 from dotfiles' canonical sources —
 *  theme/forge.json's `syntax` section (token kind → palette role) and its
 *  TextMate form .config/bat/themes/Forge.tmTheme (scope coverage). The app
 *  paints the block surface itself (globals.css `[data-streamdown=
 *  "code-block"]` tint), so the registration's background is transparent —
 *  only tokens carry color. Kept structural (no shiki import): core stays
 *  free of UI deps; the consumer's ThemeRegistrationAny accepts this shape. */
export type SyntaxTokenRule = {
	scope: string | string[];
	settings: { foreground?: string; background?: string; fontStyle?: string };
};

export type SyntaxThemeRegistration = {
	name: string;
	type: "dark" | "light";
	background: string;
	foreground: string;
	tokenColors: SyntaxTokenRule[];
};

const FORGE_TOKENS: SyntaxTokenRule[] = [
	{ scope: "comment", settings: { foreground: "#a9a098", fontStyle: "italic" } },
	{ scope: "punctuation", settings: { foreground: "#c6c1bb" } },
	{ scope: "keyword, storage, punctuation.definition.keyword", settings: { foreground: "#d4af5d" } },
	{ scope: "keyword.operator", settings: { foreground: "#d4af5d" } },
	{ scope: "string, punctuation.definition.string", settings: { foreground: "#8ec184" } },
	{ scope: "entity.name.function, support.function", settings: { foreground: "#79c1b2" } },
	{ scope: "variable", settings: { foreground: "#e0d6c6" } },
	{
		scope:
			"variable.other.property, variable.other.member, support.type.property-name, entity.name.tag, entity.other.attribute-name",
		settings: { foreground: "#c6b4a0" },
	},
	{ scope: "constant, support.constant, constant.language", settings: { foreground: "#c6b4a0" } },
	{
		scope:
			"entity.name.type, entity.name.class, entity.name.namespace, entity.name.module, support.type, support.class, storage.type, entity.name.constructor",
		settings: { foreground: "#c6b4a0" },
	},
	{ scope: "constant.numeric", settings: { foreground: "#eba474" } },
	{ scope: "variable.parameter", settings: { foreground: "#eba474" } },
	{ scope: "support.function.builtin, variable.language", settings: { foreground: "#c6b4a0" } },
	{ scope: "invalid", settings: { foreground: "#f69c8e", background: "#1e1711" } },
	{ scope: "markup.inserted", settings: { foreground: "#8ec184", background: "#131f10" } },
	{ scope: "markup.changed", settings: { foreground: "#eba474" } },
	{ scope: "markup.deleted", settings: { foreground: "#f69c8e", background: "#2a1512" } },
];

const forgeSyntax: SyntaxThemeRegistration = {
	name: "forge",
	type: "dark",
	background: "transparent",
	foreground: "#e0d6c6",
	tokenColors: FORGE_TOKENS,
};

export const THEME_SYNTAX: Record<string, SyntaxThemeRegistration> = {
	forge: forgeSyntax,
};

/** Display names for the settings row (source of truth for the options). */
export const THEME_LABELS: Record<string, string> = {
	forge: "Forge",
};
