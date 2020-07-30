import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { prepare, apply } from '../src/index';

test('culls unread properties from an object', () => {
	const obj = {
		foo: 1,
		bar: 2
	};

	const proxy = prepare(obj);
	assert.is(proxy.foo, 1);

	assert.equal(apply(obj), {
		kept: {
			foo: 1
		},
		culled: [
			{ path: 'bar', value: 2 }
		]
	});
});

test('culls unread properties from a proxy', () => {
	const proxy = prepare({
		foo: 1,
		bar: 2
	});
	assert.is(proxy.foo, 1);

	assert.equal(apply(proxy), {
		kept: {
			foo: 1
		},
		culled: [
			{ path: 'bar', value: 2 }
		]
	});
});

test('culls unread properties from an array', () => {
	const arr = ['a', 'b', 'c'];

	const proxy = prepare(arr);
	assert.is(proxy[1], 'b');

	assert.equal(apply(arr), {
		kept: [, 'b'],
		culled: [
			{ path: '0', value: 'a' },
			{ path: '2', value: 'c' }
		]
	});
});

test('preserves array length if length is accessed', () => {
	const arr = ['a', 'b', 'c'];

	const proxy = prepare(arr);
	assert.is(proxy[1], 'b');
	assert.is(proxy.length, 3);

	assert.equal(apply(arr), {
		kept: [, 'b', ,],
		culled: [
			{ path: '0', value: 'a' },
			{ path: '2', value: 'c' }
		]
	});
});

test('culls nested properties', () => {
	// https://www.json-generator.com/
	const user = {
		firstname: 'Terrell',
		lastname: 'Snider',
		friends: [
			{ firstname: 'Rachelle', lastname: 'Knight' },
			{ firstname: 'Ila', lastname: 'Farrell' },
			{ firstname: 'Vasquez', lastname: 'Flynn' }
		],
		pets: [
			{ name: 'Bobo', species: 'Great Dane' }
		]
	};

	const proxy = prepare(user);
	assert.is(proxy.firstname, 'Terrell');
	assert.is(proxy.friends[0].firstname, 'Rachelle');

	assert.equal(apply(user), {
		kept: {
			firstname: 'Terrell',
			friends: [
				{ firstname: 'Rachelle' }
			]
		},
		culled: [
			{ path: 'lastname', value: 'Snider' },
			{ path: 'friends.0.lastname', value: 'Knight' },
			{ path: 'friends.1', value: { firstname: 'Ila', lastname: 'Farrell' } },
			{ path: 'friends.2', value: { firstname: 'Vasquez', lastname: 'Flynn' } },
			{ path: 'pets', value: [ { name: 'Bobo', species: 'Great Dane' } ] }
		]
	});
});

test('binds methods', () => {
	const obj = {
		map: new Map([
			[1, 'a'],
			[2, 'b']
		])
	};

	const proxy = prepare(obj);

	assert.is(proxy.map.get(1), 'a');

	assert.equal(apply(obj), {
		kept: {
			map: new Map([
				[1, 'a'],
				[2, 'b']
			])
		},
		culled: []
	});
});

test('destructuring objects works', () => {
	const obj = { a: 1, b: 2, c: 3 };
	const proxy = prepare(obj);

	const { b } = proxy;

	assert.is(b, 2);

	assert.equal(apply(obj), {
		kept: { b: 2 },
		culled: [
			{ path: 'a', value: 1 },
			{ path: 'c', value: 3 }
		]
	});
});

test('destructuring arrays works', () => {
	const arr = ['a', 'b', 'c'];
	const proxy = prepare(arr);

	const [, x] = proxy;

	assert.is(x, 'b');

	assert.equal(apply(arr), {
		kept: ['a', 'b', ,],
		culled: [
			{ path: '2', value: 'c' }
		]
	});
});

test('culls unread objects with unread properties', () => {
	const obj = { arr: [] };
	prepare(obj);

	assert.equal(apply(obj), {
		kept: {},
		culled: [
			{ path: 'arr', value: [] }
		]
	})
});

test('keeps read objects with unread properties', () => {
	const obj = { arr: [] };
	const proxy = prepare(obj);

	assert.ok(proxy.arr);

	assert.equal(apply(obj), {
		kept: { arr: [] },
		culled: []
	})
});

test.run();