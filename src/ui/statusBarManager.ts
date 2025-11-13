import * as vscode from 'vscode';
import { ReadingStateManager } from '../core/readingState';
import { NavigationButtons } from './buttons';
import { COMMAND_NAMES, STATUS_BAR_PRIORITY } from '../core/constants';

export class StatusBarManager {
    private statusBarItem: vscode.StatusBarItem;
    private contentStatusBarItem: vscode.StatusBarItem;
    private progressStatusBarItem: vscode.StatusBarItem;
    private chapterStatusBarItem: vscode.StatusBarItem;
    private patternStatusBarItem: vscode.StatusBarItem;
    private navigationButtons: NavigationButtons;

    constructor(private context: vscode.ExtensionContext) {
        // 在构造函数中明确初始化所有属性
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, STATUS_BAR_PRIORITY.MAIN);
        this.contentStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, STATUS_BAR_PRIORITY.CONTENT);
        this.progressStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, STATUS_BAR_PRIORITY.PROGRESS);
        this.chapterStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, STATUS_BAR_PRIORITY.CHAPTER);
        this.patternStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, STATUS_BAR_PRIORITY.PATTERN);
        this.navigationButtons = new NavigationButtons(context);

        this.initializeStatusBars();
    }

    private initializeStatusBars(): void {
        // 设置命令
        this.statusBarItem.command = COMMAND_NAMES.OPEN_FILE;
        this.progressStatusBarItem.command = COMMAND_NAMES.EDIT_PROGRESS;
        this.chapterStatusBarItem.command = COMMAND_NAMES.SHOW_CHAPTER_LIST;
        this.patternStatusBarItem.command = COMMAND_NAMES.EDIT_CHAPTER_PATTERN;

        // 初始隐藏所有状态栏按钮
        this.hideNavigation();

        // 添加到订阅
        [this.statusBarItem, this.contentStatusBarItem, this.progressStatusBarItem, this.chapterStatusBarItem, this.patternStatusBarItem]
            .forEach(item => this.context.subscriptions.push(item));
    }

    updateStatusBars(): void {
        const readingStateManager = ReadingStateManager.getInstance();

        if (!readingStateManager.hasState()) {
            this.hideNavigation();
            return;
        }

        const currentLine = readingStateManager.getCurrentLine();
        const fileName = readingStateManager.getFileName();
        const progress = readingStateManager.getProgress();
        const currentChapter = readingStateManager.getCurrentChapter();
        const hasChapters = readingStateManager.hasChapters();
        const chapterPattern = readingStateManager.chapterPattern;

        // 更新主按钮
        this.statusBarItem.text = `$(book)`;
        this.statusBarItem.tooltip = `${fileName}`;

        // 更新正则表达式按钮
        this.patternStatusBarItem.text = `$(regex)`;
        this.patternStatusBarItem.tooltip = `点击修改章节正则 | 当前: ${chapterPattern}`;

        // 更新章节按钮
        if (hasChapters && currentChapter) {
            // 截断过长的章节标题
            let chapterText = currentChapter.title;
            if (chapterText.length > 30) {
                chapterText = chapterText.substring(0, 27) + '...';
            }
            this.chapterStatusBarItem.text = `$(list-ordered)`;
            this.chapterStatusBarItem.tooltip = `点击显示章节列表 | 当前: ${currentChapter.title}`;
            this.chapterStatusBarItem.show();
        } else {
            this.chapterStatusBarItem.hide();
        }

        // 更新进度
        this.progressStatusBarItem.text = `${progress.current}/${progress.total}`;
        this.progressStatusBarItem.tooltip = `点击编辑行号 | 当前: ${progress.current}/${progress.total}`;

        // 更新内容
        this.contentStatusBarItem.text = `$(edit)`;
        this.contentStatusBarItem.tooltip = `${currentLine || '(空行)'}`;

        this.showNavigation();
    }

    showNavigation(): void {
        this.statusBarItem.show();
        this.contentStatusBarItem.show();
        this.progressStatusBarItem.show();
        this.patternStatusBarItem.show();
        this.navigationButtons.show();
    }

    hideNavigation(): void {
        this.statusBarItem.hide();
        this.contentStatusBarItem.hide();
        this.progressStatusBarItem.hide();
        this.chapterStatusBarItem.hide();
        this.patternStatusBarItem.hide();
        this.navigationButtons.hide();
    }

    dispose(): void {
        this.hideNavigation();
        this.navigationButtons.dispose();
        this.statusBarItem.dispose();
        this.contentStatusBarItem.dispose();
        this.progressStatusBarItem.dispose();
        this.chapterStatusBarItem.dispose();
        this.patternStatusBarItem.dispose();
    }
}