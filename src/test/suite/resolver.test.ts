import * as assert from 'assert';
import * as resolver from '../../resolver';

suite('resolver.resolve', () => {
	test('Resolves a minitest test to the appropriate model', async () => {
		const results = await resolver.resolve('test/models/user_test.rb');

		assert.strictEqual(1, results.length);
		assert(results.includes(`app/models/user.rb`));
	});

	test('Resolves an rspec spec to the appropriate model', async () => {
		const results = await resolver.resolve('test/models/user_spec.rb');

		assert.strictEqual(1, results.length);
		assert(results.includes(`app/models/user.rb`));
	});

	test('Resolves a user model to one or more tests', async () => {
		const results = await resolver.resolve('app/models/user.rb');

		assert.strictEqual(2, results.length);
		assert(results.includes(`test/models/user_test.rb`));
		assert(results.includes(`spec/models/user_spec.rb`));
	});
});

suite('resolver.isTest', () => {
	test('_test.rb files are tests', () => {
		assert(resolver.isTest('user_test.rb'));
	});

	test('_spec.rb files are tests', () => {
		assert(resolver.isTest('user_spec.rb'));
	});

	test('other files are not tests', () => {
		assert(!resolver.isTest('user.rb'));
	});
});
