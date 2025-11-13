import * as vscode from 'vscode';
import * as path from 'path';
import { AddedFolder } from '../core/readingState';
import { FileUtils } from '../utils/fileUtils';

export class FileExplorerProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private addedFolders: AddedFolder[] = [];

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    updateWorkspace(): void {
        this.refresh();
    }

    addFolder(folderPath: string): void {
        if (this.addedFolders.some(folder => folder.path === folderPath)) {
            //vscode.window.showInformationMessage('文件夹已被添加');
            return;
        }

        const folderName = path.basename(folderPath);
        this.addedFolders.push({ path: folderPath, name: folderName });
        this.refresh();
        //vscode.window.showInformationMessage(`添加文件夹: ${folderPath}`);
    }

    clearFolders(): void {
        this.addedFolders = [];
        this.refresh();
        //vscode.window.showInformationMessage('所有文件夹已被移除');
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
        if (element) {
            if (element.contextValue === 'addedFolder' || element.contextValue === 'folder') {
                return this.getFilesInDirectory(element.resourceUri!.fsPath);
            }
            return Promise.resolve([]);
        } else {
            return this.getRootItems();
        }
    }

    private getRootItems(): Thenable<vscode.TreeItem[]> {
        const items: vscode.TreeItem[] = [];

        for (const folder of this.addedFolders) {
            const folderItem = new vscode.TreeItem(
                folder.name,
                vscode.TreeItemCollapsibleState.Collapsed
            );
            folderItem.iconPath = new vscode.ThemeIcon('folder');
            folderItem.tooltip = folder.path;
            folderItem.contextValue = 'addedFolder';
            folderItem.resourceUri = vscode.Uri.file(folder.path);
            items.push(folderItem);
        }

        return Promise.resolve(items);
    }

    private async getFilesInDirectory(dirPath: string): Promise<vscode.TreeItem[]> {
        try {
            const items = await FileUtils.getFilesInDirectory(dirPath);
            const treeItems: vscode.TreeItem[] = [];

            for (const item of items) {
                if (item.type === vscode.FileType.Directory) {
                    const hasTextFiles = await FileUtils.directoryHasTextFiles(item.path);
                    if (!hasTextFiles) {
                        continue;
                    }

                    const folderItem = new vscode.TreeItem(
                        item.name,
                        vscode.TreeItemCollapsibleState.Collapsed
                    );
                    folderItem.iconPath = new vscode.ThemeIcon('folder');
                    folderItem.resourceUri = vscode.Uri.file(item.path);
                    folderItem.contextValue = 'folder';
                    folderItem.tooltip = item.path;
                    treeItems.push(folderItem);
                } else if (item.type === vscode.FileType.File) {
                    const fileItem = new vscode.TreeItem(
                        item.name,
                        vscode.TreeItemCollapsibleState.None
                    );
                    fileItem.resourceUri = vscode.Uri.file(item.path);
                    fileItem.description = item.size ? FileUtils.formatFileSize(item.size) : '';
                    fileItem.command = {
                        command: 'txt-reader.loadFile',
                        title: '打开文件',
                        arguments: [item.path]
                    };
                    fileItem.contextValue = 'txtFile';
                    fileItem.tooltip = item.path;
                    treeItems.push(fileItem);
                }
            }

            return treeItems.sort((a, b) => {
                const aIsFolder = a.contextValue === 'folder' || a.contextValue === 'addedFolder';
                const bIsFolder = b.contextValue === 'folder' || b.contextValue === 'addedFolder';
                if (aIsFolder && !bIsFolder) return -1;
                if (!aIsFolder && bIsFolder) return 1;
                return a.label!.toString().localeCompare(b.label!.toString());
            });

        } catch (error) {
            console.error('读取文件列表失败:', error);
            vscode.window.showErrorMessage(`无法读取文件列表: ${dirPath}`);
            return [];
        }
    }
}