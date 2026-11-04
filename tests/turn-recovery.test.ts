import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Agent, AgentMessage } from "@earendil-works/pi-agent-core";
import type { ChatStore } from "../src/core/ports.ts";
import { runPiTurn } from "../src/server/pi/ui-stream.ts";
import { persistTurn } from "../src/server/turn-service.ts";

/** No engine or network: exercise the runner's awaited listener seam. */
function agentEndingWith(loopFailure?: Error): Agent {
	const listeners: Array<(event: never) => unknown> = [];
	return {
		state: { messages: [] },
		subscribe(listener: (event: never) => unknown) { listeners.push(listener); return () => {}; },
		async continue() {
			await Promise.resolve(); // let the view subscribe before the terminal
			if (loopFailure) throw loopFailure;
			for (const listener of listeners) await listener({ type: "agent_end", messages: [] } as never);
		},
		abort() {},
	} as unknown as Agent;
}

function wireFrames(wire: string): string[] {
	return wire.split("\n\n").filter(Boolean).map(frame => frame.slice("data: ".length));
}

describe("turn settlement recovery", () => {
	it("reports a failed canonical save before DONE and cleans up before reporting", async () => {
		const order: string[] = [];
		const handle = runPiTurn({
			agent: agentEndingWith(),
			onFinish() { order.push("save"); throw new Error("synthetic disk failure"); },
			onSettleFailure() { order.push("cleanup"); },
			onSettleError() { order.push("report"); return "The reply could not be saved."; },
		});
		const frames = wireFrames(await new Response(handle.subscribe()).text());
		assert.deepEqual(order, ["save", "cleanup", "report"]);
		assert.equal(frames.at(-1), "[DONE]");
		assert.equal(frames.filter(f => f.includes('"type":"error"')).length, 1);
		assert.ok(frames.at(-2)?.includes("The reply could not be saved."));
	});

	it("still reports settlement failure when cleanup itself throws", async () => {
		const handle = runPiTurn({
			agent: agentEndingWith(),
			onFinish() { throw new Error("synthetic save failure"); },
			onSettleFailure() { throw new Error("synthetic cleanup failure"); },
			onSettleError: () => "The reply could not be saved.",
		});
		const frames = wireFrames(await new Response(handle.subscribe()).text());
		assert.equal(frames.at(-1), "[DONE]");
		assert.equal(frames.filter(f => f.includes('"type":"error"')).length, 1);
	});

	it("does not replace an already reported loop failure with a second settlement error", async () => {
		let cleanups = 0;
		const handle = runPiTurn({
			agent: agentEndingWith(new Error("synthetic loop failure")),
			onError: () => "An error occurred.",
			onFinish() { throw new Error("synthetic save failure"); },
			onSettleFailure(error, reportedErrorText) {
				cleanups++;
				assert.match(String(error), /synthetic save failure/);
				assert.equal(reportedErrorText, "An error occurred.");
			},
		});
		const frames = wireFrames(await new Response(handle.subscribe()).text());
		assert.equal(cleanups, 1);
		assert.equal(frames.filter(f => f.includes('"type":"error"')).length, 1);
		assert.equal(frames.at(-1), "[DONE]");
	});

	it("a healthy terminal follows persistence and emits no error", async () => {
		let saves = 0;
		const handle = runPiTurn({ agent: agentEndingWith(), onFinish() { saves++; } });
		const frames = wireFrames(await new Response(handle.subscribe()).text());
		assert.equal(saves, 1);
		assert.equal(frames.at(-1), "[DONE]");
		assert.equal(frames.some(f => f.includes('"type":"error"')), false);
	});

	it("does not contain a canonical write failure as an empty successful persist", () => {
		const store = {
			getChat: () => ({ messages: [] }),
			saveMessages() { throw new Error("synthetic disk failure"); },
		} as unknown as ChatStore;
		const message = { role: "assistant", content: [{ type: "text", text: "Synthetic reply" }], stopReason: "stop", timestamp: 1 } as AgentMessage;
		assert.throws(() => persistTurn(store, "fixture", 0, [message], false), /The reply could not be saved\./);
	});
});

/** An agent whose turn ends on one assistant message with the given
 * stopReason and content — the streaming shape the length fork guards. */
function agentEndingWithAssistant(content: unknown[], stopReason: string): Agent {
	const listeners: Array<(event: never) => unknown> = [];
	const message = { role: "assistant", content, stopReason, timestamp: 0 };
	return {
		state: { messages: [message] },
		subscribe(listener: (event: never) => unknown) { listeners.push(listener); return () => {}; },
		async continue() {
			await Promise.resolve();
			for (const listener of listeners) {
				await listener({ type: "message_start", message } as never);
				await listener({ type: "message_end", message } as never);
				await listener({ type: "agent_end", messages: [message] } as never);
			}
		},
		abort() {},
	} as unknown as Agent;
}

describe("length-stopped thinking-only turns (fork)", () => {
	it("reports the exhausted output budget instead of settling silently", async () => {
		const handle = runPiTurn({
			agent: agentEndingWithAssistant([{ type: "thinking", thinking: "long reasoning…" }], "length"),
			onFinish() {},
		});
		const frames = wireFrames(await new Response(handle.subscribe()).text());
		assert.equal(frames.at(-1), "[DONE]");
		const error = frames.find(f => f.includes('"type":"error"'));
		assert.ok(error, "an error frame is present");
		assert.match(error, /output budget on reasoning/);
	});

	it("a length stop WITH text or a tool call stays a normal turn", async () => {
		for (const content of [
			[{ type: "thinking", thinking: "…" }, { type: "text", text: "partial answer" }],
			[{ type: "thinking", thinking: "…" }, { type: "toolCall", id: "call_0", name: "t", arguments: {} }],
		]) {
			const handle = runPiTurn({ agent: agentEndingWithAssistant(content, "length"), onFinish() {} });
			const frames = wireFrames(await new Response(handle.subscribe()).text());
			assert.equal(frames.some(f => f.includes('"type":"error"')), false, JSON.stringify(content));
		}
	});

	it("a thinking-only message that stopped cleanly stays a normal turn", async () => {
		const handle = runPiTurn({
			agent: agentEndingWithAssistant([{ type: "thinking", thinking: "…" }], "stop"),
			onFinish() {},
		});
		const frames = wireFrames(await new Response(handle.subscribe()).text());
		assert.equal(frames.some(f => f.includes('"type":"error"')), false);
	});
});
