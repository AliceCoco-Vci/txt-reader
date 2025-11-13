export class TextUtils {
    /**
     * 格式化状态栏显示的文本内容
     * 对文本进行清理、截断处理，并添加图标
     * @param text 原始文本内容
     * @returns 格式化后的文本信息和是否被截断的标志
     * 
     * @example
     * // 返回: { text: "$(edit) 这是一段示例文本...", wasTruncated: true }
     * TextUtils.formatContentForStatusBar("这是一段很长的示例文本需要被截断处理");
     */
    static formatContentForStatusBar(text: string): { text: string, wasTruncated: boolean } {
        // 处理空文本情况
        if (!text) return { text: '$(pass) 空行', wasTruncated: false };

        // 清理文本：将连续空白字符替换为单个空格，并去除首尾空格
        const cleanedText = text.replace(/\s+/g, ' ').trim();
        const maxLength = 90; // 状态栏显示的最大字符长度

        // 根据文本长度决定是否截断
        if (cleanedText.length <= maxLength) {
            // 文本长度合适，直接显示完整内容
            return { text: `$(edit) ${cleanedText}`, wasTruncated: false };
        } else {
            // 文本过长，进行截断并在末尾添加省略号
            const truncated = cleanedText.substring(0, maxLength - 3) + '...';
            return { text: `$(edit) ${truncated}`, wasTruncated: true };
        }
    }

    /**
     * 验证行号输入的有效性
     * 检查输入是否为数字且在有效范围内
     * @param input 用户输入的行号字符串
     * @param maxLines 文件的最大行数
     * @returns 错误信息字符串（如果验证通过则返回null）
     * 
     * @example
     * // 返回: "行号必须在 1 到 100 之间"
     * TextUtils.validateLineNumber("150", 100);
     * 
     * @example
     * // 返回: null (验证通过)
     * TextUtils.validateLineNumber("50", 100);
     */
    static validateLineNumber(input: string, maxLines: number): string | null {
        // 将输入转换为数字
        const lineNum = parseInt(input);

        // 检查是否为有效数字
        if (isNaN(lineNum)) {
            return '请输入有效的数字';
        }

        // 检查行号是否在有效范围内
        if (lineNum < 1 || lineNum > maxLines) {
            return `行号必须在 1 到 ${maxLines} 之间`;
        }

        // 验证通过
        return null;
    }
}