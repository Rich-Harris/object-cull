import * as assert from 'assert';
import { prepare, apply } from '../src/index';

describe('object-cull', () => {
	it('culls unread properties from an object', () => {
		const obj = {
			foo: 1,
			bar: 2
		};

		const proxy = prepare(obj);
		assert.equal(proxy.foo, 1);

		assert.deepEqual(apply(obj), {
			kept: {
				foo: 1
			},
			culled: [
				{ path: 'bar', value: 2 }
			]
		});
	});

	it('culls unread properties from a proxy', () => {
		const proxy = prepare({
			foo: 1,
			bar: 2
		});
		assert.equal(proxy.foo, 1);

		assert.deepEqual(apply(proxy), {
			kept: {
				foo: 1
			},
			culled: [
				{ path: 'bar', value: 2 }
			]
		});
	});

	it('culls unread properties from an array', () => {
		const arr = ['a', 'b', 'c'];

		const proxy = prepare(arr);
		assert.equal(proxy[1], 'b');

		assert.deepEqual(apply(arr), {
			kept: [, 'b', ,],
			culled: [
				{ path: '0', value: 'a' },
				{ path: '2', value: 'c' }
			]
		});
	});

	it('culls nested properties', () => {
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
		assert.equal(proxy.firstname, 'Terrell');
		assert.equal(proxy.friends[0].firstname, 'Rachelle');

		assert.deepEqual(apply(user), {
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
});
