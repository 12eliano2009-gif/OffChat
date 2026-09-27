import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { C as require_jsx_runtime, b as Navigate, f as useRouterState, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as createServerFn } from "./ssr.mjs";
import { f as splitNox, h as toMoney, l as packById, r as authMiddleware, u as parseAmount } from "./packs-txKK3gaA.mjs";
import { a as hasGateSessionMarker } from "./server-BhCAFEGt.mjs";
import { O as Bluetooth, S as House, c as SquarePlus, i as UserRound, n as Wifi, p as Settings, w as Globe, y as MessageCircle } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { d as cn, f as createSsrRpc, i as InstallButton, o as useSettings, s as useT, u as Button } from "./router-By-l8WBZ.mjs";
import { n as OffxMark, t as OffxLockup } from "./logo-puPl-3SD.mjs";
import { i as signOut } from "./client-B40BzJxt.mjs";
import { n as useCurrentUser, r as useCurrentUserState, t as Skeleton } from "./skeleton-DPoB2_JI.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/signed-in-B-7bejH-.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var FAST_POLL_MS = 400;
var IDLE_POLL_MS = 2e3;
var PING_INTERVAL_MS = 2e3;
var STALL_MS = 1e4;
var MAX_RECOVERY_ATTEMPTS = 3;
var SIGNAL_RETRY_DELAYS_MS = [250, 750];
function defaultIceServers() {
	return [{ urls: ["stun:stun.l.google.com:19302", "stun:stun.cloudflare.com:3478"] }];
}
var P2PRoom = class {
	opts;
	peers = /* @__PURE__ */ new Map();
	/** Per-remote-peer signal delivery chains (order-preserving). */
	signalQueues = /* @__PURE__ */ new Map();
	cursor = 0;
	pollTimer = null;
	pingTimer = null;
	closed = false;
	everPolled = false;
	lastPeersFingerprint = "";
	constructor(opts) {
		this.opts = opts;
	}
	/**
	* The first poll IS the join: it registers this peer and returns the
	* roster. A failed first poll (cold DB, offline tab) must not strand the
	* room: the loop and timers start regardless and the next poll retries.
	*/
	async join() {
		try {
			await this.pollOnce();
		} catch {}
		if (this.closed) return;
		this.schedulePoll(this.anyPairConnecting() ? FAST_POLL_MS : IDLE_POLL_MS);
		this.pingTimer = setInterval(() => {
			this.pingAll();
			this.watchdog();
		}, PING_INTERVAL_MS);
	}
	close() {
		this.closed = true;
		if (this.pollTimer) clearTimeout(this.pollTimer);
		if (this.pingTimer) clearInterval(this.pingTimer);
		for (const slot of this.peers.values()) slot.pc.close();
		this.peers.clear();
		fetch("/api/rtc", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				op: "leave",
				room: this.opts.room,
				peer: this.opts.selfId
			}),
			keepalive: true
		}).catch(() => {});
	}
	/** Send on the unreliable game-state channel (drops stale packets). */
	broadcast(data) {
		const wire = JSON.stringify({
			t: "d",
			d: data
		});
		for (const slot of this.peers.values()) if (slot.state?.readyState === "open") slot.state.send(wire);
	}
	/** Send reliably (ordered) to one peer, or to all when peerId is omitted. */
	send(data, peerId) {
		const wire = JSON.stringify({
			t: "d",
			d: data
		});
		const targets = peerId ? [this.peers.get(peerId)] : [...this.peers.values()];
		for (const slot of targets) if (slot?.reliable?.readyState === "open") slot.reliable.send(wire);
	}
	peerList() {
		return [...this.peers.values()].map((s) => ({ ...s.info }));
	}
	schedulePoll(delay) {
		if (this.closed) return;
		if (this.pollTimer) clearTimeout(this.pollTimer);
		this.pollTimer = setTimeout(() => void this.poll(), delay);
	}
	anyPairConnecting() {
		for (const s of this.peers.values()) {
			if (s.terminal) continue;
			if (s.info.connectionState !== "connected") return true;
		}
		return false;
	}
	async pollOnce() {
		const params = new URLSearchParams({
			room: this.opts.room,
			peer: this.opts.selfId,
			name: this.opts.name ?? "",
			since: String(this.cursor)
		});
		const res = await fetch(`/api/rtc?${params}`);
		if (this.closed) return;
		if (!res.ok) throw new Error(`signaling poll failed: ${res.status}`);
		const body = await res.json();
		if (this.closed) return;
		if (!this.everPolled) {
			this.everPolled = true;
			this.opts.onConnected?.();
		}
		this.reconcileRoster(body.peers);
		const roster = new Set(body.peers.map((p) => p.id));
		for (const sig of body.signals) {
			this.cursor = Math.max(this.cursor, sig.id);
			await this.onSignal(sig.from, sig.kind, sig.payload, roster);
			if (this.closed) return;
		}
	}
	async poll() {
		if (this.closed) return;
		try {
			await this.pollOnce();
		} catch {}
		this.schedulePoll(this.anyPairConnecting() ? FAST_POLL_MS : IDLE_POLL_MS);
	}
	reconcileRoster(peers) {
		const alive = new Set(peers.map((p) => p.id));
		for (const p of peers) {
			if (p.id === this.opts.selfId) continue;
			const existing = this.peers.get(p.id);
			if (existing) existing.info.name = p.name;
			else this.connectTo(p.id, p.name, this.opts.selfId > p.id);
		}
		for (const [id, slot] of this.peers) if (!alive.has(id)) {
			slot.pc.close();
			this.peers.delete(id);
		}
		this.emitPeers();
	}
	connectTo(peerId, name, initiator) {
		if (this.closed) return null;
		const pc = new RTCPeerConnection({ iceServers: this.opts.iceServers ?? defaultIceServers() });
		const slot = {
			pc,
			makingOffer: false,
			ignoreOffer: false,
			pendingCandidates: [],
			lastProgressAt: Date.now(),
			recoveryAttempts: 0,
			info: {
				id: peerId,
				name,
				connectionState: pc.connectionState,
				candidateType: null,
				rttMs: null
			}
		};
		this.peers.set(peerId, slot);
		pc.onicecandidate = (e) => {
			if (e.candidate) this.sendSignal(peerId, "ice", e.candidate.toJSON());
		};
		pc.onconnectionstatechange = () => {
			slot.info.connectionState = pc.connectionState;
			if (pc.connectionState === "connecting" || pc.connectionState === "connected") slot.lastProgressAt = Date.now();
			if (pc.connectionState === "connected") {
				slot.recoveryAttempts = 0;
				slot.terminal = false;
				this.readCandidateType(slot);
			}
			this.emitPeers();
			if (pc.connectionState === "failed") pc.restartIce();
			if (pc.connectionState === "failed" || pc.connectionState === "disconnected") this.schedulePoll(FAST_POLL_MS);
		};
		pc.onnegotiationneeded = async () => {
			try {
				slot.makingOffer = true;
				await pc.setLocalDescription();
				await this.sendSignal(peerId, "offer", pc.localDescription.toJSON());
			} catch {} finally {
				slot.makingOffer = false;
			}
		};
		pc.ondatachannel = (e) => this.attachChannel(slot, e.channel);
		if (initiator) {
			this.attachChannel(slot, pc.createDataChannel("state", {
				ordered: false,
				maxRetransmits: 0
			}));
			this.attachChannel(slot, pc.createDataChannel("reliable", { ordered: true }));
		}
		return slot;
	}
	attachChannel(slot, channel) {
		if (channel.label === "state") slot.state = channel;
		else slot.reliable = channel;
		channel.onopen = () => {
			slot.lastProgressAt = Date.now();
		};
		channel.onmessage = (e) => {
			let msg;
			try {
				msg = JSON.parse(e.data);
			} catch {
				return;
			}
			if (msg.t === "ping") {
				if (slot.state?.readyState === "open") slot.state.send(JSON.stringify({ t: "pong" }));
			} else if (msg.t === "pong") {
				if (slot.pingSentAt) {
					slot.info.rttMs = Math.round(performance.now() - slot.pingSentAt);
					slot.pingSentAt = void 0;
					this.emitPeers();
				}
			} else this.opts.onMessage?.(slot.info.id, msg.d, channel.label === "state" ? "state" : "reliable");
		};
	}
	/** Apply buffered ICE candidates once a remote description is in place. */
	async flushPendingCandidates(slot) {
		while (slot.pendingCandidates.length > 0) {
			const candidate = slot.pendingCandidates.shift();
			try {
				await slot.pc.addIceCandidate(candidate);
			} catch (err) {
				if (!slot.ignoreOffer) console.warn("[p2p] addIceCandidate failed:", err);
			}
			if (this.closed) return;
		}
	}
	async onSignal(from, kind, payload, roster) {
		if (this.closed) return;
		let slot = this.peers.get(from);
		if (!slot) {
			if (!roster.has(from)) return;
			const created = this.connectTo(from, "", false);
			if (!created) return;
			slot = created;
		}
		const polite = this.opts.selfId < from;
		try {
			if (kind === "offer" || kind === "answer") {
				const description = payload;
				const collision = kind === "offer" && (slot.makingOffer || slot.pc.signalingState !== "stable");
				slot.ignoreOffer = !polite && collision;
				if (slot.ignoreOffer) return;
				try {
					await slot.pc.setRemoteDescription(description);
				} catch (err) {
					if (kind !== "offer" || slot.recreatedForOffer) throw err;
					const attempts = slot.recoveryAttempts;
					const name = slot.info.name;
					slot.pc.close();
					this.peers.delete(from);
					const fresh = this.connectTo(from, name, false);
					if (!fresh) return;
					fresh.recoveryAttempts = attempts;
					fresh.recreatedForOffer = true;
					slot = fresh;
					await slot.pc.setRemoteDescription(description);
				}
				if (this.closed) return;
				await this.flushPendingCandidates(slot);
				if (this.closed) return;
				if (kind === "offer") {
					await slot.pc.setLocalDescription();
					if (this.closed) return;
					await this.sendSignal(from, "answer", slot.pc.localDescription.toJSON());
				}
			} else if (kind === "ice") {
				const candidate = payload;
				if (!slot.pc.remoteDescription) {
					slot.pendingCandidates.push(candidate);
					return;
				}
				try {
					await slot.pc.addIceCandidate(candidate);
				} catch (err) {
					if (!slot.ignoreOffer) console.warn("[p2p] addIceCandidate failed:", err);
				}
			}
		} catch {}
	}
	/**
	* Signals are serialized per remote peer (a candidate must never overtake
	* its SDP into the DB) and retried on failure with short backoff.
	*/
	sendSignal(to, kind, payload) {
		const next = (this.signalQueues.get(to) ?? Promise.resolve()).then(() => this.postSignal(to, kind, payload));
		this.signalQueues.set(to, next.catch(() => {}));
		return next;
	}
	async postSignal(to, kind, payload) {
		for (let attempt = 0;; attempt++) {
			if (this.closed) return;
			try {
				const res = await fetch("/api/rtc", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						op: "signal",
						room: this.opts.room,
						from: this.opts.selfId,
						to,
						kind,
						payload
					})
				});
				if (res.ok) return;
				throw new Error(`signal POST failed: ${res.status}`);
			} catch (err) {
				if (attempt >= SIGNAL_RETRY_DELAYS_MS.length) {
					console.warn(`[p2p] signal ${kind} to ${to} failed after retries`, err);
					return;
				}
				await new Promise((r) => setTimeout(r, SIGNAL_RETRY_DELAYS_MS[attempt]));
			}
		}
	}
	pingAll() {
		const wire = JSON.stringify({ t: "ping" });
		for (const slot of this.peers.values()) {
			if (slot.state?.readyState !== "open") continue;
			const stale = slot.pingSentAt !== void 0 && performance.now() - slot.pingSentAt > 2 * PING_INTERVAL_MS;
			if (slot.pingSentAt === void 0 || stale) {
				slot.pingSentAt = performance.now();
				slot.state.send(wire);
			}
		}
	}
	/**
	* Stuck-pair recovery, piggybacked on the ping interval. A pair that has
	* made no progress for STALL_MS gets rebuilt by the dialer with a FRESH
	* RTCPeerConnection (new DTLS identity — fixes the suspend/resume
	* fingerprint wedge). After MAX_RECOVERY_ATTEMPTS the pair is terminal:
	* visible to the app as its last connectionState, ignored by fast-poll.
	*/
	watchdog() {
		if (this.closed) return;
		const now = Date.now();
		for (const [peerId, slot] of this.peers) {
			const live = slot.pc.connectionState;
			if (live !== slot.info.connectionState) {
				slot.info.connectionState = live;
				if (live === "connecting" || live === "connected") slot.lastProgressAt = now;
				this.emitPeers();
			}
			if (slot.terminal || live === "connected") continue;
			if (now - slot.lastProgressAt <= STALL_MS) continue;
			if (slot.recoveryAttempts >= MAX_RECOVERY_ATTEMPTS) {
				slot.terminal = true;
				this.emitPeers();
				continue;
			}
			slot.recoveryAttempts += 1;
			slot.lastProgressAt = now;
			if (this.opts.selfId > peerId) {
				const { name } = slot.info;
				const attempts = slot.recoveryAttempts;
				slot.pc.close();
				this.peers.delete(peerId);
				const fresh = this.connectTo(peerId, name, true);
				if (fresh) fresh.recoveryAttempts = attempts;
				this.schedulePoll(FAST_POLL_MS);
			}
		}
	}
	async readCandidateType(slot) {
		try {
			const stats = await slot.pc.getStats();
			let selected;
			stats.forEach((s) => {
				if (s.type === "candidate-pair" && s.nominated) selected = s;
			});
			const localId = selected?.localCandidateId;
			if (localId) {
				const local = stats.get(localId);
				slot.info.candidateType = local?.candidateType ?? null;
				this.emitPeers();
			}
		} catch {}
	}
	emitPeers() {
		const list = this.peerList();
		const fingerprint = JSON.stringify(list.map((p) => [
			p.id,
			p.name,
			p.connectionState,
			p.candidateType,
			p.rttMs
		]));
		if (fingerprint === this.lastPeersFingerprint) return;
		this.lastPeersFingerprint = fingerprint;
		this.opts.onPeersChanged?.(list);
	}
};
/**
* React binding for P2PRoom. Identity and room id are captured once on mount
* (useState initializers) so re-renders never tear down the mesh.
*/
function defaultRoom() {
	if (typeof window === "undefined") return "room-ssr";
	return `room-${window.location.hostname.split(".")[0]}`.slice(0, 64);
}
function useP2PRoom(options = {}) {
	const [selfId] = (0, import_react.useState)(() => options.selfId ?? `p-${Math.random().toString(36).slice(2, 10)}`);
	const [room] = (0, import_react.useState)(() => options.room ?? defaultRoom());
	const [name] = (0, import_react.useState)(() => options.name ?? selfId);
	const [peers, setPeers] = (0, import_react.useState)([]);
	const [joined, setJoined] = (0, import_react.useState)(false);
	const roomRef = (0, import_react.useRef)(null);
	const listeners = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	const iceServers = options.iceServers;
	(0, import_react.useEffect)(() => {
		const p2p = new P2PRoom({
			room,
			selfId,
			name,
			iceServers,
			onPeersChanged: setPeers,
			onMessage: (from, data, channel) => {
				for (const fn of listeners.current) fn(from, data, channel);
			},
			onConnected: () => setJoined(true)
		});
		roomRef.current = p2p;
		p2p.join();
		return () => {
			roomRef.current = null;
			p2p.close();
		};
	}, [
		room,
		selfId,
		name,
		iceServers
	]);
	return {
		selfId,
		room,
		peers,
		joined,
		broadcast: (0, import_react.useCallback)((data) => roomRef.current?.broadcast(data), []),
		send: (0, import_react.useCallback)((data, peerId) => roomRef.current?.send(data, peerId), []),
		onMessage: (0, import_react.useCallback)((fn) => {
			listeners.current.add(fn);
			return () => {
				listeners.current.delete(fn);
			};
		}, [])
	};
}
var DB_NAME = "offx";
var STORE = "kv";
function openDb() {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, 1);
		req.onupgradeneeded = () => {
			if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}
async function cacheSet(key, value) {
	if (typeof indexedDB === "undefined") return;
	try {
		const db = await openDb();
		await new Promise((resolve, reject) => {
			const tx = db.transaction(STORE, "readwrite");
			tx.objectStore(STORE).put({
				v: value,
				t: Date.now()
			}, key);
			tx.oncomplete = () => resolve();
			tx.onerror = () => reject(tx.error);
		});
	} catch {}
}
async function cacheGet(key) {
	if (typeof indexedDB === "undefined") return null;
	try {
		const db = await openDb();
		return await new Promise((resolve, reject) => {
			const req = db.transaction(STORE, "readonly").objectStore(STORE).get(key);
			req.onsuccess = () => {
				const row = req.result;
				resolve(row ? row.v : null);
			};
			req.onerror = () => reject(req.error);
		});
	} catch {
		return null;
	}
}
function useOnline() {
	const [online, setOnline] = (0, import_react.useState)(() => typeof navigator === "undefined" ? true : navigator.onLine);
	(0, import_react.useEffect)(() => {
		const on = () => setOnline(true);
		const off = () => setOnline(false);
		window.addEventListener("online", on);
		window.addEventListener("offline", off);
		return () => {
			window.removeEventListener("online", on);
			window.removeEventListener("offline", off);
		};
	}, []);
	return online;
}
function assertOnline() {
	if (typeof navigator !== "undefined" && !navigator.onLine) throw new Error("Dafür brauchst du Internet.");
}
var WLAN_CODE_RE = /^[A-HJ-NP-Z2-9]{4}$/;
function randomWlanCode() {
	const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	let out = "";
	const buf = /* @__PURE__ */ new Uint32Array(4);
	crypto.getRandomValues(buf);
	for (let i = 0; i < 4; i += 1) out += alphabet[buf[i] % 32];
	return out;
}
function peerIdFromUser(userId) {
	return userId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48) || `p-${Math.random().toString(36).slice(2, 10)}`;
}
var CACHE_KEY = "offx-lan-net";
var CODE_KEY = "offx-lan-code";
var SOLO_KEY = "offx-lan-solo";
var BT_KEY = "offx-bt-code";
function roomSafe(raw) {
	return raw.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48) || "local";
}
function shortHash(s) {
	let h = 2166136261;
	for (let i = 0; i < s.length; i += 1) {
		h ^= s.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return (h >>> 0).toString(36);
}
function isLoopback(ip) {
	return ip === "::1" || ip.startsWith("127.");
}
function subnetOf(ip) {
	const v4 = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
	if (!v4) return null;
	return `${v4[1]}.${v4[2]}.${v4[3]}`;
}
function isPrivateV4(ip) {
	const p = ip.split(".").map(Number);
	if (p.length !== 4 || p.some((n) => Number.isNaN(n))) return false;
	const [a, b] = p;
	if (a === 10) return true;
	if (a === 192 && b === 168) return true;
	if (a === 172 && b >= 16 && b <= 31) return true;
	if (a === 169 && b === 254) return true;
	if (a === 100 && b >= 64 && b <= 127) return true;
	return false;
}
function parseIce(cand) {
	const typ = cand.match(/\btyp\s+(\w+)/)?.[1];
	if (!typ) return null;
	const v4 = cand.match(/\b(\d{1,3}(?:\.\d{1,3}){3})\b/)?.[1];
	if (v4 && !isLoopback(v4)) return {
		ip: v4,
		typ
	};
	return null;
}
async function gatherIce(timeoutMs) {
	if (typeof RTCPeerConnection === "undefined") return {
		host: null,
		srflx: null
	};
	const pc = new RTCPeerConnection({ iceServers: [{ urls: ["stun:stun.l.google.com:19302", "stun:stun.cloudflare.com:3478"] }] });
	try {
		pc.createDataChannel("lan");
		const offer = await pc.createOffer();
		await pc.setLocalDescription(offer);
		return await new Promise((resolve) => {
			let host = null;
			let srflx = null;
			const done = () => resolve({
				host,
				srflx
			});
			const timer = window.setTimeout(done, timeoutMs);
			pc.onicecandidate = (ev) => {
				const raw = ev.candidate?.candidate ?? "";
				const hit = raw ? parseIce(raw) : null;
				if (hit?.typ === "host" && isPrivateV4(hit.ip) && !host) host = hit.ip;
				if (hit?.typ === "srflx" && !isPrivateV4(hit.ip) && !srflx) srflx = hit.ip;
				if (host && srflx) {
					window.clearTimeout(timer);
					done();
				}
				if (!ev.candidate) {
					window.clearTimeout(timer);
					done();
				}
			};
		});
	} catch {
		return {
			host: null,
			srflx: null
		};
	} finally {
		pc.close();
	}
}
function connectionType() {
	if (typeof navigator === "undefined") return void 0;
	return navigator.connection?.type;
}
function soloNet() {
	if (typeof localStorage === "undefined") return {
		id: "lan-solo",
		label: "Kein WLAN"
	};
	let token = localStorage.getItem(SOLO_KEY);
	if (!token) {
		token = shortHash(crypto.randomUUID());
		localStorage.setItem(SOLO_KEY, token);
	}
	return {
		id: `lan-solo-${roomSafe(token)}`,
		label: "Kein WLAN"
	};
}
function fromHits(host, srflx) {
	const subnet = host ? subnetOf(host) : null;
	if (srflx) return {
		id: `lan-wan-${roomSafe(shortHash(srflx))}`,
		label: subnet ? `Netz ${subnet}.x` : "Dieses WLAN"
	};
	if (subnet) return {
		id: `lan-${roomSafe(subnet.replace(/\./g, "-"))}`,
		label: `Netz ${subnet}.x`
	};
	return {
		id: "lan-local",
		label: "Lokales Netz"
	};
}
/** Fingerprint this Wi-Fi: same NAT ≈ same café / WG / office. */
async function detectLanNet() {
	if (connectionType() === "cellular") return soloNet();
	const { host, srflx } = await gatherIce(2200);
	if (!host && !srflx) {
		if (connectionType() === "cellular") return soloNet();
		return {
			id: "lan-local",
			label: "Lokales Netz"
		};
	}
	const net = fromHits(host, srflx);
	writeCachedLanNet(net);
	return net;
}
function storage() {
	if (typeof localStorage !== "undefined") return localStorage;
	if (typeof sessionStorage !== "undefined") return sessionStorage;
	return null;
}
function readCachedLanNet() {
	const store = storage();
	if (!store) return null;
	try {
		const raw = store.getItem(CACHE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		if (!parsed?.id || !parsed.label) return null;
		return {
			id: String(parsed.id).slice(0, 64),
			label: String(parsed.label).slice(0, 48)
		};
	} catch {
		return null;
	}
}
function writeCachedLanNet(net) {
	storage()?.setItem(CACHE_KEY, JSON.stringify(net));
}
function lanPeerId(userId) {
	return peerIdFromUser(userId);
}
function lanConvId(a, b) {
	const [x, y] = a < b ? [a, b] : [b, a];
	return `c-${roomSafe(x).slice(0, 22)}${roomSafe(y).slice(0, 22)}`.slice(0, 64);
}
function setForcedLanCode(code) {
	const store = storage();
	if (!store) return;
	if (!code) store.removeItem(CODE_KEY);
	else store.setItem(CODE_KEY, code);
}
function forcedLanNet() {
	const store = storage();
	if (!store) return null;
	const code = store.getItem(CODE_KEY);
	if (!code || !/^[A-HJ-NP-Z2-9]{4}$/.test(code)) return null;
	return {
		id: `lan-${code}`,
		label: `Raum ${code}`
	};
}
function readOnlineCode() {
	const code = storage()?.getItem(CODE_KEY);
	return code && /^[A-HJ-NP-Z2-9]{4}$/.test(code) ? code : null;
}
function makePairCode() {
	const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	let out = "";
	const buf = /* @__PURE__ */ new Uint32Array(4);
	crypto.getRandomValues(buf);
	for (let i = 0; i < 4; i += 1) out += alphabet[buf[i] % 32];
	return out;
}
function readBtCode() {
	const code = storage()?.getItem(BT_KEY);
	return code && /^[A-HJ-NP-Z2-9]{4}$/.test(code) ? code : null;
}
function setBtCode(code) {
	const store = storage();
	if (!store) return;
	if (!code) store.removeItem(BT_KEY);
	else store.setItem(BT_KEY, code);
}
function bluetoothNet() {
	let code = readBtCode();
	if (!code) {
		code = makePairCode();
		setBtCode(code);
	}
	return {
		id: `bt-${code}`,
		label: `BT ${code}`
	};
}
function useLanBus(options) {
	const { room, selfId, onEvent } = options;
	const cursor = (0, import_react.useRef)(0);
	const onEventRef = (0, import_react.useRef)(onEvent);
	onEventRef.current = onEvent;
	const joined = (0, import_react.useRef)(false);
	const post = (0, import_react.useCallback)((payload) => {
		fetch("/api/lan", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				room,
				from: selfId,
				payload
			})
		}).catch(() => {});
	}, [room, selfId]);
	(0, import_react.useEffect)(() => {
		cursor.current = 0;
		joined.current = false;
		let stopped = false;
		let timer = null;
		const tick = async () => {
			if (stopped) return;
			try {
				const params = new URLSearchParams({
					room,
					peer: selfId,
					since: String(cursor.current)
				});
				const res = await fetch(`/api/lan?${params}`);
				if (stopped) return;
				if (res.ok) {
					const body = await res.json();
					for (const ev of body.events ?? []) {
						cursor.current = Math.max(cursor.current, ev.id);
						onEventRef.current(ev.payload);
					}
					joined.current = true;
				}
			} catch {}
			if (!stopped) timer = setTimeout(() => void tick(), joined.current ? 700 : 400);
		};
		tick();
		return () => {
			stopped = true;
			if (timer) clearTimeout(timer);
		};
	}, [room, selfId]);
	return { post };
}
async function netForMode(mode) {
	if (mode === "online") {
		const existing = forcedLanNet();
		if (existing) return existing;
		setForcedLanCode(randomWlanCode());
		return forcedLanNet() ?? {
			id: "lan-online",
			label: "Online"
		};
	}
	if (mode === "bluetooth") return bluetoothNet();
	return detectLanNet();
}
var emptyState = {
	posts: [],
	comments: {},
	threads: {},
	people: {},
	deleted: []
};
var LanContext = (0, import_react.createContext)(null);
function useLan() {
	const ctx = (0, import_react.useContext)(LanContext);
	if (!ctx) throw new Error("useLan outside LanProvider");
	return ctx;
}
function LanProvider({ me, children }) {
	const { mode } = useSettings();
	const [net, setNet] = (0, import_react.useState)(() => mode === "online" ? forcedLanNet() : mode === "bluetooth" ? null : readCachedLanNet() ?? null);
	(0, import_react.useEffect)(() => {
		let alive = true;
		netForMode(mode).then((next) => {
			if (!alive) return;
			writeCachedLanNet(next);
			setNet(next);
		});
		return () => {
			alive = false;
		};
	}, [mode]);
	if (!net) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LanContext.Provider, {
		value: placeholderApi(me, null, mode),
		children
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LanMesh, {
		me,
		net,
		mode,
		children
	}, `${mode}-${net.id}`);
}
function placeholderApi(me, net, mode) {
	return {
		me,
		net,
		mode,
		joined: false,
		peers: [],
		people: [],
		posts: [],
		inbox: [],
		commentsFor: () => [],
		getThread: () => null,
		publishPost: () => void 0,
		deletePost: () => void 0,
		toggleLike: () => void 0,
		addComment: () => void 0,
		openConversation: () => "",
		sendText: () => [],
		sendImage: () => [],
		sendPayment: () => [],
		resolvePayment: () => [],
		setMe: () => void 0
	};
}
var BT_ICE = [];
function LanMesh({ me: initialMe, net, mode, children }) {
	const [me, setMe] = (0, import_react.useState)(initialMe);
	const [state, setState] = (0, import_react.useState)(emptyState);
	const ready = (0, import_react.useRef)(false);
	const tabId = (0, import_react.useRef)(typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `tab-${Math.random().toString(36).slice(2)}`);
	const bcRef = (0, import_react.useRef)(null);
	const selfId = (0, import_react.useMemo)(() => lanPeerId(me.userId), [me.userId]);
	const p2p = useP2PRoom({
		room: net.id,
		selfId,
		name: me.displayName.slice(0, 64),
		iceServers: mode === "bluetooth" ? BT_ICE : void 0
	});
	const persistKey = `lan-${net.id}-${me.userId}`;
	(0, import_react.useEffect)(() => {
		cacheGet(persistKey).then((saved) => {
			if (saved) setState(normalizeState(saved));
			ready.current = true;
		});
	}, [persistKey]);
	(0, import_react.useEffect)(() => {
		if (!ready.current) return;
		cacheSet(persistKey, state);
	}, [persistKey, state]);
	const peopleById = state.people;
	const sendReliable = p2p.send;
	const meId = me.userId;
	const applyWire = (0, import_react.useCallback)((data) => {
		const msg = data;
		if (!msg || typeof msg !== "object" || !("t" in msg)) return;
		setState((prev) => {
			if (msg.t === "hello") {
				if (msg.profile.userId === meId) return prev;
				return {
					...prev,
					people: {
						...prev.people,
						[msg.profile.userId]: msg.profile
					}
				};
			}
			if (msg.t === "snap") {
				const gone = /* @__PURE__ */ new Set([...prev.deleted, ...msg.deleted ?? []]);
				const comments = {
					...msg.comments,
					...prev.comments
				};
				for (const id of gone) delete comments[id];
				return {
					...prev,
					posts: mergePosts(prev.posts.filter((p) => !gone.has(p.id)), (msg.posts ?? []).filter((p) => !gone.has(p.id)), meId),
					comments,
					deleted: [...gone].slice(-200)
				};
			}
			if (msg.t === "post") {
				if (prev.deleted.includes(msg.post.id)) return prev;
				return {
					...prev,
					posts: mergePosts(prev.posts, [msg.post], meId)
				};
			}
			if (msg.t === "delete") {
				const existing = prev.posts.find((p) => p.id === msg.postId);
				if (existing && existing.author.userId !== msg.userId) return prev;
				return dropPost(prev, msg.postId);
			}
			if (msg.t === "like") return {
				...prev,
				posts: prev.posts.map((p) => p.id !== msg.postId ? p : applyLike(p, msg.userId, msg.liked, meId))
			};
			if (msg.t === "comment") {
				if (prev.deleted.includes(msg.comment.postId)) return prev;
				const list = prev.comments[msg.comment.postId] ?? [];
				if (list.some((c) => c.id === msg.comment.id)) return prev;
				return {
					...prev,
					comments: {
						...prev.comments,
						[msg.comment.postId]: [...list, msg.comment]
					},
					posts: prev.posts.map((p) => p.id === msg.comment.postId ? {
						...p,
						commentCount: p.commentCount + 1
					} : p),
					people: {
						...prev.people,
						[msg.comment.author.userId]: msg.comment.author
					}
				};
			}
			if (msg.t === "chat" || msg.t === "pay-res") {
				const message = msg.message;
				const list = prev.threads[message.conversationId] ?? [];
				const exists = list.some((m) => m.id === message.id);
				const threads = {
					...prev.threads,
					[message.conversationId]: exists ? list.map((m) => m.id === message.id ? message : m) : [...list, message].slice(-400)
				};
				const people = { ...prev.people };
				if (msg.profile.userId !== meId) people[msg.profile.userId] = msg.profile;
				const tx = message.payment;
				if (msg.t === "pay-res" && tx?.status === "declined" && tx.kind === "send" && tx.senderId === meId) queueMicrotask(() => setMe((cur) => ({
					...cur,
					walletBalance: toMoney(Number(cur.walletBalance) + Number(tx.amount))
				})));
				if (msg.t === "pay-res" && tx?.status === "completed" && tx.kind === "request" && tx.senderId === meId) queueMicrotask(() => setMe((cur) => ({
					...cur,
					walletBalance: toMoney(Number(cur.walletBalance) + Number(tx.net))
				})));
				return {
					...prev,
					threads,
					people
				};
			}
			return prev;
		});
		if (msg.t === "pay-res" && msg.balanceHint?.userId === meId && msg.balanceHint.walletBalance) setMe((cur) => ({
			...cur,
			walletBalance: msg.balanceHint.walletBalance
		}));
	}, [meId]);
	const bus = useLanBus({
		room: net.id,
		selfId,
		onEvent: applyWire
	});
	(0, import_react.useEffect)(() => p2p.onMessage((_from, data) => applyWire(data)), [p2p, applyWire]);
	(0, import_react.useEffect)(() => {
		if (typeof BroadcastChannel === "undefined") return;
		const ch = new BroadcastChannel(`offx-${net.id}`);
		ch.onmessage = (ev) => {
			const data = ev.data;
			if (!data || data.tab === tabId.current) return;
			applyWire(data.msg);
		};
		bcRef.current = ch;
		return () => {
			bcRef.current = null;
			ch.close();
		};
	}, [net.id, applyWire]);
	const fanout = (0, import_react.useCallback)((payload, to) => {
		sendReliable(payload, to);
		try {
			bcRef.current?.postMessage({
				tab: tabId.current,
				msg: payload
			});
		} catch {}
		if (!to) bus.post(payload);
	}, [sendReliable, bus]);
	const hello = (0, import_react.useCallback)(() => {
		fanout({
			t: "hello",
			profile: me
		});
	}, [me, fanout]);
	(0, import_react.useEffect)(() => {
		hello();
		const t = window.setInterval(hello, 6e3);
		return () => window.clearInterval(t);
	}, [hello]);
	const greeted = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	(0, import_react.useEffect)(() => {
		for (const peer of p2p.peers) {
			if (peer.connectionState !== "connected") continue;
			if (greeted.current.has(peer.id)) continue;
			greeted.current.add(peer.id);
			sendReliable({
				t: "hello",
				profile: me
			}, peer.id);
			if (selfId < peer.id) sendReliable({
				t: "snap",
				posts: state.posts.slice(0, 40),
				comments: state.comments,
				deleted: state.deleted
			}, peer.id);
		}
	}, [
		p2p.peers,
		me,
		selfId,
		sendReliable,
		state.posts,
		state.comments,
		state.deleted
	]);
	const people = (0, import_react.useMemo)(() => Object.values(peopleById).filter((p) => p.userId !== me.userId && !p.isSystem), [peopleById, me.userId]);
	const inbox = (0, import_react.useMemo)(() => {
		const rows = [];
		for (const [id, messages] of Object.entries(state.threads)) {
			const last = messages[messages.length - 1];
			if (!last) continue;
			const otherId = last.senderId === me.userId ? messages.find((m) => m.senderId !== me.userId)?.senderId : last.senderId;
			const other = otherId && peopleById[otherId] || people.find((p) => lanConvId(me.userId, p.userId) === id);
			if (!other) continue;
			rows.push({
				id,
				other,
				lastMessageAt: last.createdAt,
				lastMessagePreview: last.type === "payment" ? "NOX" : last.type === "image" ? "Foto" : last.body.slice(0, 80),
				unread: last.senderId !== me.userId
			});
		}
		rows.sort((a, b) => a.lastMessageAt < b.lastMessageAt ? 1 : -1);
		return rows;
	}, [
		state.threads,
		peopleById,
		people,
		me.userId
	]);
	const publishPost = (input) => {
		const post = {
			id: crypto.randomUUID(),
			author: me,
			caption: input.caption.trim().slice(0, 500),
			mediaType: input.mediaType,
			mediaUrl: input.mediaUrl,
			posterUrl: input.posterUrl,
			createdAt: (/* @__PURE__ */ new Date()).toISOString(),
			likeCount: 0,
			commentCount: 0,
			liked: false,
			likedBy: []
		};
		setState((prev) => ({
			...prev,
			posts: mergePosts(prev.posts, [post], me.userId)
		}));
		fanout({
			t: "post",
			post
		});
	};
	const deletePost = (postId) => {
		const post = state.posts.find((p) => p.id === postId);
		if (!post || post.author.userId !== me.userId) return;
		setState((prev) => dropPost(prev, postId));
		fanout({
			t: "delete",
			postId,
			userId: me.userId
		});
	};
	const toggleLike = (postId) => {
		const post = state.posts.find((p) => p.id === postId);
		if (!post) return;
		const liked = !(post.likedBy.includes(me.userId) || post.liked);
		setState((prev) => ({
			...prev,
			posts: prev.posts.map((p) => p.id !== postId ? p : applyLike(p, me.userId, liked, me.userId))
		}));
		fanout({
			t: "like",
			postId,
			userId: me.userId,
			liked
		});
	};
	const addComment = (postId, body) => {
		const text = body.trim();
		if (!text) return;
		const comment = {
			id: crypto.randomUUID(),
			postId,
			author: me,
			body: text.slice(0, 500),
			createdAt: (/* @__PURE__ */ new Date()).toISOString()
		};
		setState((prev) => ({
			...prev,
			comments: {
				...prev.comments,
				[postId]: [...prev.comments[postId] ?? [], comment]
			},
			posts: prev.posts.map((p) => p.id === postId ? {
				...p,
				commentCount: p.commentCount + 1
			} : p)
		}));
		fanout({
			t: "comment",
			comment
		});
	};
	const openConversation = (otherUserId) => {
		const id = lanConvId(me.userId, otherUserId);
		setState((prev) => ({
			...prev,
			threads: prev.threads[id] ? prev.threads : {
				...prev.threads,
				[id]: []
			}
		}));
		return id;
	};
	const appendChat = (message) => {
		let next = [];
		setState((prev) => {
			next = [...prev.threads[message.conversationId] ?? [], message].slice(-400);
			return {
				...prev,
				threads: {
					...prev.threads,
					[message.conversationId]: next
				}
			};
		});
		fanout({
			t: "chat",
			message,
			profile: me
		});
		return next;
	};
	const sendText = (conversationId, body) => {
		const text = body.trim();
		if (!text) return state.threads[conversationId] ?? [];
		return appendChat({
			id: crypto.randomUUID(),
			conversationId,
			senderId: me.userId,
			type: "text",
			body: text.slice(0, 4e3),
			imageUrl: null,
			createdAt: (/* @__PURE__ */ new Date()).toISOString(),
			payment: null
		});
	};
	const sendImage = (conversationId, imageUrl) => appendChat({
		id: crypto.randomUUID(),
		conversationId,
		senderId: me.userId,
		type: "image",
		body: "",
		imageUrl,
		createdAt: (/* @__PURE__ */ new Date()).toISOString(),
		payment: null
	});
	const sendPayment = (conversationId, kind, amount, note) => {
		const gross = parseAmount(amount);
		const split = splitNox(gross);
		if (kind === "send" && Number(me.walletBalance) < Number(split.gross)) throw new Error("Nicht genug Guthaben.");
		const other = threadOther(conversationId, me.userId, peopleById, people);
		if (!other) throw new Error("Niemand in diesem Chat.");
		if (kind === "send") setMe((cur) => ({
			...cur,
			walletBalance: toMoney(Number(cur.walletBalance) - Number(split.gross))
		}));
		const payment = {
			id: crypto.randomUUID(),
			conversationId,
			senderId: me.userId,
			recipientId: other.userId,
			amount: split.gross,
			fee: split.fee,
			net: split.net,
			euroPaid: null,
			currency: "NOX",
			note: note.trim().slice(0, 80),
			kind,
			status: "pending",
			createdAt: (/* @__PURE__ */ new Date()).toISOString(),
			resolvedAt: null
		};
		return appendChat({
			id: crypto.randomUUID(),
			conversationId,
			senderId: me.userId,
			type: "payment",
			body: payment.note,
			imageUrl: null,
			createdAt: payment.createdAt,
			payment
		});
	};
	const resolvePayment = (transactionId, action) => {
		let convId = "";
		let nextMsgs = [];
		setState((prev) => {
			const threads = { ...prev.threads };
			for (const [id, list] of Object.entries(threads)) {
				const idx = list.findIndex((m) => m.payment?.id === transactionId);
				if (idx < 0) continue;
				convId = id;
				const msg = list[idx];
				const tx = msg.payment;
				if (!tx || tx.status !== "pending") break;
				const completed = {
					...tx,
					status: action === "accept" ? "completed" : "declined",
					resolvedAt: (/* @__PURE__ */ new Date()).toISOString()
				};
				const updated = {
					...msg,
					payment: completed
				};
				nextMsgs = list.map((m, i) => i === idx ? updated : m);
				threads[id] = nextMsgs;
				fanout({
					t: "pay-res",
					message: updated,
					profile: me
				});
				break;
			}
			return {
				...prev,
				threads
			};
		});
		const tx = nextMsgs.find((m) => m.payment?.id === transactionId)?.payment;
		if (tx) {
			if (action === "decline" && tx.kind === "send" && tx.senderId === me.userId) setMe((cur) => ({
				...cur,
				walletBalance: toMoney(Number(cur.walletBalance) + Number(tx.amount))
			}));
			if (action === "accept" && tx.kind === "send" && tx.recipientId === me.userId) setMe((cur) => ({
				...cur,
				walletBalance: toMoney(Number(cur.walletBalance) + Number(tx.net))
			}));
			if (action === "accept" && tx.kind === "request" && tx.recipientId === me.userId) setMe((cur) => ({
				...cur,
				walletBalance: toMoney(Number(cur.walletBalance) - Number(tx.amount))
			}));
			if (action === "accept" && tx.kind === "request" && tx.senderId === me.userId) setMe((cur) => ({
				...cur,
				walletBalance: toMoney(Number(cur.walletBalance) + Number(tx.net))
			}));
		}
		return nextMsgs.length ? nextMsgs : state.threads[convId] ?? [];
	};
	const getThread = (conversationId) => {
		const other = threadOther(conversationId, me.userId, peopleById, people);
		if (!other) return null;
		return {
			conversationId,
			other,
			me,
			messages: state.threads[conversationId] ?? []
		};
	};
	const api = {
		me,
		net,
		mode,
		joined: p2p.joined,
		peers: p2p.peers,
		people,
		posts: state.posts.map((p) => ({
			...p,
			liked: (p.likedBy ?? []).includes(me.userId) || p.liked,
			likeCount: Math.max(p.likeCount, (p.likedBy ?? []).length)
		})),
		inbox,
		commentsFor: (postId) => state.comments[postId] ?? [],
		getThread,
		publishPost,
		deletePost,
		toggleLike,
		addComment,
		openConversation,
		sendText,
		sendImage,
		sendPayment,
		resolvePayment,
		setMe
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LanContext.Provider, {
		value: api,
		children
	});
}
function dropPost(prev, postId) {
	if (prev.deleted.includes(postId) && !prev.posts.some((p) => p.id === postId)) return prev;
	const comments = { ...prev.comments };
	delete comments[postId];
	return {
		...prev,
		posts: prev.posts.filter((p) => p.id !== postId),
		comments,
		deleted: prev.deleted.includes(postId) ? prev.deleted : [...prev.deleted, postId].slice(-200)
	};
}
function likedByOf(p) {
	return [...new Set(p.likedBy ?? [])];
}
function applyLike(p, userId, liked, meId) {
	const set = new Set(likedByOf(p));
	if (liked) set.add(userId);
	else set.delete(userId);
	const likedBy = [...set];
	return {
		...p,
		likedBy,
		likeCount: likedBy.length,
		liked: likedBy.includes(meId)
	};
}
function mergePosts(current, incoming, meId) {
	const map = /* @__PURE__ */ new Map();
	for (const p of current) map.set(p.id, {
		...p,
		likedBy: likedByOf(p)
	});
	for (const p of incoming) {
		const prev = map.get(p.id);
		if (!prev) {
			map.set(p.id, {
				...p,
				likedBy: likedByOf(p),
				liked: likedByOf(p).includes(meId) || p.liked,
				likeCount: Math.max(p.likeCount, likedByOf(p).length)
			});
			continue;
		}
		const likedBy = [.../* @__PURE__ */ new Set([...likedByOf(prev), ...likedByOf(p)])];
		map.set(p.id, {
			...p,
			likedBy,
			liked: likedBy.includes(meId),
			likeCount: likedBy.length,
			commentCount: Math.max(prev.commentCount, p.commentCount)
		});
	}
	return [...map.values()].sort((a, b) => a.createdAt < b.createdAt ? 1 : -1).slice(0, 80);
}
function normalizeState(saved) {
	return {
		...saved,
		posts: (saved.posts ?? []).map((p) => ({
			...p,
			likedBy: likedByOf(p)
		})),
		people: saved.people ?? {},
		threads: saved.threads ?? {},
		comments: saved.comments ?? {},
		deleted: saved.deleted ?? []
	};
}
function threadOther(conversationId, meId, peopleById, people) {
	for (const p of Object.values(peopleById)) if (p.userId !== meId && lanConvId(meId, p.userId) === conversationId) return p;
	return people.find((p) => lanConvId(meId, p.userId) === conversationId) ?? null;
}
function useNav() {
	const t = useT();
	return [
		{
			to: "/",
			label: t("nav.feed"),
			icon: House,
			exact: true
		},
		{
			to: "/messages",
			label: t("nav.chats"),
			icon: MessageCircle,
			exact: false
		},
		{
			to: "/create",
			label: t("nav.new"),
			icon: SquarePlus,
			exact: true
		},
		{
			to: "/online",
			label: t("nav.online"),
			icon: Globe,
			exact: true
		},
		{
			to: "/profile",
			label: t("nav.profile"),
			icon: UserRound,
			exact: true
		}
	];
}
function isActive(pathname, to, exact) {
	if (exact) return pathname === to;
	if (to === "/messages") return pathname === "/messages" || pathname.startsWith("/c/");
	return pathname === to || pathname.startsWith(`${to}/`);
}
function LanChip() {
	const lan = useLan();
	const { mode, t } = useSettings();
	const here = lan.people.length;
	const Icon = mode === "bluetooth" ? Bluetooth : mode === "online" ? Globe : Wifi;
	const label = lan.net?.label ?? (mode === "bluetooth" ? t("lan.bluetooth") : mode === "online" ? t("lan.online") : t("lan.local"));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "inline-flex max-w-[46vw] items-center gap-1.5 rounded-full bg-elevated px-2.5 py-1 text-[11px] text-muted lg:max-w-[70vw]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-3.5 shrink-0 text-fg" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "truncate",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-faint",
				children: "·"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "shrink-0 tabular-nums",
				children: here === 0 ? t("lan.onlyYou") : t("lan.here", { n: here })
			})
		]
	});
}
function AppFrame({ children, hideChrome = false }) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const nav = useNav();
	const t = useT();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-bg px-4 py-6 lg:flex",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "mb-2 px-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OffxLockup, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-6 px-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LanChip, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
						className: "flex flex-1 flex-col gap-1",
						children: [nav.map((item) => {
							const active = isActive(pathname, item.to, item.exact);
							const Icon = item.icon;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: item.to,
								className: cn("flex h-12 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-150", active ? "bg-elevated text-fg" : "text-muted hover:bg-elevated hover:text-fg"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
									className: "size-5",
									strokeWidth: active ? 2.2 : 1.8
								}), item.label]
							}, item.to);
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/settings",
							className: cn("flex h-12 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-150", pathname === "/settings" ? "bg-elevated text-fg" : "text-muted hover:bg-elevated hover:text-fg"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, {
								className: "size-5",
								strokeWidth: pathname === "/settings" ? 2.2 : 1.8
							}), t("nav.settings")]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "px-0 pt-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InstallButton, { compact: true })
					})
				]
			}),
			!hideChrome && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "sticky top-0 z-20 border-b border-border bg-bg/90 backdrop-blur lg:hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex h-12 items-center justify-between gap-3 px-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/",
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OffxMark, { className: "h-5 w-6" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-display text-base tracking-[0.12em]",
							children: "OFFCHAT"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LanChip, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/settings",
							className: "grid size-11 place-items-center text-muted",
							"aria-label": t("nav.settings"),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "size-5" })
						})]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "lg:pl-60",
				children
			}),
			!hideChrome && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/95 backdrop-blur lg:hidden",
				style: { paddingBottom: "env(safe-area-inset-bottom)" },
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mx-auto grid max-w-lg grid-cols-5",
					children: nav.map((item) => {
						const active = isActive(pathname, item.to, item.exact);
						const Icon = item.icon;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: item.to,
							className: cn("flex h-14 flex-col items-center justify-center gap-0.5 text-[10px] font-medium", active ? "text-fg" : "text-muted"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
								className: "size-5",
								strokeWidth: active ? 2.25 : 1.75
							}), item.label]
						}, item.to);
					})
				})
			})
		]
	});
}
var subscribeToNothing = () => () => {};
var noGateSessionOnServer = () => false;
/**
* Auth state components — plain wrappers around `useCurrentUserState()`.
*
* With auth on, visitors are signed out until they authenticate — in the sandbox
* live preview too, which does real sign-in. The shared dev user appears only
* when auth is disabled (`VITE_AUTH_ENABLED=false`, the shipped default).
* While the session is still resolving, gates that care about signed-out state
* render nothing so there's no signed-out flash on hard reload.
*/
/** Where `RedirectToSignIn` sends signed-out visitors. Create this route. */
var SIGN_IN_PATH = "/login";
/**
* Client-side redirect to the sign-in route (TanStack `<Navigate>` — NOT a full
* `window.location` reload). A hard navigation re-bootstraps the SPA and re-runs
* session loading, which feels like a second "Loading…" on /login.
*
* Guard routes by waiting out `isPending` first (see `use-current-user`), then
* render this.
*/
function RedirectToSignIn({ to = SIGN_IN_PATH }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to });
}
/**
* Minimal signed-in identity chip + sign-out. Restyle freely (see the
* `design-ui` skill). Sign-out is only shown when auth is enabled (the
* disabled-auth dev user has nothing to sign out of) and the session is not
* gate-materialized — behind the gate the next request signs the viewer
* straight back in, so a sign-out control there is a broken loop.
*/
function UserButton() {
	const user = useCurrentUser();
	const [signingOut, setSigningOut] = (0, import_react.useState)(false);
	const gateSession = (0, import_react.useSyncExternalStore)(subscribeToNothing, hasGateSessionMarker, noGateSessionOnServer);
	if (!user) return null;
	const label = user.displayName ?? user.primaryEmail ?? "Account";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2",
		children: [
			user.profileImageUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: user.profileImageUrl,
				alt: "",
				className: "h-8 w-8 rounded-full object-cover"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "grid h-8 w-8 place-items-center rounded-full bg-black/10 text-sm font-medium dark:bg-white/20",
				children: label.charAt(0).toUpperCase()
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sm font-medium",
				children: label
			}),
			!gateSession && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				disabled: signingOut,
				onClick: () => {
					setSigningOut(true);
					signOut().catch(() => setSigningOut(false));
				},
				className: "cursor-pointer text-sm underline-offset-4 opacity-70 hover:underline disabled:cursor-wait disabled:no-underline",
				children: signingOut ? "Signing out…" : "Sign out"
			})
		]
	});
}
var bootstrapMe = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("8141a8b5125180a319ccf0e5f4ebb194a95fa5b7e0f9abfca48c37f7632e6305"));
createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("425670bc9c63df5f6961bccd9d29094227b956a7cdca6e2aac1b9495f8489469"));
createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("63a7e7816cc4d83f28e07fe73789bca35d9c48ed5e319626d67e3970d9bd7068"));
createServerFn({ method: "POST" }).validator((otherUserId) => {
	if (!otherUserId) throw new Error("Kein Kontakt gewählt.");
	return otherUserId;
}).middleware([authMiddleware]).handler(createSsrRpc("b1f4b9a285b5486fa43af49fc787f02df4ce109d03ede1d2bdca1fe1e3bc6f5f"));
createServerFn({ method: "POST" }).validator((conversationId) => conversationId).middleware([authMiddleware]).handler(createSsrRpc("1f254b0f7e42d9cc07fe322995327bad86af42fca366114d676cf9d593a74e9d"));
createServerFn({ method: "POST" }).validator((input) => {
	const body = input.body.trim();
	if (!input.conversationId) throw new Error("Keine Unterhaltung.");
	if (!body) throw new Error("Nachricht ist leer.");
	if (body.length > 4e3) throw new Error("Nachricht ist zu lang.");
	return {
		conversationId: input.conversationId,
		body
	};
}).middleware([authMiddleware]).handler(createSsrRpc("94362d5b4b08ceec0ce829fd4d47dc9946b218184978c8c2161e21319cf9be0b"));
createServerFn({ method: "POST" }).validator((input) => {
	if (!input.conversationId) throw new Error("Keine Unterhaltung.");
	if (!input.imageUrl.startsWith("data:image/")) throw new Error("Ungültiges Bild.");
	if (input.imageUrl.length > 14e5) throw new Error("Bild ist zu groß.");
	return input;
}).middleware([authMiddleware]).handler(createSsrRpc("435580c3c7295132a125bb433cb4edbc9fcd60d5cf46374f9063a5b06e10d8a5"));
createServerFn({ method: "POST" }).validator((input) => {
	if (!input.conversationId) throw new Error("Keine Unterhaltung.");
	if (input.kind !== "send" && input.kind !== "request") throw new Error("Ungültiger Typ.");
	const amount = parseAmount(input.amount);
	const note = (input.note ?? "").trim().slice(0, 80);
	return {
		conversationId: input.conversationId,
		amount,
		note,
		kind: input.kind
	};
}).middleware([authMiddleware]).handler(createSsrRpc("35cba15065e544fabbe97fb7b1aaf8687e13225378448deebf2f7b7c00e16849"));
createServerFn({ method: "POST" }).validator((input) => {
	if (!input.transactionId) throw new Error("Keine Transaktion.");
	if (input.action !== "accept" && input.action !== "decline") throw new Error("Ungültige Aktion.");
	return input;
}).middleware([authMiddleware]).handler(createSsrRpc("c69efa90223da3f7d5587c40a507cfc37080dc463a078e908c36206ddcc4c551"));
createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("b1e11c6bfb4aa0c2a69e7bb419b727706c5136fa9588004a3e09971226f4dec5"));
createServerFn({ method: "POST" }).validator((userId) => userId).middleware([authMiddleware]).handler(createSsrRpc("7034b765b81f57e62cf39755062b591973baa17bc03937828592e32861314114"));
createServerFn({ method: "POST" }).validator((input) => {
	const caption = (input.caption ?? "").trim().slice(0, 500);
	if (input.mediaType !== "image" && input.mediaType !== "video") throw new Error("Ungültiger Medientyp.");
	const okImage = input.mediaUrl.startsWith("data:image/") || input.mediaUrl.startsWith("/feed/");
	const okVideo = input.mediaUrl.startsWith("data:video/") || input.mediaUrl.startsWith("/feed/");
	if (input.mediaType === "image" && !okImage) throw new Error("Ungültiges Bild.");
	if (input.mediaType === "video" && !okVideo) throw new Error("Ungültiges Video.");
	if (input.mediaUrl.length > 32e5) throw new Error("Datei ist zu groß.");
	return {
		caption,
		mediaType: input.mediaType,
		mediaUrl: input.mediaUrl,
		posterUrl: input.posterUrl ?? null
	};
}).middleware([authMiddleware]).handler(createSsrRpc("d545c51daa16c99d7452fbd3a3afd40f481f681eed0ea8e89354d6728827fdff"));
createServerFn({ method: "POST" }).validator((postId) => postId).middleware([authMiddleware]).handler(createSsrRpc("4016b6b921525f91812b650c107282d443a7e874f9d71589efc792fa922961af"));
createServerFn({ method: "POST" }).validator((postId) => postId).middleware([authMiddleware]).handler(createSsrRpc("d877305f8be9c5161968d2308e9eb62e437fea95b21a21082a61c5b81b294ad1"));
createServerFn({ method: "POST" }).validator((input) => {
	const body = input.body.trim();
	if (!input.postId) throw new Error("Kein Beitrag.");
	if (!body) throw new Error("Kommentar ist leer.");
	if (body.length > 500) throw new Error("Kommentar ist zu lang.");
	return {
		postId: input.postId,
		body
	};
}).middleware([authMiddleware]).handler(createSsrRpc("6154d08660e747c0427f2f772900fbab8f367b15acdf016c53a33c025790b0bb"));
var updateProfile = createServerFn({ method: "POST" }).validator((input) => {
	const displayName = input.displayName.trim().slice(0, 40);
	if (displayName.length < 2) throw new Error("Nickname ist zu kurz.");
	const handle = input.handle.trim().toLowerCase().replace(/^@/, "").replace(/[^a-z0-9_]/g, "").slice(0, 20);
	if (handle.length < 2) throw new Error("Username: mind. 2 Zeichen, nur a–z, 0–9, _.");
	const avatarUrl = input.avatarUrl === void 0 ? void 0 : input.avatarUrl;
	if (avatarUrl && (typeof avatarUrl !== "string" || avatarUrl.length > 4e5)) throw new Error("Profilbild ist zu groß.");
	if (avatarUrl && !avatarUrl.startsWith("data:image/")) throw new Error("Profilbild ungültig.");
	return {
		displayName,
		handle,
		bio: input.bio.trim().slice(0, 140),
		avatarUrl
	};
}).middleware([authMiddleware]).handler(createSsrRpc("2e8fe96d9add505de801399aab805ccca777acee03da966ffa799f53b3ae99a3"));
var getWallet = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("aab5e868c32332a49e5b6e3b1614b2de68423ec57c91c1df833f58caae63ecd7"));
var topUp = createServerFn({ method: "POST" }).validator((input) => {
	const pack = packById(input.packId);
	if (!pack) throw new Error("Unbekanntes Pack.");
	const holder = String(input.holder ?? "").trim();
	if (holder.length < 3) throw new Error("Name auf der Karte fehlt.");
	const last4 = String(input.last4 ?? "").replace(/\D/g, "");
	if (!/^\d{4}$/.test(last4)) throw new Error("Zahlung unvollständig.");
	const expMonth = Number(input.expMonth);
	const expYear = Number(input.expYear);
	const now = /* @__PURE__ */ new Date();
	if (!Number.isInteger(expMonth) || !Number.isInteger(expYear) || expMonth < 1 || expMonth > 12 || expYear * 12 + (expMonth - 1) < now.getFullYear() * 12 + now.getMonth()) throw new Error("Karte ist abgelaufen.");
	const brand = String(input.brand ?? "card").slice(0, 16);
	return {
		pack,
		holder: holder.slice(0, 48),
		last4,
		brand,
		expMonth,
		expYear
	};
}).middleware([authMiddleware]).handler(createSsrRpc("b1b07698e49e19ccbc0d235b3515d2e2fe0149468887cb250caa54a2f2e3bc35"));
var requestEmailCode = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("a6f288ad60cd70f5c9ef2eccfdd5facb4280c5341a888ebcd09fac18c30a1f64"));
var verifyEmailCode = createServerFn({ method: "POST" }).validator((code) => {
	const clean = code.replace(/\s/g, "");
	if (!/^\d{6}$/.test(clean)) throw new Error("Sechs Ziffern, bitte.");
	return clean;
}).middleware([authMiddleware]).handler(createSsrRpc("a55fc4265ea8c8e2914bc147e5e1c45c6ffcc26b718a8da9d4beed38f45973b5"));
createServerFn({ method: "POST" }).validator((amount) => parseAmount(amount)).middleware([authMiddleware]).handler(createSsrRpc("c89f3da9bd3dab5786899b83b4654e6c7104438b4561709af6f2bcca8d96e8ba"));
function VerifyEmail({ onVerified }) {
	const [digits, setDigits] = (0, import_react.useState)([
		"",
		"",
		"",
		"",
		"",
		""
	]);
	const [preview, setPreview] = (0, import_react.useState)(null);
	const [email, setEmail] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const inputs = (0, import_react.useRef)([]);
	async function send() {
		try {
			const res = await requestEmailCode();
			if (res.verified) {
				onVerified(await bootstrapMe());
				return;
			}
			setEmail(res.email);
			setPreview(res.previewCode);
			toast.success("Code ist da.");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Code nicht gesendet.");
		}
	}
	(0, import_react.useEffect)(() => {
		send();
	}, []);
	async function submit(code) {
		setBusy(true);
		try {
			onVerified(await verifyEmailCode({ data: code }));
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Code ungültig.");
			setBusy(false);
		}
	}
	function onDigit(index, raw) {
		const d = raw.replace(/\D/g, "").slice(-1);
		const next = [...digits];
		next[index] = d;
		setDigits(next);
		if (d && index < 5) inputs.current[index + 1]?.focus();
		const code = next.join("");
		if (code.length === 6) submit(code);
	}
	function onKey(index, e) {
		if (e.key === "Backspace" && !digits[index] && index > 0) inputs.current[index - 1]?.focus();
	}
	function onPaste(e) {
		e.preventDefault();
		const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
		if (!pasted) return;
		const next = [
			"",
			"",
			"",
			"",
			"",
			""
		];
		for (let i = 0; i < pasted.length; i += 1) next[i] = pasted[i];
		setDigits(next);
		if (pasted.length === 6) submit(pasted);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-dvh place-items-center bg-bg px-5 py-10 text-fg",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-sm space-y-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OffxLockup, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-2xl tracking-[0.12em]",
					children: "CODE BESTÄTIGEN"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-sm leading-relaxed text-muted",
					children: [
						"Sechs Ziffern für ",
						email || "deine E-Mail",
						". Google-Konten brauchen das nicht."
					]
				})] }),
				preview && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] font-medium uppercase tracking-[0.18em] text-muted",
							children: "Dein Code"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 font-display text-3xl tracking-[0.28em] tabular-nums",
							children: preview
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-xs leading-relaxed text-faint",
							children: "Hier gibt es keinen Mailversand — der Code kommt direkt in Offchat, nicht ins Postfach."
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex justify-between gap-2",
					onPaste,
					children: digits.map((d, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						ref: (el) => {
							inputs.current[i] = el;
						},
						inputMode: "numeric",
						autoComplete: i === 0 ? "one-time-code" : "off",
						maxLength: 1,
						value: d,
						disabled: busy,
						onChange: (e) => onDigit(i, e.target.value),
						onKeyDown: (e) => onKey(i, e),
						className: "h-14 w-full rounded-lg bg-surface text-center font-display text-2xl tabular-nums shadow-[var(--shadow-border)] outline-none focus:ring-2 focus:ring-ring"
					}, i))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: "secondary",
					className: "h-11 w-full rounded-lg",
					disabled: busy,
					onClick: () => void send(),
					children: "Neuen Code holen"
				})
			]
		})
	});
}
function VerifyGate({ children }) {
	const [me, setMe] = (0, import_react.useState)(null);
	const [blocked, setBlocked] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		let alive = true;
		(async () => {
			try {
				const profile = await bootstrapMe();
				await cacheSet("me", profile);
				if (alive) setMe(profile);
			} catch {
				const cached = await cacheGet("me");
				if (alive) {
					if (cached) setMe(cached);
					else setBlocked(true);
				}
			}
		})();
		return () => {
			alive = false;
		};
	}, []);
	if (blocked && !me) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid min-h-dvh place-items-center bg-bg px-6 text-center text-sm text-muted",
		children: "Einmal mit Internet anmelden — danach läuft Offchat im lokalen Netz weiter."
	});
	if (!me) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-dvh items-center justify-center bg-bg",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-10 w-40 rounded-lg" })
	});
	if (!me.emailVerified) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VerifyEmail, { onVerified: (next) => setMe(next) });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LanProvider, {
		me,
		children
	});
}
function RequireSignIn({ children }) {
	const { user, isPending } = useCurrentUserState();
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-dvh items-center justify-center bg-bg",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-10 w-40 rounded-lg" })
	});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VerifyGate, { children });
}
//#endregion
export { topUp as _, WLAN_CODE_RE as a, useOnline as b, cacheGet as c, getWallet as d, randomWlanCode as f, setForcedLanCode as g, setBtCode as h, VerifyGate as i, cacheSet as l, readOnlineCode as m, RequireSignIn as n, assertOnline as o, readBtCode as p, UserButton as r, bluetoothNet as s, AppFrame as t, forcedLanNet as u, updateProfile as v, useLan as y };
