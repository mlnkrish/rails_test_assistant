import * as vscode from 'vscode';
import * as resolver from './resolver';

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

	let goToRailsTestDisposable = vscode.commands.registerCommand('rails-test-assistant.goToRailsTest', async () => {
		const currentEditor = vscode.window.activeTextEditor;
		if(typeof(currentEditor) === 'undefined') { return; }

		const resultSet = await resolver.resolve(currentEditor.document.uri.path);

		if (resultSet.length === 1) {
			const firstResult = resultSet[0];
			const fullPath = resolver.fullPath(firstResult);
			vscode.workspace.openTextDocument(fullPath).then(doc => {
				vscode.window.showTextDocument(doc);
			});
		} else if (resultSet.length > 1) {
			vscode.window.showQuickPick(resultSet).then(selection => {
				if (typeof(selection) === 'string') {
					const fullPath = resolver.fullPath(selection);
					vscode.workspace.openTextDocument(fullPath).then(doc => {
						vscode.window.showTextDocument(doc);
					});
				}
			});
		}
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
