import * as assert from 'assert';
import * as resolver from '../../resolver';
import * as vscode from 'vscode';

const rootPath = () => {
	const folders = vscode.workspace.workspaceFolders;
	if (typeof(folders) === 'undefined') { return ''; }

	return folders[0].uri.toString().replace('file://', '');
};

suite('Resolver', () => {
	test('Resolves a minitest class to the appropriate test file', async () => {
		const results = await resolver.resolve('test/models/user_test.rb');

		assert.strictEqual(1, results.length);
		assert(results.includes(`${rootPath()}/app/models/user.rb`));
	});
});
