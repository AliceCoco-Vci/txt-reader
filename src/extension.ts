import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface ReadingState {
    filePath: string;
    lines: string[];
    currentLineIndex: number;
}

interface AddedFolder {
    path: string;
    name: string;
}

let readingState: ReadingState | undefined;
let statusBarItem: vscode.StatusBarItem;
let closeButton: vscode.StatusBarItem;
let prevButton: vscode.StatusBarItem;
let nextButton: vscode.StatusBarItem;
let contentStatusBarItem: vscode.StatusBarItem;
let progressStatusBarItem: vscode.StatusBarItem;

class FileExplorerProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
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
            vscode.window.showInformationMessage('the folder has been added');
            return;
        }

        const folderName = folderPath;
        this.addedFolders.push({ path: folderPath, name: folderName });
        this.refresh();
        vscode.window.showInformationMessage(`Add folder: ${folderPath}`);
    }

    clearFolders(): void {
        this.addedFolders = [];
        this.refresh();
        vscode.window.showInformationMessage('All folders have been removed');
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
        if (element) {
            if (element.contextValue === 'addFolder') {
                return Promise.resolve([]);
            }
            if (element.contextValue === 'addedFolder') {
                return this.getFilesInDirectory(element.resourceUri!.fsPath);
            }
            if (element.contextValue === 'folder') {
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
            
            folderItem.contextValue = 'addedFolder';
            
            items.push(folderItem);
        }

        return Promise.resolve(items);
    }

    private async getFilesInDirectory(dirPath: string): Promise<vscode.TreeItem[]> {
        try {
            const items = await fs.promises.readdir(dirPath, { withFileTypes: true });
            const treeItems: vscode.TreeItem[] = [];

            for (const item of items) {
                const fullPath = path.join(dirPath, item.name);
                
                if (item.isDirectory()) {
                    if (item.name.startsWith('.') || item.name === 'node_modules') {
                        continue;
                    }

                    const hasTextFiles = await this.directoryHasTextFiles(fullPath);
                    if (!hasTextFiles) {
                        continue;
                    }

                    const folderItem = new vscode.TreeItem(
                        item.name,
                        vscode.TreeItemCollapsibleState.Collapsed
                    );
                    folderItem.iconPath = new vscode.ThemeIcon('folder');
                    folderItem.resourceUri = vscode.Uri.file(fullPath);
                    folderItem.contextValue = 'folder';
                    folderItem.tooltip = fullPath;
                    treeItems.push(folderItem);
                } else if (item.isFile() && this.isTextFile(item.name)) {
                    const stats = await fs.promises.stat(fullPath);
                    const fileItem = new vscode.TreeItem(
                        item.name,
                        vscode.TreeItemCollapsibleState.None
                    );
                    fileItem.resourceUri = vscode.Uri.file(fullPath);
                    fileItem.description = this.formatFileSize(stats.size);
                    fileItem.command = {
                        command: 'txt-reader.loadFile',
                        title: '打开文件',
                        arguments: [fullPath]
                    };
                    fileItem.contextValue = 'txtFile';
                    fileItem.tooltip = fullPath;
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
            console.error('读取目录失败:', error);
            vscode.window.showErrorMessage(`无法读取目录: ${dirPath}`);
            return [];
        }
    }

    private async directoryHasTextFiles(dirPath: string): Promise<boolean> {
        try {
            const items = await fs.promises.readdir(dirPath, { withFileTypes: true });
            
            for (const item of items) {
                const fullPath = path.join(dirPath, item.name);
                
                if (item.isDirectory()) {
                    if (item.name.startsWith('.') || item.name === 'node_modules') {
                        continue;
                    }
                    const subDirHasTextFiles = await this.directoryHasTextFiles(fullPath);
                    if (subDirHasTextFiles) {
                        return true;
                    }
                } else if (item.isFile() && this.isTextFile(item.name)) {
                    return true;
                }
            }
            
            return false;
        } catch (error) {
            console.error('检查文件夹失败:', error);
            return false;
        }
    }

    private isTextFile(filename: string): boolean {
        const ext = path.extname(filename).toLowerCase();
        return ['.txt', '.text', '.md', '.log', '.csv', '.json', '.xml', '.yaml', '.yml'].includes(ext);
    }

    private formatFileSize(size: number): string {
        if (size < 1024) return `${size} B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }
}

export function activate(context: vscode.ExtensionContext) {
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 5);
    statusBarItem.hide();
    context.subscriptions.push(statusBarItem);

    closeButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 6);
    closeButton.text = '$(close)';
    closeButton.tooltip = 'Close File';
    closeButton.command = 'txt-reader.closeFile';
    closeButton.hide();
    context.subscriptions.push(closeButton);

    prevButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 4);
    prevButton.text = '$(chevron-left) ';
    prevButton.tooltip = 'Previous Line';
    prevButton.command = 'txt-reader.previousLine';
    prevButton.hide();
    context.subscriptions.push(prevButton);

    nextButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 3);
    nextButton.text = '$(chevron-right) ';
    nextButton.tooltip = 'Next Line';
    nextButton.command = 'txt-reader.nextLine';
    nextButton.hide();
    context.subscriptions.push(nextButton);

    contentStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 2);
    contentStatusBarItem.hide();
    context.subscriptions.push(contentStatusBarItem);

    progressStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 4.5);
    progressStatusBarItem.hide();
    progressStatusBarItem.command = 'txt-reader.editProgress';
    context.subscriptions.push(progressStatusBarItem);

    const fileExplorerProvider = new FileExplorerProvider();
    
    const treeView = vscode.window.createTreeView('txtReader.explorer', {
        treeDataProvider: fileExplorerProvider
    });
    
    context.subscriptions.push(treeView);

    vscode.workspace.onDidChangeWorkspaceFolders(() => {
        fileExplorerProvider.updateWorkspace();
    });

    registerCommands(context, fileExplorerProvider);

    setupEditorListeners(context);
}

function registerCommands(context: vscode.ExtensionContext, fileExplorerProvider: FileExplorerProvider) {
    const openFileCommand = vscode.commands.registerCommand('txt-reader.openFile', () => {
        if (readingState) {
            openFileInEditor(readingState.filePath);
        } else {
            vscode.window.showInformationMessage('please open a file first');
        }
    });

    const clearFoldersCommand = vscode.commands.registerCommand('txt-reader.clearFolders', () => {
        fileExplorerProvider.clearFolders();
    });

    const addFolderCommand = vscode.commands.registerCommand('txt-reader.addFolder', async () => {
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
    });

    const refreshExplorerCommand = vscode.commands.registerCommand('txt-reader.refreshExplorer', () => {
        fileExplorerProvider.refresh();
        vscode.window.showInformationMessage('Folder list has been refreshed');
    });

    const nextLineCommand = vscode.commands.registerCommand('txt-reader.nextLine', () => {
        navigateLines(1);
    });

    const previousLineCommand = vscode.commands.registerCommand('txt-reader.previousLine', () => {
        navigateLines(-1);
    });

    const closeFileCommand = vscode.commands.registerCommand('txt-reader.closeFile', () => {
        closeCurrentFile();
    });

    const loadFileCommand = vscode.commands.registerCommand('txt-reader.loadFile', (filePath: string) => {
        loadFile(filePath);
    });

    const editProgressCommand = vscode.commands.registerCommand('txt-reader.editProgress', async () => {
        if (!readingState) {
            vscode.window.showInformationMessage('请先打开一个文本文件');
            return;
        }

        const currentLine = readingState.currentLineIndex + 1;
        const totalLines = readingState.lines.length;
        
        const input = await vscode.window.showInputBox({
            prompt: `输入要跳转的行号 (1-${totalLines})`,
            value: currentLine.toString(),
            validateInput: (value) => {
                const lineNum = parseInt(value);
                if (isNaN(lineNum)) {
                    return '请输入有效的数字';
                }
                if (lineNum < 1 || lineNum > totalLines) {
                    return `行号必须在 1 到 ${totalLines} 之间`;
                }
                return null;
            }
        });

        if (input) {
            const lineNum = parseInt(input);
            if (lineNum >= 1 && lineNum <= totalLines) {
                readingState.currentLineIndex = lineNum - 1;
                updateStatusBars();
                vscode.window.showInformationMessage(`已跳转到第 ${lineNum} 行`);
            }
        }
    });

    context.subscriptions.push(
        openFileCommand,
        addFolderCommand,
        clearFoldersCommand,
        refreshExplorerCommand,
        nextLineCommand,
        previousLineCommand,
        closeFileCommand,
        loadFileCommand,
        editProgressCommand
    );
}

function setupEditorListeners(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor && isTextFile(editor.document)) {
                loadFile(editor.document.uri.fsPath);
            }
        })
    );
}

function isTextFile(document: vscode.TextDocument): boolean {
    return document.languageId === 'plaintext' || 
           document.fileName.endsWith('.txt') ||
           document.fileName.endsWith('.text');
}

async function loadFile(filePath: string): Promise<void> {
    try {
        const content = await fs.promises.readFile(filePath, 'utf-8');
        const lines = content.split(/\r?\n/);
        
        if (lines.length === 0) {
            vscode.window.showWarningMessage('文件为空');
            return;
        }

        readingState = {
            filePath,
            lines,
            currentLineIndex: 0
        };

        updateStatusBars();
        showNavigationButtons();
        
        vscode.window.showInformationMessage(
            `已加载: ${path.basename(filePath)} (共 ${lines.length} 行)`
        );
        
    } catch (error) {
        vscode.window.showErrorMessage(`读取文件失败: ${error}`);
    }
}

function openFileInEditor(filePath: string): void {
    const uri = vscode.Uri.file(filePath);
    
    vscode.window.showTextDocument(uri, {
        viewColumn: vscode.ViewColumn.Beside,
        preserveFocus: false,
        preview: false
    }).then(editor => {
        if (readingState) {
            const position = new vscode.Position(readingState.currentLineIndex, 0);
            editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
            editor.selection = new vscode.Selection(position, position);
        }
    }, error => {
        vscode.window.showErrorMessage(`打开文件失败: ${error}`);
    });
}

function navigateLines(direction: number): void {
    if (!readingState) {
        vscode.window.showInformationMessage('请先打开一个文本文件');
        return;
    }

    const newIndex = readingState.currentLineIndex + direction;
    
    if (newIndex >= 0 && newIndex < readingState.lines.length) {
        readingState.currentLineIndex = newIndex;
        updateStatusBars();
    } else if (newIndex < 0) {
        vscode.window.showInformationMessage('已经是第一行了');
    } else {
        vscode.window.showInformationMessage('已经是最后一行了');
    }
}

function updateStatusBars(): void {
    if (readingState) {
        const currentLine = readingState.lines[readingState.currentLineIndex];
        const fileName = path.basename(readingState.filePath);
        const lineNumber = readingState.currentLineIndex + 1;
        const totalLines = readingState.lines.length;
        
        // 显示文件和进度信息
        statusBarItem.text = `$(book)`;
        statusBarItem.tooltip = `${fileName}`;
        statusBarItem.command = 'txt-reader.openFile';
        
        // 显示文本内容
        const displayText = formatContentForStatusBar(currentLine);
        //contentStatusBarItem.text = displayText.text;
        contentStatusBarItem.text = `$(edit)`
        contentStatusBarItem.tooltip = `${currentLine || '(空行)'}`;

        // 更新进度状态栏
        progressStatusBarItem.text = `${lineNumber}/${totalLines}`;
        progressStatusBarItem.tooltip = `点击编辑行号 | 当前: ${lineNumber}/${totalLines}`;
    }
}

function showNavigationButtons(): void {
    if (readingState) {
        // prevButton.show();
        // nextButton.show();
        statusBarItem.show();
        contentStatusBarItem.show();
        closeButton.show();
        progressStatusBarItem.show();
    }
}

function hideNavigationButtons(): void {
    prevButton.hide();
    nextButton.hide();
    statusBarItem.hide();
    contentStatusBarItem.hide();
    closeButton.hide();
    progressStatusBarItem.hide();
}

function formatContentForStatusBar(text: string): { text: string, wasTruncated: boolean } {
    if (!text) return { text: '$(pass) 空行', wasTruncated: false };
    
    const cleanedText = text.replace(/\s+/g, ' ').trim();
    const maxLength = 90;
    
    if (cleanedText.length <= maxLength) {
        return { text: `$(edit) ${cleanedText}`, wasTruncated: false };
    } else {
        const truncated = cleanedText.substring(0, maxLength - 3) + '...';
        return { text: `$(edit) ${truncated}`, wasTruncated: true };
    }
}

function closeCurrentFile(): void {
    readingState = undefined;
    hideNavigationButtons();
    //vscode.window.showInformationMessage('File closed');
}

export function deactivate() {
    closeCurrentFile();
}