import * as vscode from 'vscode';

export function fullPath(path: string) {
  const folders = vscode.workspace.workspaceFolders;
	if (typeof(folders) === 'undefined') { return ''; }

  const rootPath = folders[0].uri.toString().replace('file://', '');

  return `${rootPath}/${path}`;
}

export function relativePath(path: string) {
  const folders = vscode.workspace.workspaceFolders;
	if (typeof(folders) === 'undefined') { return ''; }

  const rootPath = folders[0].uri.toString().replace('file://', '');

  return path.replace(`${rootPath}/`, '');
}

export async function resolve(path: string) {
  const currentlyViewingTest = path.endsWith('_test.rb') || path.endsWith('_spec.rb');

  const parts = path.toString().split('/');
  if(typeof(parts) === 'undefined') { return []; }

  const file = parts.pop();
  if(typeof(file) === 'undefined') { return []; }

  let fileWeWant = '';
  let results = null;

  if (currentlyViewingTest) {
    fileWeWant = file.replace('_test.rb', '.rb');
    fileWeWant = fileWeWant.replace('_spec.rb', '.rb');
    results = await vscode.workspace.findFiles(`**/${fileWeWant}`, '', 10);
  } else {
    fileWeWant = file.replace('.rb', '');
    results = await vscode.workspace.findFiles(`**/${fileWeWant}_{spec,test}.rb`, '', 10);
  }

  results = results.filter(r => {
    return !r.path.includes('db/seeds') && !r.path.includes('test/factories');
  });

  return results.map(r => relativePath(r.path));
}
