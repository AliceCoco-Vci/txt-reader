export const SUPPORTED_FILE_EXTENSIONS = [
    '.txt', '.text', '.md', '.log', '.csv', '.json', '.xml', '.yaml', '.yml'
];

export const COMMAND_NAMES = {
    OPEN_FILE: 'txt-reader.openFile',
    CLOSE_FILE: 'txt-reader.closeFile',
    LOAD_FILE: 'txt-reader.loadFile',
    NEXT_LINE: 'txt-reader.nextLine',
    PREVIOUS_LINE: 'txt-reader.previousLine',
    EDIT_PROGRESS: 'txt-reader.editProgress',
    ADD_FOLDER: 'txt-reader.addFolder',
    CLEAR_FOLDERS: 'txt-reader.clearFolders',
    REFRESH_EXPLORER: 'txt-reader.refreshExplorer',
    SHOW_CHAPTER_LIST: 'txt-reader.showChapterList',
    EDIT_CHAPTER_PATTERN: 'txt-reader.editChapterPattern',
    RESET_CHAPTER_PATTERN: 'txt-reader.resetChapterPattern'
} as const;

export const STATUS_BAR_PRIORITY = {
    CLOSE_BUTTON: 8,
    MAIN: 7,
    PATTERN: 6,
    CHAPTER: 5,
    PROGRESS: 4,
    PREV_BUTTON: 3,
    NEXT_BUTTON: 2,
    CONTENT: 1,
} as const;

export const DEFAULT_PATTERN = '^第\\d+章.*$';