import * as vscode from 'vscode';
import { FileExplorerProvider } from './providers/fileExplorerProvider';
import { StatusBarManager } from './ui/statusBarManager';
import { registerAllCommands } from './commands';

// 全局变量声明
let fileExplorerProvider: FileExplorerProvider | undefined;
let statusBarManager: StatusBarManager | undefined;

/**
 * 扩展激活函数 - 当扩展被激活时由VSCode自动调用
 * @param context VSCode扩展上下文，用于管理扩展的生命周期和订阅
 */
export function activate(context: vscode.ExtensionContext) {
    // 初始化核心组件
    fileExplorerProvider = new FileExplorerProvider();
    statusBarManager = new StatusBarManager(context);

    // 创建树视图，用于在侧边栏显示文件资源管理器
    const treeView = vscode.window.createTreeView('txtReader.explorer', {
        treeDataProvider: fileExplorerProvider
    });

    // 将树视图添加到订阅列表，确保在扩展停用时正确清理
    context.subscriptions.push(treeView);

    // 注册命令
    registerAllCommands(context, fileExplorerProvider, statusBarManager);

    // 监听工作区文件夹变化，当工作区文件夹添加或删除时更新文件资源管理器
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
        fileExplorerProvider?.updateWorkspace();
    });

    // 初始更新一次状态栏（确保隐藏）
    statusBarManager.updateStatusBars();
}

/**
 * 扩展停用函数 - 当扩展被停用时由VSCode自动调用
 * 用于执行清理操作和资源释放
 */
export function deactivate() {
    statusBarManager?.dispose();
}