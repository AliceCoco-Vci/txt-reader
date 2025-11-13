import * as vscode from 'vscode';
import { FileExplorerProvider } from '../providers/fileExplorerProvider';

export async function addFolder(fileExplorerProvider: FileExplorerProvider): Promise<void> {
    const uris = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        openLabel: '添加文件夹',
        title: '选择要添加的文件夹'
    });

    if (uris && uris[0]) {
        fileExplorerProvider.addFolder(uris[0].fsPath);
    }
}

export function clearFolders(fileExplorerProvider: FileExplorerProvider): void {
    fileExplorerProvider.clearFolders();
}

export function refreshExplorer(fileExplorerProvider: FileExplorerProvider): void {
    fileExplorerProvider.refresh();
    vscode.window.showInformationMessage('文件夹列表已刷新');
}