import * as vscode from 'vscode';
import { ReadingStateManager } from '../core/readingState';
import { TextUtils } from '../utils/textUtils';
import { DEFAULT_PATTERN } from '../core/constants';

export function navigateLines(direction: number): void {
    const readingStateManager = ReadingStateManager.getInstance();

    if (!readingStateManager.hasState()) {
        vscode.window.showInformationMessage('请先打开一个文本文件');
        return;
    }

    const success = readingStateManager.navigateLines(direction);

    if (!success) {
        if (direction > 0) {
            vscode.window.showInformationMessage('已经是最后一行了');
        } else {
            vscode.window.showInformationMessage('已经是第一行了');
        }
    }
}

export async function editProgress(): Promise<void> {
    const readingStateManager = ReadingStateManager.getInstance();

    if (!readingStateManager.hasState()) {
        vscode.window.showInformationMessage('请先打开一个文本文件');
        return;
    }

    const progress = readingStateManager.getProgress();
    const totalLines = progress.total;

    const input = await vscode.window.showInputBox({
        prompt: `输入要跳转的行号 (1-${totalLines})`,
        value: progress.current.toString(),
        validateInput: (value) => TextUtils.validateLineNumber(value, totalLines)
    });

    if (input) {
        const lineNum = parseInt(input);
        const success = readingStateManager.setProgress(lineNum);

        if (success) {
            vscode.window.showInformationMessage(`已跳转到第 ${lineNum} 行`);
        }
    }
}

// 显示章节列表
export async function showChapterList(): Promise<void> {
    const readingStateManager = ReadingStateManager.getInstance();

    if (!readingStateManager.hasState()) {
        vscode.window.showInformationMessage('请先打开一个文本文件');
        return;
    }

    if (!readingStateManager.hasChapters()) {
        vscode.window.showInformationMessage('文件中没有检测到章节');
        return;
    }

    const state = readingStateManager.currentState;
    if (!state) return;

    const items = state.chapters.map((chapter, index) => ({
        label: chapter.title,
        //description: `第 ${index + 1} 章`,
        detail: `行号: ${chapter.lineIndex + 1}`,
        chapterIndex: index
    }));

    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: '选择要跳转的章节',
        matchOnDescription: true,
        matchOnDetail: true
    });

    if (selected) {
        const success = readingStateManager.navigateToChapter(selected.chapterIndex);
        if (success) {
            vscode.window.showInformationMessage(`已跳转到: ${state.chapters[selected.chapterIndex].title}`);
        }
    }
}

// 修改章节正则表达式
export async function editChapterPattern(): Promise<void> {
    const readingStateManager = ReadingStateManager.getInstance();

    const currentPattern = readingStateManager.chapterPattern;

    const input = await vscode.window.showInputBox({
        prompt: '输入新的章节识别正则表达式',
        value: currentPattern,
        placeHolder: '例如:' + DEFAULT_PATTERN,
        validateInput: (value) => {
            if (!value) {
                return '正则表达式不能为空';
            }
            try {
                new RegExp(value);
                return null;
            } catch (error) {
                return `无效的正则表达式: ${error}`;
            }
        }
    });

    if (input && input !== currentPattern) {
        readingStateManager.chapterPattern = input;

        // 如果当前有打开的文件，重新检测章节
        if (readingStateManager.hasState()) {
            const success = readingStateManager.redetectChapters();
            if (success) {
                const newChaptersCount = readingStateManager.currentState?.chapters.length || 0;
                vscode.window.showInformationMessage(
                    `章节正则表达式已更新，检测到 ${newChaptersCount} 个章节`
                );
            }
        } else {
            vscode.window.showInformationMessage(`章节正则表达式已更新: ${input}`);
        }
    }
}

// 重置为正则表达式
export function resetChapterPattern(): void {
    const readingStateManager = ReadingStateManager.getInstance();
    const defaultPattern = DEFAULT_PATTERN;

    readingStateManager.chapterPattern = defaultPattern;

    // 如果当前有打开的文件，重新检测章节
    if (readingStateManager.hasState()) {
        const success = readingStateManager.redetectChapters();
        if (success) {
            const newChaptersCount = readingStateManager.currentState?.chapters.length || 0;
            vscode.window.showInformationMessage(
                `已重置为默认正则表达式，检测到 ${newChaptersCount} 个章节`
            );
        }
    } else {
        vscode.window.showInformationMessage(`已重置为默认正则表达式: ${defaultPattern}`);
    }
}