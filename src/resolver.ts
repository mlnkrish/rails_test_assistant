import * as vscode from 'vscode';

export async function resolve(path: string) {
  const currentlyViewingTest = path.endsWith('_test.rb');

  const parts = path.toString().split('/');
  if(typeof(parts) === 'undefined') { return []; }

  const file = parts.pop();
  if(typeof(file) === 'undefined') { return []; }

  let fileWeWant = '';

  if (currentlyViewingTest) {
    fileWeWant = file.replace('_test.rb', '.rb');
  } else {
    fileWeWant = file.replace('.rb', '_test.rb');
  }

  let results = await vscode.workspace.findFiles(`**/${fileWeWant}`, '', 10);//.then(results => {
  results = results.filter(r => {
    return !r.path.includes('db/seeds') && !r.path.includes('test/factories');
  });

  return results.map(r => r.path);
}
