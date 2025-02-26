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
		// Show the terminal without focusing on it (preserves focus on editor)
		terminal.show(true);
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

		const cursorLineNumber = currentEditor.selection.start.line + 1;
		
		// Check if the cursor is within a describe block
		const document = currentEditor.document;
		const text = document.getText();
		const lines = text.split('\n');
		
		// Check if the current line is followed by an "it" without encountering an "end"
		let followedByIt = false;
		
		// Look at lines after the cursor position
		for (let i = cursorLineNumber; i < lines.length; i++) {
			const line = lines[i];
			
			// Check for "it" blocks
			if (line.match(/^\s*it\b/)) {
				followedByIt = true;
				break;
			}
			
			// Check for end statements
			if (line.match(/\bend\b/)) {
				break;
			}
		}
		
		// Search backwards for the appropriate line based on the condition
		let testLineNumber = cursorLineNumber;
		let foundPreviousDescribe = false;
		let previousDescribeLine = 0;
		let previousItLine = 0;
		
		for (let i = cursorLineNumber - 1; i >= 0; i--) {
			const line = lines[i];
			
			// Check for "describe" or "context" lines
			if (line.match(/^\s*(describe|RSpec\.describe|context)\b/) && !foundPreviousDescribe) {
				previousDescribeLine = i + 1; // +1 because line numbers are 1-indexed
				foundPreviousDescribe = true;
				
				// If we're looking for a describe and already found it, we can stop
				if (followedByIt) {
					break;
				}
			}
			
			// Check for "it" lines
			if (line.match(/^\s*it\b/) && previousItLine === 0) {
				previousItLine = i + 1; // +1 because line numbers are 1-indexed
				
				// If we're looking for an "it" and already found it, we can stop
				if (!followedByIt) {
					break;
				}
			}
		}
		
		// Determine which line number to use
		if (followedByIt && foundPreviousDescribe) {
			testLineNumber = previousDescribeLine;
		} else if (previousItLine > 0) {
			testLineNumber = previousItLine;
		} else if (foundPreviousDescribe) {
			testLineNumber = previousDescribeLine;
		}
		
		// Check if there's a describe block after the current line without an 'end' in between
		let shouldIgnoreLineNumber = true;
		
		// Look at lines after the cursor position
		for (let i = cursorLineNumber; i < lines.length; i++) {
			const line = lines[i];
			
			// Check for describe/context blocks
			if (line.match(/(?:^|\s+)(?:(?:RSpec\.)?describe|context)\s+['"](.+?)['"]/)) {
				break;
			}
			
			// Check for end statements
			if (line.match(/\bend\b/)) {
				shouldIgnoreLineNumber = false;
				break;
			}
		}

		let testCommand = command.forFile(uri);
		testCommand = command.withEnvPrefix(testCommand);
		
		if (!shouldIgnoreLineNumber) {
			testCommand = `${testCommand}:${testLineNumber}`;
		}
		
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
