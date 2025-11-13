import * as vscode from 'vscode';
import * as path from 'path';
import { SUPPORTED_FILE_EXTENSIONS } from '../core/constants';

export class FileUtils {
    /**
     * 检查文件是否为支持的文本文件
     * @param filename 文件名
     * @returns 是否是文本文件
     */
    static isTextFile(filename: string): boolean {
        const ext = path.extname(filename).toLowerCase();
        return SUPPORTED_FILE_EXTENSIONS.includes(ext);
    }

    /**
     * 格式化文件大小显示
     * @param size 文件大小（字节）
     * @returns 格式化后的文件大小字符串
     */
    static formatFileSize(size: number): string {
        if (size < 1024) return `${size} B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }

    /**
     * 读取文件内容，自动尝试UTF-8和GBK编码
     * @param filePath 文件路径
     * @returns 文件内容按行分割的数组
     */
    static async readFileContent(filePath: string): Promise<string[]> {
        try {
            // 读取文件二进制数据
            const content = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
            const buffer = Buffer.from(content);

            // 首先尝试UTF-8解码
            try {
                const text = buffer.toString('utf-8');
                // 检查是否有UTF-8解码错误（替换字符）
                if (!text.includes('�')) {
                    const lines = text.split(/\r?\n/);
                    return lines;
                }
                // 如果有替换字符，说明UTF-8解码不完整，尝试GBK
                throw new Error('UTF-8解码存在替换字符');
            } catch (utf8Error) {
                // UTF-8解码失败，尝试GBK解码
                try {
                    // 使用TextDecoder进行GBK解码
                    const decoder = new TextDecoder('gbk');
                    const text = decoder.decode(buffer);
                    const lines = text.split(/\r?\n/);
                    console.log(`文件 ${path.basename(filePath)} 使用GBK编码成功解码`);
                    return lines;
                } catch (gbkError) {
                    // 如果GBK也失败，最后尝试latin1（ISO-8859-1）作为兜底
                    try {
                        const text = buffer.toString('latin1');
                        const lines = text.split(/\r?\n/);
                        console.log(`文件 ${path.basename(filePath)} 使用latin1编码作为兜底方案`);
                        return lines;
                    } catch (latin1Error) {
                        throw new Error(`无法解码文件: 尝试了UTF-8、GBK、latin1编码均失败`);
                    }
                }
            }
        } catch (error) {
            throw new Error(`读取文件失败: ${error}`);
        }
    }

    /**
     * 检查文档是否为文本文件
     * @param document VSCode文本文档
     * @returns 是否是文本文件
     */
    static isDocumentTextFile(document: vscode.TextDocument): boolean {
        return document.languageId === 'plaintext' ||
            document.fileName.endsWith('.txt') ||
            document.fileName.endsWith('.text');
    }

    /**
     * 检查目录是否包含文本文件（递归检查）
     * @param dirPath 目录路径
     * @returns 是否包含文本文件
     */
    static async directoryHasTextFiles(dirPath: string): Promise<boolean> {
        try {
            const items = await vscode.workspace.fs.readDirectory(vscode.Uri.file(dirPath));

            for (const [name, type] of items) {
                const fullPath = path.join(dirPath, name);

                if (type === vscode.FileType.Directory) {
                    // 跳过隐藏文件夹和node_modules
                    if (name.startsWith('.') || name === 'node_modules') {
                        continue;
                    }
                    // 递归检查子目录
                    const subDirHasTextFiles = await this.directoryHasTextFiles(fullPath);
                    if (subDirHasTextFiles) {
                        return true;
                    }
                } else if (type === vscode.FileType.File && this.isTextFile(name)) {
                    return true;
                }
            }

            return false;
        } catch (error) {
            console.error('检查文件夹失败:', error);
            return false;
        }
    }

    /**
     * 获取目录中的文件列表
     * @param dirPath 目录路径
     * @returns 文件信息数组
     */
    static async getFilesInDirectory(dirPath: string): Promise<{ name: string; path: string; type: vscode.FileType; size?: number }[]> {
        try {
            const items = await vscode.workspace.fs.readDirectory(vscode.Uri.file(dirPath));
            const result = [];

            for (const [name, type] of items) {
                const fullPath = path.join(dirPath, name);

                if (type === vscode.FileType.Directory) {
                    // 跳过隐藏文件夹和node_modules
                    if (name.startsWith('.') || name === 'node_modules') {
                        continue;
                    }
                    result.push({ name, path: fullPath, type });
                } else if (type === vscode.FileType.File && this.isTextFile(name)) {
                    try {
                        const stat = await vscode.workspace.fs.stat(vscode.Uri.file(fullPath));
                        result.push({ name, path: fullPath, type, size: stat.size });
                    } catch {
                        result.push({ name, path: fullPath, type });
                    }
                }
            }

            return result;
        } catch (error) {
            console.error('读取目录失败:', error);
            throw error;
        }
    }
}