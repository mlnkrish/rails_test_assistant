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
			vscode.workspace.openTextDocument(fullPath).then((doc: vscode.TextDocument) => {
				vscode.window.showTextDocument(doc);
			});
		} else if (resultSet.length > 1) {
			vscode.window.showQuickPick(resultSet).then((selection: string | undefined) => {
				if (typeof(selection) === 'string') {
					const fullPath = resolver.fullPath(selection);
					vscode.workspace.openTextDocument(fullPath).then((doc: vscode.TextDocument) => {
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

	let listAllSpecsInFileDisposable = vscode.commands.registerCommand('rails-test-assistant.listAllSpecsInFile', () => {
		const currentEditor = vscode.window.activeTextEditor;
		if(typeof(currentEditor) === 'undefined') { return; }

		const document = currentEditor.document;
		const text = document.getText();
		const lines = text.split('\n');
		
		interface TestInfo {
			line: number;
			description: string;
			context: string;
		}
		
		const testInfos: TestInfo[] = [];
		let currentContext = '';
		
		// Process each line to find contexts and tests
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			
			// Track context blocks (most recent context is used)
			const contextMatch = line.match(/(?:^|\s+)(?:(?:RSpec\.)?describe)\s+['"](.+?)['"]/);
			if (contextMatch) {
				currentContext = contextMatch[1];
			}
			
			// Find test blocks
			const itMatch = line.match(/it\s+['"](.+?)['"]/);
			if (itMatch) {
				testInfos.push({
					line: i,
					description: itMatch[1],
					context: currentContext
				});
			}
		}

		if (testInfos.length > 0) {
			// Sort tests by line number to maintain file order
			const sortedTests = [...testInfos].sort((a, b) => a.line - b.line);
			const quickPickItems: vscode.QuickPickItem[] = [];
			
			// Keep track of last seen context to add separators only when context changes
			let lastContext = '';
			
			// Process each test in file order
			sortedTests.forEach(test => {
				// If context has changed, add a separator
				if (test.context !== lastContext) {
					quickPickItems.push({
						label: `${test.context || '(No context)'}`,
						kind: vscode.QuickPickItemKind.Separator
					});
					lastContext = test.context;
				}
				
				// Add the test
				quickPickItems.push({
					label: test.description,
					description: `Line ${test.line + 1}`
				});
			});
			
			vscode.window.showQuickPick(quickPickItems).then((selected) => {
				if (selected) {
					const lineInfo = selected.description?.match(/Line (\d+)/);
					if (lineInfo) {
						const line = parseInt(lineInfo[1]) - 1;
						const position = new vscode.Position(line, 0);
						currentEditor.selection = new vscode.Selection(position, position);
						currentEditor.revealRange(
							new vscode.Range(position, position),
							vscode.TextEditorRevealType.InCenter
						);
					}
				}
			});
		} else {
			vscode.window.showInformationMessage('No test descriptions found in this file.');
		}
	});

	context.subscriptions.push(runTestsInFileDisposable);
	context.subscriptions.push(listAllSpecsInFileDisposable);
}

export function deactivate() {}
