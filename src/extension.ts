import * as vscode from 'vscode';
import * as resolver from './resolver';
import * as command from './command';

export function activate(context: vscode.ExtensionContext) {
	let terminal: vscode.Terminal | null = null;

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

		const currentlyViewingTest = resolver.isTest(uri);
		if (!currentlyViewingTest) { return; }

		const lineNumber = currentEditor.selection.start.line + 1;

		let testCommand = command.forFile(uri);
		testCommand = command.withEnvPrefix(testCommand);
		testCommand = `${testCommand}:${lineNumber}`;
		sendTerminalCommand(testCommand);
	});

	context.subscriptions.push(executeHighlightedTestDisposable);

	let runAllTestsDisposable = vscode.commands.registerCommand('rails-test-assistant.runAllTests', () => {
		const currentWorkspace = vscode.workspace.workspaceFolders;
		if(typeof(currentWorkspace) === 'undefined') { return; }

		const testCommand = command.withEnvPrefix('rails test');
		sendTerminalCommand(testCommand);
	});

	context.subscriptions.push(runAllTestsDisposable);

	let runAllTestsWithRspecDisposable = vscode.commands.registerCommand('rails-test-assistant.runAllTestsWithRspec', () => {
		const currentWorkspace = vscode.workspace.workspaceFolders;
		if(typeof(currentWorkspace) === 'undefined') { return; }

		const testCommand = command.withEnvPrefix('rspec');
		sendTerminalCommand(testCommand);
	});

	context.subscriptions.push(runAllTestsWithRspecDisposable);

	let runTestsInFileDisposable = vscode.commands.registerCommand('rails-test-assistant.runTestsInFile', () => {
		const currentEditor = vscode.window.activeTextEditor;
		if(typeof(currentEditor) === 'undefined') { return; }

		let uri = currentEditor.document.uri.path;
		const rootPath = vscode.workspace.rootPath;
		if (typeof(rootPath) !== 'undefined') {
			uri = uri.replace(`${rootPath}/`, '');
		}

		const currentlyViewingTest = resolver.isTest(uri);
		if (!currentlyViewingTest) { return; }

		let testCommand = command.forFile(uri);
		testCommand = command.withEnvPrefix(testCommand);
		sendTerminalCommand(testCommand);
	});

	context.subscriptions.push(runTestsInFileDisposable);
}

export function deactivate() {}
