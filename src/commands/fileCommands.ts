import * as vscode from 'vscode';
import { ReadingStateManager } from '../core/readingState';
import { FileUtils } from '../utils/fileUtils';
import { StatusBarManager } from '../ui/statusBarManager';

export async function loadFile(filePath: string, statusBarManager?: StatusBarManager): Promise<void> {
    try {
        const lines = await FileUtils.readFileContent(filePath);

        if (lines.length === 0) {
            vscode.window.showWarningMessage('文件为空');
            return;
        }

        const readingStateManager = ReadingStateManager.getInstance();
        const chapters = readingStateManager.detectChapters(lines);

        // console.log('文件加载完成:', {
        //     filePath,
        //     linesCount: lines.length,
        //     chaptersCount: chapters.length,
        //     chapters: chapters.map(c => ({ title: c.title, line: c.lineIndex }))
        // });

        readingStateManager.currentState = {
            filePath,
            lines,
            currentLineIndex: 0,
            chapters
        };

        // 调试：打印章节信息
        //readingStateManager.debugChapters();

        // 文件加载后立即更新状态栏
        if (statusBarManager) {
            statusBarManager.updateStatusBars();
        }

        const chapterInfo = chapters.length > 0 ? ` (共 ${lines.length} 行, ${chapters.length} 个章节)` : ` (共 ${lines.length} 行)`;
        // vscode.window.showInformationMessage(
        //     `已加载: ${path.basename(filePath)}${chapterInfo}`
        // );

    } catch (error) {
        vscode.window.showErrorMessage(`读取文件失败: ${error}`);
    }
}

export function openFileInEditor(filePath: string): void {
    const readingStateManager = ReadingStateManager.getInstance();
    if (!readingStateManager.hasState()) {
        vscode.window.showInformationMessage('请先打开一个文件');
        return;
    }

    const uri = vscode.Uri.file(filePath);

    vscode.window.showTextDocument(uri, {
        viewColumn: vscode.ViewColumn.Beside,
        preserveFocus: false,
        preview: false
    }).then(editor => {
        const state = readingStateManager.currentState;
        if (state) {
            const position = new vscode.Position(state.currentLineIndex, 0);
            editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
            editor.selection = new vscode.Selection(position, position);
        }
    }, error => {
        vscode.window.showErrorMessage(`打开文件失败: ${error}`);
    });
}

export function closeCurrentFile(statusBarManager?: StatusBarManager): void {
    const readingStateManager = ReadingStateManager.getInstance();
    readingStateManager.clear();

    // 关闭文件后更新状态栏以隐藏相关元素
    if (statusBarManager) {
        statusBarManager.updateStatusBars();
    }

    //vscode.window.showInformationMessage('文件已关闭');
}