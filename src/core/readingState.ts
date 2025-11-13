import * as path from 'path';
import * as vscode from 'vscode';
import { DEFAULT_PATTERN } from './constants';

export interface Chapter {
    title: string;
    lineIndex: number;
    level: number;
}

export interface ReadingState {
    filePath: string;
    lines: string[];
    currentLineIndex: number;
    chapters: Chapter[];
}

export interface AddedFolder {
    path: string;
    name: string;
}

export class ReadingStateManager {
    private static instance: ReadingStateManager;
    private _currentState: ReadingState | undefined;
    private _chapterPattern: string = DEFAULT_PATTERN; // 默认正则表达式

    private constructor() { }

    static getInstance(): ReadingStateManager {
        if (!ReadingStateManager.instance) {
            ReadingStateManager.instance = new ReadingStateManager();
        }
        return ReadingStateManager.instance;
    }

    get currentState(): ReadingState | undefined {
        return this._currentState;
    }

    set currentState(state: ReadingState | undefined) {
        this._currentState = state;
    }

    get chapterPattern(): string {
        return this._chapterPattern;
    }

    set chapterPattern(pattern: string) {
        this._chapterPattern = pattern;
    }

    getCurrentLine(): string {
        if (!this._currentState) return '';
        return this._currentState.lines[this._currentState.currentLineIndex] || '';
    }

    getFileName(): string {
        if (!this._currentState) return '';
        return path.basename(this._currentState.filePath);
    }

    getProgress(): { current: number; total: number } {
        if (!this._currentState) return { current: 0, total: 0 };
        return {
            current: this._currentState.currentLineIndex + 1,
            total: this._currentState.lines.length
        };
    }

    navigateLines(direction: number): boolean {
        if (!this._currentState) return false;

        const newIndex = this._currentState.currentLineIndex + direction;
        if (newIndex >= 0 && newIndex < this._currentState.lines.length) {
            this._currentState.currentLineIndex = newIndex;
            return true;
        }
        return false;
    }

    setProgress(lineNumber: number): boolean {
        if (!this._currentState) return false;

        if (lineNumber >= 1 && lineNumber <= this._currentState.lines.length) {
            this._currentState.currentLineIndex = lineNumber - 1;
            return true;
        }
        return false;
    }

    // 跳转到指定章节
    navigateToChapter(chapterIndex: number): boolean {
        if (!this._currentState || !this._currentState.chapters.length) return false;

        if (chapterIndex >= 0 && chapterIndex < this._currentState.chapters.length) {
            const chapter = this._currentState.chapters[chapterIndex];
            this._currentState.currentLineIndex = chapter.lineIndex;
            return true;
        }
        return false;
    }

    // 获取当前章节（基于当前行位置）
    getCurrentChapter(): Chapter | undefined {
        if (!this._currentState || !this._currentState.chapters.length) return undefined;

        // 找到最后一个小于等于当前行号的章节
        let currentChapter: Chapter | undefined;
        for (let i = this._currentState.chapters.length - 1; i >= 0; i--) {
            const chapter = this._currentState.chapters[i];
            if (chapter.lineIndex <= this._currentState.currentLineIndex) {
                currentChapter = chapter;
                break;
            }
        }

        return currentChapter;
    }

    detectChapters(lines: string[]): Chapter[] {
        const chapters: Chapter[] = [];

        //console.log('开始检测章节，使用正则表达式:', this._chapterPattern);
        //console.log('总行数:', lines.length);

        try {
            const chapterPattern = new RegExp(this._chapterPattern);

            // 首先添加"前言"章节（从第0行到第一个章节之前）
            let firstChapterLine = -1;

            // 先找到第一个章节的行号
            for (let i = 0; i < lines.length; i++) {
                const trimmedLine = lines[i].trim();
                if (trimmedLine) {
                    const match = trimmedLine.match(chapterPattern);
                    if (match) {
                        firstChapterLine = i;
                        break;
                    }
                }
            }

            // 如果有内容在第一个章节之前，添加前言章节
            if (firstChapterLine > 0) {
                chapters.push({
                    title: '前言',
                    lineIndex: 0,
                    level: 1
                });
                //console.log(`添加前言章节，从第 0 行到第 ${firstChapterLine - 1} 行`);
            }

            // 然后添加所有检测到的章节
            lines.forEach((line, index) => {
                const trimmedLine = line.trim();
                if (trimmedLine) {
                    const match = trimmedLine.match(chapterPattern);
                    if (match) {
                        //console.log(`检测到章节: "${match[0]}" 在第 ${index + 1} 行`);
                        chapters.push({
                            title: match[0].trim(),
                            lineIndex: index,
                            level: 1
                        });
                    }
                }
            });

            //console.log(`章节检测完成，共找到 ${chapters.length} 个章节`);
        } catch (error) {
            console.error('正则表达式错误:', error);
            // 如果正则表达式无效，使用默认模式
            vscode.window.showErrorMessage(`正则表达式无效: ${error}`);
        }

        return chapters;
    }

    // 重新检测章节（当正则表达式改变时）
    redetectChapters(): boolean {
        if (!this._currentState) return false;

        const oldChaptersCount = this._currentState.chapters.length;
        const newChapters = this.detectChapters(this._currentState.lines);

        this._currentState.chapters = newChapters;

        // 更新当前章节索引
        if (newChapters.length > 0) {
            this._currentState.currentLineIndex = Math.min(
                this._currentState.currentLineIndex,
                this._currentState.lines.length - 1
            );
        }

        //console.log(`重新检测章节完成: ${oldChaptersCount} -> ${newChapters.length}`);
        return true;
    }

    clear(): void {
        this._currentState = undefined;
    }

    hasState(): boolean {
        return this._currentState !== undefined;
    }

    hasChapters(): boolean {
        return this._currentState !== undefined &&
            this._currentState.chapters !== undefined &&
            this._currentState.chapters.length > 0;
    }

    // 获取所有章节标题
    getChapterTitles(): string[] {
        if (!this._currentState || !this._currentState.chapters.length) return [];
        return this._currentState.chapters.map(chapter => chapter.title);
    }

    // 调试方法：打印章节信息
    debugChapters(): void {
        if (!this._currentState) {
            console.log('没有当前状态');
            return;
        }
        console.log('当前行索引:', this._currentState.currentLineIndex);
        console.log('章节数量:', this._currentState.chapters.length);
        console.log('所有章节:');
        this._currentState.chapters.forEach((chapter, index) => {
            console.log(`  ${index}: "${chapter.title}" 在第 ${chapter.lineIndex} 行`);
        });
        const currentChapter = this.getCurrentChapter();
        console.log('当前章节:', currentChapter?.title);
        console.log('当前正则表达式:', this._chapterPattern);
    }
}