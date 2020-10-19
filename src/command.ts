import * as vscode from 'vscode';

export function forFile(path: string) {
  if (path.endsWith('_test.rb')) {
    return `rails test ${path}`;
  } else if (path.endsWith('_spec.rb')) {
    return `rspec ${path}`;
  } else {
    return path;
  }
}

export function withEnvPrefix(command: string) {
  const prefix = vscode.workspace.getConfiguration('railsTestAssistant').testCommandPrefix;

  if (typeof(prefix) === 'string') {
    command = `${prefix} ${command}`;
  }

  return command;
}
