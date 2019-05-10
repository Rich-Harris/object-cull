let proxy_lookup: WeakMap<any, typeof Proxy>;
let object_lookup: WeakMap<any, typeof Proxy>;
let proxies: WeakSet<typeof Proxy>;
let reads: WeakMap<any, Record<string, number>>;

type Culled = { path: string, value: any };

function add_read(obj: any, prop: string) {
	if (!reads.has(obj)) reads.set(obj, {});

	const local = reads.get(obj);
	if (prop in local) {
		local[prop] += 1;
	} else {
		local[prop] = 1;
	}
}

const handler: ProxyHandler<any> = {
	get: (obj: any, prop: string) => {
		add_read(obj, prop);
		return to_proxy(obj[prop]);
	},
	set: (obj: any, prop: string, value: any) => {
		obj[prop] = value;
		return true;
	}
}

function to_proxy(input: any) {
	if (typeof input !== 'object') {
		return input;
	}

	if (!proxy_lookup.has(input)) {
		const proxy = new Proxy(input, handler);
		proxy_lookup.set(input, proxy);
		object_lookup.set(proxy, input);
	}

	return proxy_lookup.get(input);
}

export function prepare(input: any) {
	if (!proxy_lookup) {
		proxy_lookup = new WeakMap();
		object_lookup = new WeakMap();
		reads = new WeakMap();
	}

	return to_proxy(input);
}

function apply_at_path(path: string, object: any, culled: Culled[]) {
	const proxy = proxy_lookup.get(object);

	if (!proxy) return object;

	// TODO others... Map? Set?
	const kept: Array<any> | Record<string, any> = Array.isArray(object) ? Array(object.length) : {};

	const was_read = reads.get(object);

	Object.keys(object).forEach(key => {
		const child_path = path ? `${path}.${key}` : key;

		if (was_read[key]) {
			(kept as Record<string, any>)[key] = apply_at_path(child_path, object[key], culled);
		} else {
			culled.push({
				path: child_path,
				value: object[key]
			});
		}
	});

	return kept;
}

export function apply(object: any) {
	if (object_lookup.has(object)) {
		// input was a proxy — we need the underlying object
		object = object_lookup.get(object);
	}

	const culled: Culled[] = [];
	const kept = apply_at_path('', object, culled);

	return { kept, culled };
}