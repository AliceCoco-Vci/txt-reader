import * as vscode from 'vscode';
import { STATUS_BAR_PRIORITY, COMMAND_NAMES } from '../core/constants';

export class NavigationButtons {
    public closeButton: vscode.StatusBarItem;
    public prevButton: vscode.StatusBarItem;
    public nextButton: vscode.StatusBarItem;

    constructor(private context: vscode.ExtensionContext) {
        this.closeButton = this.createButton(
            '$(close)',
            '关闭文件',
            COMMAND_NAMES.CLOSE_FILE,
            STATUS_BAR_PRIORITY.CLOSE_BUTTON
        );

        this.prevButton = this.createButton(
            '$(chevron-left) ',
            '上一行',
            COMMAND_NAMES.PREVIOUS_LINE,
            STATUS_BAR_PRIORITY.PREV_BUTTON
        );

        this.nextButton = this.createButton(
            '$(chevron-right) ',
            '下一行',
            COMMAND_NAMES.NEXT_LINE,
            STATUS_BAR_PRIORITY.NEXT_BUTTON
        );
    }

    private createButton(text: string, tooltip: string, command: string, priority: number): vscode.StatusBarItem {
        const button = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, priority);
        button.text = text;
        button.tooltip = tooltip;
        button.command = command;
        button.hide();
        this.context.subscriptions.push(button);
        return button;
    }

    show(): void {
        this.closeButton.show();
        // 可以根据需要决定是否显示前后导航按钮
        // this.prevButton.show();
        // this.nextButton.show();
    }

    hide(): void {
        this.closeButton.hide();
        this.prevButton.hide();
        this.nextButton.hide();
    }

    dispose(): void {
        this.closeButton.dispose();
        this.prevButton.dispose();
        this.nextButton.dispose();
    }
}