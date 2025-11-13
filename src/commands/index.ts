import * as vscode from 'vscode';
import { FileExplorerProvider } from '../providers/fileExplorerProvider';
import { StatusBarManager } from '../ui/statusBarManager';
import { COMMAND_NAMES } from '../core/constants';
import { openFileInEditor, loadFile, closeCurrentFile } from './fileCommands';
import { navigateLines, editProgress, showChapterList, editChapterPattern, resetChapterPattern } from './navigationCommands';
import { addFolder, clearFolders, refreshExplorer } from './folderCommands';

export function registerAllCommands(
    context: vscode.ExtensionContext,
    fileExplorerProvider: FileExplorerProvider,
    statusBarManager: StatusBarManager
): void {
    const commands = [
        vscode.commands.registerCommand(COMMAND_NAMES.OPEN_FILE, () => {
            const readingStateManager = require('../core/readingState').ReadingStateManager.getInstance();
            const state = readingStateManager.currentState;
            if (state) {
                openFileInEditor(state.filePath);
            } else {
                vscode.window.showInformationMessage('请先打开一个文件');
            }
        }),

        vscode.commands.registerCommand(COMMAND_NAMES.LOAD_FILE, (filePath: string) => {
            // 传递 statusBarManager 以确保加载后更新状态栏
            loadFile(filePath, statusBarManager);
        }),

        vscode.commands.registerCommand(COMMAND_NAMES.CLOSE_FILE, () => {
            closeCurrentFile(statusBarManager);
        }),

        vscode.commands.registerCommand(COMMAND_NAMES.NEXT_LINE, () => {
            navigateLines(1);
            statusBarManager.updateStatusBars();
        }),

        vscode.commands.registerCommand(COMMAND_NAMES.PREVIOUS_LINE, () => {
            navigateLines(-1);
            statusBarManager.updateStatusBars();
        }),

        vscode.commands.registerCommand(COMMAND_NAMES.EDIT_PROGRESS, async () => {
            await editProgress();
            statusBarManager.updateStatusBars();
        }),

        vscode.commands.registerCommand(COMMAND_NAMES.SHOW_CHAPTER_LIST, async () => {
            await showChapterList();
            statusBarManager.updateStatusBars();
        }),

        vscode.commands.registerCommand(COMMAND_NAMES.EDIT_CHAPTER_PATTERN, async () => {
            await editChapterPattern();
            statusBarManager.updateStatusBars();
        }),

        vscode.commands.registerCommand(COMMAND_NAMES.RESET_CHAPTER_PATTERN, () => {
            resetChapterPattern();
            statusBarManager.updateStatusBars();
        }),

        vscode.commands.registerCommand(COMMAND_NAMES.ADD_FOLDER, () => {
            addFolder(fileExplorerProvider);
        }),

        vscode.commands.registerCommand(COMMAND_NAMES.CLEAR_FOLDERS, () => {
            clearFolders(fileExplorerProvider);
        }),

        vscode.commands.registerCommand(COMMAND_NAMES.REFRESH_EXPLORER, () => {
            refreshExplorer(fileExplorerProvider);
        })
    ];

    commands.forEach(command => context.subscriptions.push(command));
}