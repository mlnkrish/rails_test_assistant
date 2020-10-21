import * as assert from 'assert';
import * as command from '../../command';
import * as vscode from 'vscode';

suite('commands.forFile', () => {
  test('minitest', () => {
    assert.strictEqual('rails test user_test.rb', command.forFile('user_test.rb'));
  });

  test('rspec', () => {
    assert.strictEqual('rspec user_spec.rb', command.forFile('user_spec.rb'));
  });
});

suite('commands.withEnvPrefix', () => {
  test('with no prefix', async () => {
    await vscode.workspace.getConfiguration('railsTestAssistant').update('testCommandPrefix', '');
    assert.strictEqual(
      'rails test user_test.rb',
      command.withEnvPrefix('rails test user_test.rb')
    );
  });

  test('with docker prefix', async () => {
    await vscode.workspace.getConfiguration('railsTestAssistant').update('testCommandPrefix', 'docker-compose run --rm web');
    assert.strictEqual(
      'docker-compose run --rm web rails test user_test.rb',
      command.withEnvPrefix('rails test user_test.rb')
    );
  });
});