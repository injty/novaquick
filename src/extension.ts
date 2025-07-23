import * as vscode from 'vscode';

interface OpenedFileItem extends vscode.QuickPickItem {
  uri: vscode.Uri;
  tab: vscode.Tab;
}

export function activate(context: vscode.ExtensionContext) {
  console.log('NovaQuick extension is now active!');

  // Register command to show opened files
  let disposable = vscode.commands.registerCommand(
    'openedFiles.show',
    async () => {
      console.log('openedFiles.show command executed');
      await showOpenedFiles();
    },
  );

  context.subscriptions.push(disposable);

  // Alternative command registration for testing
  let disposable2 = vscode.commands.registerCommand(
    'novaquick.showOpenedFiles',
    async () => {
      console.log('novaquick.showOpenedFiles command executed');
      await showOpenedFiles();
    },
  );

  context.subscriptions.push(disposable2);
}

function getOpenedTabs(): OpenedFileItem[] {
  return vscode.window.tabGroups.all
    .flatMap((group) => group.tabs)
    .filter((tab) => tab.input instanceof vscode.TabInputText)
    .map((tab) => {
      const input = tab.input as vscode.TabInputText;
      const uri = input.uri;
      const fileName = uri.path.split('/').pop() || '';
      const relativePath = vscode.workspace.asRelativePath(uri);

      return {
        label: `${fileName} (${relativePath})`,
        description: '', // Keep empty to avoid showing second line
        // detail: relativePath, // Keep for internal use
        uri: uri,
        tab: tab,
        buttons: [
          {
            iconPath: new vscode.ThemeIcon('close'),
            tooltip: 'Close file',
          },
        ],
      };
    });
}

async function showOpenedFiles() {
  const openedTabs = getOpenedTabs();

  if (openedTabs.length === 0) {
    vscode.window.showInformationMessage('No opened files');
    return;
  }

  // Create custom QuickPick for better control
  const quickPick = vscode.window.createQuickPick<OpenedFileItem>();
  quickPick.title = 'Opened Files';
  quickPick.placeholder = 'Select file to open or press X to close';
  quickPick.canSelectMany = false;
  quickPick.matchOnDetail = false; // Disable search by detail
  quickPick.matchOnDescription = false; // Disable search by description
  quickPick.items = openedTabs;

  // Handle file selection
  quickPick.onDidAccept(() => {
    const selected = quickPick.selectedItems[0];
    if (selected && selected.uri) {
      vscode.window.showTextDocument(selected.uri);
    }
    quickPick.hide();
  });

  // Handle close button click
  quickPick.onDidTriggerItemButton(async (e) => {
    const item = e.item;
    if (item.tab) {
      // Close tab
      await vscode.window.tabGroups.close(item.tab);

      // Update list
      const updatedTabs = getOpenedTabs();

      if (updatedTabs.length === 0) {
        quickPick.hide();
        vscode.window.showInformationMessage('All files closed');
        return;
      }

      quickPick.items = updatedTabs;
    }
  });

  quickPick.show();
}

export function deactivate() {}
