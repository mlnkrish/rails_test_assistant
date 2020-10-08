import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	let terminal: vscode.Terminal | null = null;

	const prefixedCommand = function(command: string) {
		const prefix = vscode.workspace.getConfiguration('railsTestAssistant').testCommandPrefix;

		if (typeof(prefix) === 'string') {
			command = `${prefix} ${command}`;
		}

		return command;
	};

	const sendTerminalCommand = function(command: string) {
		if (terminal === null) {
			terminal = vscode.window.createTerminal(`Rails Test Assistant: Terminal`);
		}

		terminal.sendText(command);
		terminal.show();
	};

	let goToRailsTestDisposable = vscode.commands.registerCommand('rails-test-assistant.goToRailsTest', () => {
		const currentEditor = vscode.window.activeTextEditor;
		if(typeof(currentEditor) === 'undefined') { return; }

		const uri = currentEditor.document.uri.path;

		const currentlyViewingTest = uri.endsWith('_test.rb');

		const parts = uri.toString().split('/');
		if(typeof(parts) === 'undefined') { return; }

		const file = parts.pop();
		if(typeof(file) === 'undefined') { return; }

		let fileWeWant = '';

		if (currentlyViewingTest) {
			fileWeWant = file.replace('_test.rb', '.rb');
		} else {
			fileWeWant = file.replace('.rb', '_test.rb');
		}

		vscode.workspace.findFiles(`**/${fileWeWant}`, '', 10).then(results => {
			const resultSet = results.filter(r => {
				return !r.path.includes('db/seeds') &&
					!r.path.includes('test/factories');
			});

			if (resultSet.length === 1) {
				const firstResult = resultSet[0];
				vscode.workspace.openTextDocument(firstResult.path).then(doc => {
					vscode.window.showTextDocument(doc);
				});
			} else if (resultSet.length > 1) {
				vscode.window.showQuickPick(resultSet.map(r => r.path)).then(selection => {
					if (typeof(selection) === 'string') {
						vscode.workspace.openTextDocument(selection).then(doc => {
							vscode.window.showTextDocument(doc);
						});
					}
				});
			}
		});
	});

	context.subscriptions.push(goToRailsTestDisposable);

	let executeHighlightedTestDisposable = vscode.commands.registerCommand('rails-test-assistant.runTestAtCursor', () => {
		const currentEditor = vscode.window.activeTextEditor;
		if(typeof(currentEditor) === 'undefined') { return; }

		let uri = currentEditor.document.uri.path;
		const rootPath = vscode.workspace.rootPath;
		if (typeof(rootPath) !== 'undefined') {
			uri = uri.replace(`${rootPath}/`, '');
		}

		const currentlyViewingTest = uri.endsWith('_test.rb');
		if (!currentlyViewingTest) { return; }

		const lineNumber = currentEditor.selection.start.line + 1;
		const command = prefixedCommand(`rails test ${uri}:${lineNumber}`);
		sendTerminalCommand(command);
	});

	context.subscriptions.push(executeHighlightedTestDisposable);

	let runAllTestsDisposable = vscode.commands.registerCommand('rails-test-assistant.runAllTests', () => {
		const currentEditor = vscode.window.activeTextEditor;
		if(typeof(currentEditor) === 'undefined') { return; }

		const command = prefixedCommand(`rails test`);
		sendTerminalCommand(command);
	});

	context.subscriptions.push(runAllTestsDisposable);

	let runTestsInFileDisposable = vscode.commands.registerCommand('rails-test-assistant.runTestsInFile', () => {
		const currentEditor = vscode.window.activeTextEditor;
		if(typeof(currentEditor) === 'undefined') { return; }

		let uri = currentEditor.document.uri.path;
		const rootPath = vscode.workspace.rootPath;
		if (typeof(rootPath) !== 'undefined') {
			uri = uri.replace(`${rootPath}/`, '');
		}

		const currentlyViewingTest = uri.endsWith('_test.rb');
		if (!currentlyViewingTest) { return; }

		const command = prefixedCommand(`rails test ${uri}`);
		sendTerminalCommand(command);
	});

	context.subscriptions.push(runTestsInFileDisposable);
}

export function deactivate() {}
