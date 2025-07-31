import { WorkspaceLeaf, ItemView, TFolder, TFile, Menu, Notice, Platform, setIcon, getFrontMatterInfo, FrontMatterCache, normalizePath, setTooltip, MarkdownRenderer, Component } from 'obsidian';
import GridExplorerPlugin from './main';
import { handleKeyDown } from './handleKeyDown';
import { isDocumentFile, isMediaFile, isImageFile, isVideoFile, isAudioFile, sortFiles, ignoredFiles, getFiles, IMAGE_EXTENSIONS, VIDEO_EXTENSIONS, isFolderIgnored } from './fileUtils';
import { FileWatcher } from './fileWatcher';
import { findFirstImageInNote } from './mediaUtils';
import { showFolderSelectionModal } from './modal/folderSelectionModal';
import { MediaModal } from './modal/mediaModal';
import { showFolderNoteSettingsModal } from './modal/folderNoteSettingsModal';
import { showNoteSettingsModal } from './modal/noteSettingsModal';
import { showFolderRenameModal } from './modal/folderRenameModal';
import { moveFolderSuggestModal } from './modal/moveFolderSuggestModal';
import { showSearchModal } from './modal/searchModal';
import { CustomModeModal } from './modal/customModeModal';
import { ShortcutSelectionModal } from './modal/shortcutSelectionModal';
import { FloatingAudioPlayer } from './floatingAudioPlayer';
import { t } from './translations';

// 定義分隔器狀態
interface DividerState { lastDateString: string; pinDividerAdded: boolean; blankDividerAdded: boolean; }

// 定義檔案渲染參數
interface FileRenderParams {
    container: HTMLElement;
    observer: IntersectionObserver;
    files: TFile[];
    dateDividerMode: string;
    sortType: string;
    shouldShowDateDividers: boolean;
    state: DividerState;
}

// 定義網格視圖
export class GridView extends ItemView {
    plugin: GridExplorerPlugin;
    sourceMode: string = ''; // 模式選擇
    sourcePath: string = ''; // 用於資料夾模式的路徑
    sortType: string; // 排序模式
    folderSortType: string = ''; // 資料夾排序模式
    searchQuery: string = ''; // 搜尋關鍵字
    searchAllFiles: boolean = true; // 是否搜尋所有筆記
    searchMediaFiles: boolean = false; // 是否搜尋媒體檔案
    randomNoteIncludeMedia: boolean = false; // 隨機筆記是否包含圖片和影片
    selectedItemIndex: number = -1; // 當前選中的項目索引
    selectedItems: Set<number> = new Set(); // 存儲多選的項目索引
    gridItems: HTMLElement[] = []; // 存儲所有網格項目的引用
    hasKeyboardFocus: boolean = false; // 是否有鍵盤焦點
    fileWatcher: FileWatcher;
    recentSources: string[] = []; // 歷史記錄
    minMode: boolean = false; // 最小模式
    showIgnoredFolders: boolean = false; // 顯示忽略資料夾
    showDateDividers: boolean = false; // 顯示日期分隔器
    showNoteTags: boolean = false; // 顯示筆記標籤
    pinnedList: string[] = []; // 置頂清單
    taskFilter: string = 'uncompleted'; // 任務分類
    hideHeaderElements: boolean = false; // 是否隱藏標題列元素（模式名稱和按鈕）
    customOptionIndex: number = -1; // 自訂模式選項索引    
    baseCardLayout: 'horizontal' | 'vertical' = 'horizontal'; // 使用者在設定或 UI 中選擇的基礎卡片樣式（不受資料夾臨時覆蓋影響）
    cardLayout: 'horizontal' | 'vertical' = 'horizontal'; // 目前實際使用的卡片樣式（可能被資料夾 metadata 臨時覆蓋）
    private renderToken: number = 0; // 用於取消尚未完成之批次排程的遞增令牌
    isShowingNote: boolean = false; // 是否正在顯示筆記
    private noteViewContainer: HTMLElement | null = null; // 筆記檢視容器

    constructor(leaf: WorkspaceLeaf, plugin: GridExplorerPlugin) {
        super(leaf);
        this.plugin = plugin;
        this.containerEl.addClass('ge-grid-view-container');
        this.sortType = this.plugin.settings.defaultSortType; // 使用設定中的預設排序模式
        this.baseCardLayout = this.plugin.settings.cardLayout;
        this.cardLayout = this.baseCardLayout;
        this.showDateDividers = this.plugin.settings.dateDividerMode !== 'none';
        this.showNoteTags = this.plugin.settings.showNoteTags;

        // 根據設定決定是否註冊檔案變更監聽器
        if (this.plugin.settings.enableFileWatcher) {
            this.fileWatcher = new FileWatcher(plugin, this);
            this.fileWatcher.registerFileWatcher();
        }

        // 註冊鍵盤事件處理
        this.registerDomEvent(document, 'keydown', (event: KeyboardEvent) => {
            // 只有當 GridView 是活動視圖時才處理鍵盤事件
            if (this.app.workspace.getActiveViewOfType(GridView) === this) {
                return handleKeyDown(this, event);
            }
        });
    }

    getViewType() {
        return 'grid-view';
    }

    getIcon() {
        if (this.sourceMode.startsWith('custom-')) {
            return 'puzzle';
        } else if (this.sourceMode === 'bookmarks') {
            return 'bookmark';
        } else if (this.sourceMode === 'search') {
            return 'search';
        } else if (this.sourceMode === 'backlinks') {
            return 'links-coming-in';
        } else if (this.sourceMode === 'outgoinglinks') {
            return 'links-going-out';
        } else if (this.sourceMode === 'all-files') {
            return 'book-text';
        } else if (this.sourceMode === 'recent-files') {
            return 'calendar-days';
        } else if (this.sourceMode === 'random-note') {
            return 'dice';
        } else if (this.sourceMode === 'tasks') {
            return 'square-check-big';
        } else if (this.sourceMode === 'folder') {
            return 'folder';
        } else {
            return 'grid';
        }
    }

    getDisplayText() {
        if (this.sourceMode.startsWith('custom-')) {
            const mode = this.plugin.settings.customModes.find(m => m.internalName === this.sourceMode);
            return mode ? mode.displayName : t('custom_mode');
        } else if (this.sourceMode === '') {
            return t('grid_view_title');
        } else if (this.sourceMode === 'bookmarks') {
            return t('bookmarks_mode');
        } else if (this.sourceMode === 'search') {
            return t('search_results');
        } else if (this.sourceMode === 'backlinks') {
            return t('backlinks_mode');
        } else if (this.sourceMode === 'outgoinglinks') {
            return t('outgoinglinks_mode');
        } else if (this.sourceMode === 'all-files') {
            return t('all_files_mode');
        } else if (this.sourceMode === 'recent-files') {
            return t('recent_files_mode');
        } else if (this.sourceMode === 'random-note') {
            return t('random_note_mode');
        } else if (this.sourceMode === 'tasks') {
            return t('tasks_mode');
        } else if (this.sourceMode === 'folder') {
            if (this.sourcePath === '/') {
                return t('root');
            }
            return this.sourcePath;
        } else {
            return '';
        }
    }

    // 判斷當前Leaf是否被釘選
    isPinned(): boolean {
        return (this.leaf as any)?.pinned ?? false;
    }

    // 將來源加入歷史記錄（LRU 去重）
    // 1. 若已有相同紀錄先移除，確保唯一
    // 2. 插入到陣列開頭，代表最新使用
    // 3. 超過上限時裁切
    private pushHistory(mode: string, path: string | null) {
        const sanitizedPath = path ?? '';
        const key = JSON.stringify({ mode, path: sanitizedPath });
        const existingIndex = this.recentSources.indexOf(key);
        if (existingIndex !== -1) {
            this.recentSources.splice(existingIndex, 1);
        }
        this.recentSources.unshift(key);
        const limit = 15;
        if (this.recentSources.length > limit) {
            this.recentSources.length = limit;
        }        
    }

    // resetScroll 為 true 時，會將捲動位置重置到最頂部
    // recordHistory 為 false 時，不會將當前狀態加入歷史記錄
    async setSource(mode: string, path = '', resetScroll = false, recordHistory = true) {
        // 如果新的狀態與當前狀態相同，則不進行任何操作
        if (this.sourceMode === mode && this.sourcePath === path) {
            return;
        }

        // 記錄之前的狀態到歷史記錄中（如果有）
        if (this.sourceMode && recordHistory) {
            this.pushHistory(this.sourceMode, this.sourcePath);
        }

        // 全域搜尋時切換路徑則清空搜尋
        if (this.searchQuery !== '' && this.searchAllFiles) {
            this.searchQuery = '';
        }
        
        // 更新來源模式和路徑
        if(mode !== '') this.sourceMode = mode; 
        if(path !== '') this.sourcePath = path;
        if(this.sourceMode === '') this.sourceMode = 'folder';
        if(this.sourcePath === '') this.sourcePath = '/';
        
        // 讀取Folder設定
        this.folderSortType = '';
        this.pinnedList = [];
        if (this.sourceMode === 'folder') {
            // 檢查是否有與資料夾同名的 md 檔案
            const folderName = this.sourcePath.split('/').pop() || '';
            const mdFilePath = `${this.sourcePath}/${folderName}.md`;
            const mdFile = this.app.vault.getAbstractFileByPath(mdFilePath);
            let tempLayout: 'horizontal' | 'vertical' = this.baseCardLayout;
            if (mdFile instanceof TFile) {
                const metadata = this.app.metadataCache.getFileCache(mdFile)?.frontmatter;
                this.folderSortType = metadata?.sort;
                if (metadata?.cardLayout === 'horizontal' || metadata?.cardLayout === 'vertical') {
                    tempLayout = metadata.cardLayout as 'horizontal' | 'vertical';
                }
            }
            this.cardLayout = tempLayout;
        } else {
            // 非資料夾模式時
            this.cardLayout = this.baseCardLayout; // 回復基礎卡片排列
            this.sourcePath = '/'; // 強制設定路徑為根目錄 (創建筆記用)

            // 切換到自訂模式時重設選項索引
            if(this.sourceMode.startsWith('custom-')) {
                this.customOptionIndex = -1;
                this.folderSortType = 'none';
            }
        }

        // 通知 Obsidian 保存視圖狀態
        this.app.workspace.requestSaveLayout();

        this.render(resetScroll);
    }

    async render(resetScroll = false) {
        // 儲存當前捲動位置
        const scrollContainer = this.containerEl.children[1] as HTMLElement;
        const scrollTop = resetScroll ? 0 : (scrollContainer ? scrollContainer.scrollTop : 0);

        // 保存選中項目的檔案路徑（如果有）
        let selectedFilePath: string | null = null;
        if (this.selectedItemIndex >= 0 && this.selectedItemIndex < this.gridItems.length) {
            const selectedItem = this.gridItems[this.selectedItemIndex];
            selectedFilePath = selectedItem.dataset.filePath || null;
        }

        // 清空整個容器
        this.containerEl.empty();

        // 創建頂部按鈕區域
        const headerButtonsDiv = this.containerEl.createDiv('ge-header-buttons');

        // 為頂部按鈕區域添加點擊事件，點擊後網格容器捲動到最頂部
        headerButtonsDiv.addEventListener('click', (event: MouseEvent) => {
            // 只有當點擊的是頂部按鈕區域本身（而不是其中的按鈕）時才觸發捲動
            if (event.target === headerButtonsDiv) {
                event.preventDefault();
                // 取得網格容器
                const gridContainer = this.containerEl.querySelector('.ge-grid-container');
                if (gridContainer) {
                    gridContainer.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                }
            }
        });

        // 添加回上一步按鈕
        const backButton = headerButtonsDiv.createEl('button', { attr: { 'aria-label': t('back') } });
        setIcon(backButton, 'arrow-left');
        backButton.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            
            if (this.searchQuery !== '') {
                this.searchQuery = '';
                this.app.workspace.requestSaveLayout();
                this.render();
                return;
            }
            
            // 如果有歷史記錄
            if (this.recentSources.length > 0) {
                // 取得最近一筆歷史記錄
                const lastSource = JSON.parse(this.recentSources[0]);
                this.recentSources.shift(); // 從歷史記錄中移除
                
                // 設定來源（不記錄到歷史）
                this.setSource(
                    lastSource.mode, 
                    lastSource.path || '', 
                    true,  // 重設捲動位置
                    false  // 不記錄到歷史
                );
            }
        });

        // 添加右鍵選單支援
        backButton.addEventListener('contextmenu', (event) => {
            // 只有在有歷史記錄時才顯示右鍵選單
            if (this.recentSources.length > 0) {
                event.preventDefault();
                
                const menu = new Menu();
                
                // 添加歷史記錄
                this.recentSources.forEach((sourceInfoStr, index) => {
                    try {
                        const sourceInfo = JSON.parse(sourceInfoStr);
                        const { mode, path } = sourceInfo;
                        
                        // 根據模式顯示圖示和文字
                        let displayText = '';
                        let icon = '';
                        
                        switch (mode) {
                            case 'folder':
                                displayText = path || '/';
                                icon = 'folder';
                                break;
                            case 'bookmarks':
                                displayText = t('bookmarks_mode');
                                icon = 'bookmark';
                                break;
                            case 'search':
                                displayText = t('search_results');
                                icon = 'search';
                                break;
                            case 'backlinks':
                                displayText = t('backlinks_mode');
                                icon = 'links-coming-in';
                                break;
                            case 'outgoinglinks':
                                displayText = t('outgoinglinks_mode');
                                icon = 'links-going-out';
                                break;
                            case 'all-files':
                                displayText = t('all_files_mode');
                                icon = 'book-text';
                                break;
                            case 'recent-files':
                                displayText = t('recent_files_mode');
                                icon = 'calendar-days';
                                break;
                            case 'random-note':
                                displayText = t('random_note_mode');
                                icon = 'dice';
                                break;
                            case 'tasks':
                                displayText = t('tasks_mode');
                                icon = 'square-check-big';
                                break;
                            default:
                                if (mode.startsWith('custom-')) {
                                    const customMode = this.plugin.settings.customModes.find(m => m.internalName === mode);
                                    displayText = customMode ? customMode.displayName : t('custom_mode');
                                    icon = 'puzzle';
                                } else {
                                    displayText = mode;
                                    icon = 'grid';
                                }
                        }
                        
                        // 添加歷史記錄到選單
                        menu.addItem((item) => {
                            item
                                .setTitle(`${displayText}`)
                                .setIcon(`${icon}`)
                                .onClick(() => {
                                    // 找出當前點擊的紀錄索引
                                    const clickedIndex = this.recentSources.findIndex(source => {
                                        const parsed = JSON.parse(source);
                                        return parsed.mode === mode && parsed.path === path;
                                    });
                                    
                                    // 如果找到點擊的紀錄，清除它之上的紀錄
                                    if (clickedIndex !== -1) {
                                        this.recentSources = this.recentSources.slice(clickedIndex + 1);
                                    }

                                    this.setSource(mode, path, true, false);
                                });
                        });
                    } catch (error) {
                        console.error('Failed to parse source info:', error);
                    }
                });
                
                // 顯示歷史選單
                menu.showAtMouseEvent(event);
            }
        });

        // 添加新增筆記按鈕
        const newNoteButton = headerButtonsDiv.createEl('button', { attr: { 'aria-label': t('new_note') } });
        setIcon(newNoteButton, 'square-pen');
        newNoteButton.addEventListener('click', (event) => {                
            event.preventDefault();
            const menu = new Menu();
            // 新增筆記
            menu.addItem((item) => {
                item
                    .setTitle(t('new_note'))
                    .setIcon('square-pen')
                    .onClick(async () => {
                        let newFileName = `${t('untitled')}.md`;
                        let newFilePath = !this.sourcePath || this.sourcePath === '/' ? newFileName : `${this.sourcePath}/${newFileName}`;

                        // 檢查檔案是否已存在，如果存在則遞增編號
                        let counter = 1;
                        while (this.app.vault.getAbstractFileByPath(newFilePath)) {
                            newFileName = `${t('untitled')} ${counter}.md`;
                            newFilePath = !this.sourcePath || this.sourcePath === '/' ? newFileName : `${this.sourcePath}/${newFileName}`;
                            counter++;
                        }

                        try {
                            // 建立新筆記
                            const newFile = await this.app.vault.create(newFilePath, '');
                            // 開啟新筆記
                            await this.app.workspace.getLeaf().openFile(newFile);
                        } catch (error) {
                            console.error('An error occurred while creating a new note:', error);
                        }
                    });
            });
            // 新增資料夾
            menu.addItem((item) => {
                item.setTitle(t('new_folder'))
                .setIcon('folder')
                .onClick(async () => {
                    let newFolderName = `${t('untitled')}`;
                    let newFolderPath = !this.sourcePath || this.sourcePath === '/' ? newFolderName : `${this.sourcePath}/${newFolderName}`;
                    
                    // 檢查資料夾是否已存在，如果存在則遞增編號
                    let counter = 1;
                    while (this.app.vault.getAbstractFileByPath(newFolderPath)) {
                        newFolderName = `${t('untitled')} ${counter}`;
                        newFolderPath = !this.sourcePath || this.sourcePath === '/' ? newFolderName : `${this.sourcePath}/${newFolderName}`;
                        counter++;
                    }
                    
                    try {
                        // 建立新資料夾
                        await this.app.vault.createFolder(newFolderPath);
                        this.render(false);
                    } catch (error) {
                        console.error('An error occurred while creating a new folder:', error);
                    }
                });
            });
            // 新增畫布
            menu.addItem((item) => {
                item.setTitle(t('new_canvas'))
                .setIcon('layout-dashboard')
                .onClick(async () => {
                    let newFileName = `${t('untitled')}.canvas`;
                        let newFilePath = !this.sourcePath || this.sourcePath === '/' ? newFileName : `${this.sourcePath}/${newFileName}`;

                        // 檢查檔案是否已存在，如果存在則遞增編號
                        let counter = 1;
                        while (this.app.vault.getAbstractFileByPath(newFilePath)) {
                            newFileName = `${t('untitled')} ${counter}.canvas`;
                            newFilePath = !this.sourcePath || this.sourcePath === '/' ? newFileName : `${this.sourcePath}/${newFileName}`;
                            counter++;
                        }

                        try {
                            // 建立新筆記
                            const newFile = await this.app.vault.create(newFilePath, '');
                            // 開啟新筆記
                            await this.app.workspace.getLeaf().openFile(newFile);
                        } catch (error) {
                            console.error('An error occurred while creating a new canvas:', error);
                        }
                });
            });
            // 新增捷徑
            menu.addItem((item) => {
                item.setTitle(t('new_shortcut'))
                .setIcon('shuffle')
                .onClick(async () => {
                    this.showShortcutSelectionModal();
                });
            });
            menu.showAtMouseEvent(event);
        });

        // 添加重新選擇資料夾按鈕
        const reselectButton = headerButtonsDiv.createEl('button', { attr: { 'aria-label': t('reselect') }  });
        reselectButton.addEventListener('click', () => {
            showFolderSelectionModal(this.app, this.plugin, this, reselectButton);
        });
        setIcon(reselectButton, "grid");

        // 添加重新整理按鈕
        const refreshButton = headerButtonsDiv.createEl('button', { attr: { 'aria-label': t('refresh') }  });
        refreshButton.addEventListener('click', () => {
            if (this.sortType === 'random') {
                this.clearSelection();
            }
            this.render();
        });
        setIcon(refreshButton, 'refresh-ccw');

        // 添加搜尋按鈕
        const searchButtonContainer = headerButtonsDiv.createDiv('ge-search-button-container');
        const searchButton = searchButtonContainer.createEl('button', {
            cls: 'search-button',
            attr: { 'aria-label': t('search') }
        });
        setIcon(searchButton, 'search');
        searchButton.addEventListener('click', () => {
            showSearchModal(this.app, this, '', searchButton);
        });

        // 如果有搜尋關鍵字，顯示搜尋文字和取消按鈕
        if (this.searchQuery) {
            searchButton.style.display = 'none';
            const searchTextContainer = searchButtonContainer.createDiv('ge-search-text-container');

            // 創建搜尋文字
            const searchText = searchTextContainer.createEl('span', { cls: 'ge-search-text', text: this.searchQuery });
            // 讓搜尋文字可點選
            searchText.style.cursor = 'pointer';
            searchText.addEventListener('click', () => {
                showSearchModal(this.app, this, this.searchQuery, searchText);
            });

            // 創建取消按鈕
            const clearButton = searchTextContainer.createDiv('ge-clear-button');
            setIcon(clearButton, 'x');
            clearButton.addEventListener('click', (e) => {
                e.stopPropagation();  // 防止觸發搜尋文字的點擊事件
                this.searchQuery = '';
                this.clearSelection();
                this.app.workspace.requestSaveLayout();
                this.render();
            });
        }

        // 添加更多選項按鈕
        const menu = new Menu();
        menu.addItem((item) => {
            item
                .setTitle(t('open_new_grid_view'))
                .setIcon('grid')
                .onClick(() => {
                    const { workspace } = this.app;
                    let leaf = null;
                    workspace.getLeavesOfType('grid-view');
                    switch (this.plugin.settings.defaultOpenLocation) {
                        case 'left':
                            leaf = workspace.getLeftLeaf(false);
                            break;
                        case 'right':
                            leaf = workspace.getRightLeaf(false);
                            break;
                        case 'tab':
                        default:
                            leaf = workspace.getLeaf('tab');
                            break;
                    }
                    if (!leaf) {
                        // 如果無法獲取指定位置的 leaf，則回退到新分頁
                        leaf = workspace.getLeaf('tab');
                    }
                    leaf.setViewState({ type: 'grid-view', active: true });
                    // 設定資料來源
                    if (leaf.view instanceof GridView) {
                        leaf.view.setSource('folder', '/');
                    }
                    // 確保視圖是活躍的
                    workspace.revealLeaf(leaf);
                });
        });
        menu.addSeparator();

        // 建立隨機筆記、最近筆記、全部筆記是否包含圖片和影片的設定按鈕
        if ((this.sourceMode === 'all-files' || this.sourceMode === 'recent-files' || this.sourceMode === 'random-note') && 
            this.plugin.settings.showMediaFiles && this.searchQuery === '') {
            menu.addItem((item) => {
                item.setTitle(t('random_note_notes_only'))
                    .setIcon('file-text')
                    .setChecked(!this.randomNoteIncludeMedia)
                    .onClick(() => {
                        this.randomNoteIncludeMedia = false;
                        this.render();
                    });
            });
            menu.addItem((item) => {
                item.setTitle(t('random_note_include_media_files'))
                    .setIcon('file-image')
                    .setChecked(this.randomNoteIncludeMedia)
                    .onClick(() => {
                        this.randomNoteIncludeMedia = true;
                        this.render();
                    });
            });
            menu.addSeparator();
        }
        // 直向卡片切換
        menu.addItem((item) => {
            item.setTitle(t('vertical_card'))
                .setIcon('layout')
                .setChecked(this.baseCardLayout === 'vertical')
                .onClick(() => {
                    this.baseCardLayout = this.baseCardLayout === 'vertical' ? 'horizontal' : 'vertical';
                    this.cardLayout = this.baseCardLayout;
                    this.app.workspace.requestSaveLayout();
                    this.render();
                });
        });
        // 最小化模式選項
        menu.addItem((item) => {
            item
                .setTitle(t('min_mode'))
                .setIcon('minimize-2')
                .setChecked(this.minMode)
                .onClick(() => {
                    this.minMode = !this.minMode;
                    this.app.workspace.requestSaveLayout();
                    this.render();
                });
        });
        // 顯示日期分隔器
        if (this.plugin.settings.dateDividerMode !== 'none') {
            menu.addItem((item) => {
                item
                    .setTitle(t('show_date_dividers'))
                    .setIcon('calendar')
                    .setChecked(this.showDateDividers)
                    .onClick(() => {
                        this.showDateDividers = !this.showDateDividers;
                        this.app.workspace.requestSaveLayout();
                        this.render();
                    });
            });
        }
        // 顯示筆記標籤
        menu.addItem((item) => {
            item
                .setTitle(t('show_note_tags'))
                .setIcon('tag')
                .setChecked(this.showNoteTags)
                .onClick(() => {
                    this.showNoteTags = !this.showNoteTags;
                    this.app.workspace.requestSaveLayout();
                    this.render();
                });
        });
        // 顯示忽略資料夾選項
        menu.addItem((item) => {
            item
                .setTitle(t('show_ignored_folders'))
                .setIcon('folder-open-dot')
                .setChecked(this.showIgnoredFolders)
                .onClick(() => {
                    this.showIgnoredFolders = !this.showIgnoredFolders;
                    this.app.workspace.requestSaveLayout();
                    this.render();
                });
        });
        menu.addSeparator();
        menu.addItem((item) => {
            item
                .setTitle(t('open_settings'))
                .setIcon('settings')
                .onClick(() => {
                    // 打開插件設定頁面
                    (this.app as any).setting.open();
                    (this.app as any).setting.openTabById(this.plugin.manifest.id);
                });
        });
        
        if (this.searchQuery === '') {
            const moreOptionsButton = headerButtonsDiv.createEl('button', { attr: { 'aria-label': t('more_options') } });
            setIcon(moreOptionsButton, 'ellipsis-vertical');
            moreOptionsButton.addEventListener('click', (event) => {
                menu.showAtMouseEvent(event);
            });
        } 

        headerButtonsDiv.addEventListener('contextmenu', (event) => {
            if (event.target === headerButtonsDiv) {
                event.preventDefault();
                menu.showAtMouseEvent(event);
            }
        });
        
        // 創建模式名稱和排序按鈕的容器
        const modeHeaderContainer = this.containerEl.createDiv('ge-mode-header-container');
        
        // 左側：模式名稱
        const modenameContainer = modeHeaderContainer.createDiv('ge-modename-content');
        
        // 右側：排序按鈕
        const rightActions = modeHeaderContainer.createDiv('ge-right-actions');
        
        // 添加排序按鈕
        if (this.sourceMode !== 'bookmarks' && 
            this.sourceMode !== 'recent-files' && 
            this.sourceMode !== 'random-note') {
            const sortButton = rightActions.createEl('a', { 
                cls: 'ge-sort-button',
                attr: { 
                    'aria-label': t('sorting'),
                    'href': '#'
                }
            });
            setIcon(sortButton, 'arrow-up-narrow-wide');

            sortButton.addEventListener('click', (evt) => {
                evt.preventDefault();
                evt.stopPropagation();
                const menu = new Menu();
                const sortOptions = [
                    { value: 'name-asc', label: t('sort_name_asc'), icon: 'a-arrow-up' },
                    { value: 'name-desc', label: t('sort_name_desc'), icon: 'a-arrow-down' },
                    { value: 'mtime-desc', label: t('sort_mtime_desc'), icon: 'clock' },
                    { value: 'mtime-asc', label: t('sort_mtime_asc'), icon: 'clock' },
                    { value: 'ctime-desc', label: t('sort_ctime_desc'), icon: 'calendar' },
                    { value: 'ctime-asc', label: t('sort_ctime_asc'), icon: 'calendar' },
                    { value: 'random', label: t('sort_random'), icon: 'dice' },
                ];

                sortOptions.forEach(option => {
                    menu.addItem((item) => {
                        item
                            .setTitle(option.label)
                            .setIcon(option.icon)
                            .setChecked((this.folderSortType || this.sortType) === option.value)
                            .onClick(() => {
                                this.sortType = option.value;
                                this.folderSortType = '';
                                this.app.workspace.requestSaveLayout();
                                this.render();
                            });
                    });
                });
                menu.showAtMouseEvent(evt);
            });
        }

        // 為區域添加點擊事件，點擊後網格容器捲動到最頂部
        modenameContainer.addEventListener('click', (event: MouseEvent) => {
            // 只有當點擊的是頂部按鈕區域本身（而不是其中的按鈕）時才觸發捲動
            if (event.target === modenameContainer) {
                event.preventDefault();
                // 取得網格容器
                const gridContainer = this.containerEl.querySelector('.ge-grid-container');
                if (gridContainer) {
                    gridContainer.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                }
            }
        });

        // 顯示目前資料夾及完整路徑
        if (this.sourceMode === 'folder' && 
            (this.searchQuery === '' || (this.searchQuery && !this.searchAllFiles)) && 
            this.sourcePath !== '/') {
            const pathParts = this.sourcePath.split('/').filter(part => part.trim() !== '');

            // 建立路徑項目的資料結構
            interface PathItem {
                name: string;
                path: string;
                isLast: boolean;
            }
            
            const paths: PathItem[] = [];
            let pathAccumulator = '';
            
            // 添加根目錄
            paths.push({
                name: t('root'),
                path: '/',
                isLast: pathParts.length === 0
            });
            
            // 建立所有路徑
            pathParts.forEach((part, index) => {
                pathAccumulator = pathAccumulator ? `${pathAccumulator}/${part}` : part;
                paths.push({
                    name: part,
                    path: pathAccumulator,
                    isLast: index === pathParts.length - 1
                });
            });

            // 創建一個容器來測量寬度
            const pathContainer = modenameContainer.createDiv({cls: 'ge-path-container'});
            const customFolderIcon = this.plugin.settings.customFolderIcon;

            // 計算可用寬度
            const pathElements: HTMLElement[] = [];

            // 建立所有路徑元素
            paths.forEach((path, index) => {
                const isLast = index === paths.length - 1;
                let pathEl;
                
                if (isLast) {
                    // 當前資料夾使用 span 元素
                    pathEl = modenameContainer.createEl('a', {
                        text: `${customFolderIcon} ${path.name}`.trim(),
                        cls: 'ge-current-folder'
                    });
                } else {
                    // 上層資料夾使用 a 元素（可點擊）
                    pathEl = modenameContainer.createEl('a', {
                        text: path.name,
                        cls: 'ge-parent-folder-link'
                    });
                }
                
                setTooltip(pathEl, path.name);
                pathElements.push(pathEl);
            });

            // 添加路徑元素
            for (let i = 0; i < pathElements.length; i++) {
                const el = pathElements[i];
                pathContainer.appendChild(el);
                
                // 為路徑元素添加點擊事件
                if (el.className === 'ge-parent-folder-link') {
                    const pathIndex = i; // 直接使用索引，因為不再有分隔符
                    if (pathIndex < paths.length) {
                        const path = paths[pathIndex];
                        el.addEventListener('click', (event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            this.setSource('folder', path.path, true);
                            this.clearSelection();
                        });
                        
                        // 為路徑元素添加右鍵選單，顯示路徑層級和同層級目錄
                        el.addEventListener('contextmenu', async (event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            
                            const menu = new Menu();
                            
                            // 1. 添加當前點擊的目錄
                            menu.addItem((item) => {
                                item.setTitle(path.name)
                                    .setIcon('folder')
                                    .onClick(() => {
                                        this.setSource('folder', path.path, true);
                                        this.clearSelection();
                                    });
                            });
                            
                            // 2. 獲取並添加當前目錄下的所有子目錄
                            const currentFolder = this.app.vault.getAbstractFileByPath(path.path);
                            if (currentFolder && currentFolder instanceof TFolder) {
                                const subFolders = currentFolder.children
                                    .filter(child => {
                                        // 如果不是資料夾，則不顯示
                                        if (!(child instanceof TFolder)) return false;
                                        
                                        // 使用 isFolderIgnored 函數檢查是否應該忽略此資料夾
                                        return !isFolderIgnored(
                                            child, 
                                            this.plugin.settings.ignoredFolders, 
                                            this.plugin.settings.ignoredFolderPatterns, 
                                            this.showIgnoredFolders
                                        );
                                    })
                                    .sort((a, b) => a.name.localeCompare(b.name));
                                
                                if (subFolders.length > 0) {
                                    menu.addSeparator();
                                    menu.addItem((item) => 
                                        item.setTitle(t('sub_folders'))
                                            .setIcon('folder-symlink')
                                            .setDisabled(true)
                                    );
                                    
                                    subFolders.forEach(folder => {
                                        menu.addItem((item) => {
                                            item.setTitle(folder.name)
                                                .setIcon('folder')
                                                .onClick(() => {
                                                    this.setSource('folder', folder.path, true);
                                                    this.clearSelection();
                                                });
                                        });
                                    });
                                }
                            }
                            
                            // 3. 添加上層路徑
                            if (pathIndex > 0) {
                                menu.addSeparator();
                                menu.addItem((item) => 
                                    item.setTitle(t('parent_folders'))
                                        .setIcon('arrow-up')
                                        .setDisabled(true)
                                );
                                
                                for (let i = pathIndex - 1; i >= 0; i--) {
                                    const p = paths[i];
                                    menu.addItem((item) => {
                                        item.setTitle(p.name)
                                            .setIcon(p.path === '/' ? 'folder-root' : 'folder')
                                            .onClick(() => {
                                                this.setSource('folder', p.path, true);
                                                this.clearSelection();
                                            });
                                    });
                                }
                            }
                            
                            menu.showAtMouseEvent(event);
                        });
                        
                        // 為最後一個路徑以外的路徑添加拖曳功能
                        if (!path.isLast && Platform.isDesktop) {
                            // 為路徑元素添加拖曳目標功能
                            el.addEventListener('dragover', (event) => {
                                event.preventDefault();
                                event.dataTransfer!.dropEffect = 'move';
                                el.addClass('ge-dragover');
                            });

                            el.addEventListener('dragleave', () => {
                                el.removeClass('ge-dragover');
                            });

                            el.addEventListener('drop', async (event) => {
                                event.preventDefault();
                                el.removeClass('ge-dragover');

                                if (!path.path) return;

                                const folder = this.app.vault.getAbstractFileByPath(path.path);
                                if (!(folder instanceof TFolder)) return;

                                const filesData = event.dataTransfer?.getData('application/obsidian-grid-explorer-files');
                                if (filesData) {
                                    try {
                                        const filePaths = JSON.parse(filesData);
                                        for (const filePath of filePaths) {
                                            const file = this.app.vault.getAbstractFileByPath(filePath);
                                            if (file instanceof TFile) {
                                                const newPath = normalizePath(`${path.path}/${file.name}`);
                                                await this.app.fileManager.renameFile(file, newPath);
                                            }
                                        }
                                    } catch (error) {
                                        console.error('An error occurred while moving multiple files to folder:', error);
                                    }
                                    return;
                                }

                                const filePath = event.dataTransfer?.getData('text/plain');
                                if (!filePath) return;

                                const cleanedFilePath = filePath.replace(/!?\[\[(.*?)\]\]/, '$1');
                                const file = this.app.vault.getAbstractFileByPath(cleanedFilePath);

                                if (file instanceof TFile) {
                                    try {
                                        const newPath = normalizePath(`${path.path}/${file.name}`);
                                        await this.app.fileManager.renameFile(file, newPath);
                                        this.render();
                                    } catch (error) {
                                        console.error('An error occurred while moving the file to folder:', error);
                                    }
                                }
                            });
                        }
                    }
                }

                if (el.className === 'ge-current-folder') {
                    // 將選單邏輯抽出，以同時支援 click 與 contextmenu
                    const showFolderMenu = (event: MouseEvent) => {
                        event.preventDefault();
                        event.stopPropagation();

                        const folder = this.app.vault.getAbstractFileByPath(this.sourcePath);
                        const folderName = this.sourcePath.split('/').pop() || '';
                        const notePath = `${this.sourcePath}/${folderName}.md`;
                        const noteFile = this.app.vault.getAbstractFileByPath(notePath);
                        const menu = new Menu();

                        if (noteFile instanceof TFile) {
                            // 打開資料夾筆記選項
                            menu.addItem((item) => {
                                item
                                    .setTitle(t('open_folder_note'))
                                    .setIcon('panel-left-open')
                                    .onClick(() => {
                                        this.app.workspace.getLeaf().openFile(noteFile);
                                    });
                            });
                            // 編輯資料夾筆記設定選項
                            menu.addItem((item) => {
                                item
                                    .setTitle(t('edit_folder_note_settings'))
                                    .setIcon('settings-2')
                                    .onClick(() => {
                                        if (folder instanceof TFolder) {
                                            showFolderNoteSettingsModal(this.app, this.plugin, folder, this);
                                        }
                                    });
                            });
                            // 刪除資料夾筆記選項
                            menu.addItem((item) => {
                                item
                                    .setTitle(t('delete_folder_note'))
                                    .setIcon('folder-x')
                                    .onClick(() => {
                                        this.app.fileManager.trashFile(noteFile as TFile);
                                    });
                            });
                        } else {
                            // 建立 Folder note
                            menu.addItem((item) => {
                                item
                                    .setTitle(t('create_folder_note'))
                                    .setIcon('file-cog')
                                    .onClick(() => {
                                        if (folder instanceof TFolder) {
                                            showFolderNoteSettingsModal(this.app, this.plugin, folder, this);
                                        }
                                    });
                            });
                        }
                        menu.showAtMouseEvent(event);
                    };

                    // 左鍵與右鍵都呼叫相同的選單
                    el.addEventListener('click', showFolderMenu);
                    el.addEventListener('contextmenu', showFolderMenu);
                }
            }
        } else if (!(this.searchQuery !== '' && this.searchAllFiles)) {
            // 顯示目前模式名稱
            
            let modeName = '';
            let modeIcon = '';

            // 根據目前模式設定對應的圖示和名稱
            switch (this.sourceMode) {
                case 'bookmarks':
                    modeIcon = '📑';
                    modeName = t('bookmarks_mode');
                    break;
                case 'search':
                    modeIcon = '🔍';
                    modeName = t('search_results');
                    const searchLeaf = (this.app as any).workspace.getLeavesOfType('search')[0];
                    if (searchLeaf) {
                        const searchView: any = searchLeaf.view;
                        const searchInputEl: HTMLInputElement | null = searchView.searchComponent ? searchView.searchComponent.inputEl : null;
                        const currentQuery = searchInputEl?.value.trim();
                        if (currentQuery && currentQuery.length > 0) {
                            modeName += `: ${currentQuery}`;
                        } else if (this.searchQuery) {
                            modeName += `: ${this.searchQuery}`;
                        }
                    }
                    break;
                case 'backlinks':
                    modeIcon = '🔗';
                    modeName = t('backlinks_mode');
                    const activeFile = this.app.workspace.getActiveFile();
                    if (activeFile) {
                        modeName += `: ${activeFile.basename}`;
                    }
                    break;
                case 'outgoinglinks':
                    modeIcon = '🔗';
                    modeName = t('outgoinglinks_mode');
                    const currentFile = this.app.workspace.getActiveFile();
                    if (currentFile) {
                        modeName += `: ${currentFile.basename}`;
                    }
                    break;
                case 'recent-files':
                    modeIcon = '📅';
                    modeName = t('recent_files_mode');
                    break;
                case 'all-files':
                    modeIcon = '📔';
                    modeName = t('all_files_mode');
                    break;
                case 'random-note':
                    modeIcon = '🎲';
                    modeName = t('random_note_mode');
                    break;
                case 'tasks':
                    modeIcon = '☑️';
                    modeName = t('tasks_mode');
                    break;
                default:
                    if (this.sourceMode.startsWith('custom-')) {
                        const mode = this.plugin.settings.customModes.find(m => m.internalName === this.sourceMode);
                        modeIcon = mode ? mode.icon : '🧩';
                        modeName = mode ? mode.displayName : t('custom_mode');
                    } else { // folder mode
                        modeIcon = '📁';
                        if (this.sourcePath && this.sourcePath !== '/') {
                            modeName = this.sourcePath.split('/').pop() || this.sourcePath;
                        } else {
                            modeName = t('root');
                        }
                    }
            }

            // 顯示模式名稱 (若為自訂模式則提供點擊選單以快速切換)
            let modeTitleEl: HTMLElement;
            if (this.sourceMode.startsWith('custom-')) {
                // 使用可點擊的 <a> 元素
                modeTitleEl = modenameContainer.createEl('a', {
                    text: `${modeIcon} ${modeName}`.trim(),
                    cls: 'ge-mode-title'
                });

                // 點擊時顯示所有自訂模式選單
                modeTitleEl.addEventListener('click', (evt) => {
                    const menu = new Menu();
                    this.plugin.settings.customModes
                        .filter(m => m.enabled ?? true) // 僅顯示啟用的自訂模式
                        .forEach((m) => {
                            menu.addItem(item => {
                                item.setTitle(`${m.icon || '🧩'} ${m.displayName}`)
                                    .setChecked(m.internalName === this.sourceMode)
                                    .onClick(() => {
                                        // 切換至選取的自訂模式並重新渲染
                                        this.setSource(m.internalName, '', true);
                                    });
                            });
                        });
                    menu.showAtMouseEvent(evt);
                });
            } else {
                // 其他模式維持原本的 span
                modeTitleEl = modenameContainer.createEl('span', {
                    text: `${modeIcon} ${modeName}`.trim(),
                    cls: 'ge-mode-title'
                });
            }

            switch (this.sourceMode) {
                case 'tasks':
                    const taskFilterSpan = modenameContainer.createEl('a', { text: t(`${this.taskFilter}`), cls: 'ge-sub-option' });
                    taskFilterSpan.addEventListener('click', (evt) => {
                        const menu = new Menu();
                        menu.addItem((item) => {
                            item.setTitle(t('uncompleted'))
                                .setChecked(this.taskFilter === 'uncompleted')
                                .setIcon('square')
                                .onClick(() => {
                                    this.taskFilter = 'uncompleted';
                                    this.render();
                                });
                        });
                        menu.addItem((item) => {
                            item.setTitle(t('completed'))
                                .setChecked(this.taskFilter === 'completed')
                                .setIcon('square-check-big')
                                .onClick(() => {
                                    this.taskFilter = 'completed';
                                    this.render();
                                });
                        });
                        menu.addItem((item) => {
                            item.setTitle(t('all'))
                                .setChecked(this.taskFilter === 'all')
                                .setIcon('square-asterisk')
                                .onClick(() => {
                                    this.taskFilter = 'all';
                                    this.render();
                                });
                        });
                        menu.addSeparator();
                        menu.showAtMouseEvent(evt);
                    });
                    break;
                default:
                    if (this.sourceMode.startsWith('custom-')) {
                        // 把 modenameContainer 加上所有自訂模式選項的選單
                        
                        // 取得當前自訂模式
                        const mode = this.plugin.settings.customModes.find(m => m.internalName === this.sourceMode);
                        if (mode) {
                            const hasOptions = mode.options && mode.options.length > 0;
                            
                            if (hasOptions && mode.options) {
                                if (this.customOptionIndex >= mode.options.length || this.customOptionIndex < -1) {
                                    this.customOptionIndex = -1;
                                }

                                let subName: string | undefined;
                                if (this.customOptionIndex === -1) {
                                    subName = (mode as any).name?.trim() || t('default');
                                } else if (this.customOptionIndex >= 0 && this.customOptionIndex < mode.options.length) {
                                    const opt = mode.options[this.customOptionIndex];
                                    subName = opt.name?.trim() || `${t('option')} ${this.customOptionIndex + 1}`;
                                }

                                const subSpan = modenameContainer.createEl('a', { text: subName ?? '-', cls: 'ge-sub-option' });
                                subSpan.addEventListener('click', (evt) => {
                                    const menu = new Menu();
                                    // 預設選項
                                    const defaultName = (mode as any).name?.trim() || t('default');
                                    menu.addItem(item => {
                                        item.setTitle(defaultName)
                                            .setIcon('puzzle')
                                            .setChecked(this.customOptionIndex === -1)
                                            .onClick(() => {
                                                this.customOptionIndex = -1;
                                                this.render(true);
                                            });
                                    });
                                    mode.options!.forEach((opt, idx) => {
                                        menu.addItem(item => {
                                            item.setTitle(opt.name?.trim() || t('option') + ' ' + (idx + 1))
                                                .setIcon('puzzle')
                                                .setChecked(idx === this.customOptionIndex)
                                                .onClick(() => {
                                                    this.customOptionIndex = idx;
                                                    this.render(true);
                                                });
                                        });
                                    });

                                    // 設定選項
                                    menu.addSeparator();
                                    menu.addItem(item => {
                                        item.setTitle(t('edit'))
                                            .setIcon('settings')
                                            .onClick(() => {
                                                const modeIndex = this.plugin.settings.customModes.findIndex(m => m.internalName === mode.internalName);
                                                if (modeIndex === -1) return;
                                                new CustomModeModal(this.app, this.plugin, this.plugin.settings.customModes[modeIndex], (result) => {
                                                    this.plugin.settings.customModes[modeIndex] = result;
                                                    this.plugin.saveSettings();
                                                    this.render(true);
                                                }).open();
                                            });
                                    });

                                    menu.showAtMouseEvent(evt);
                                });
                            } else {
                                // 只有預設選項時，只顯示齒輪圖示
                                const gearIcon = modenameContainer.createEl('a', { cls: 'ge-sub-option' });
                                setIcon(gearIcon, 'settings');
                                gearIcon.addEventListener('click', () => {
                                    const modeIndex = this.plugin.settings.customModes.findIndex(m => m.internalName === mode.internalName);
                                    if (modeIndex === -1) return;
                                    new CustomModeModal(this.app, this.plugin, this.plugin.settings.customModes[modeIndex], (result) => {
                                        this.plugin.settings.customModes[modeIndex] = result;
                                        this.plugin.saveSettings();
                                        this.render(true);
                                    }).open();
                                });
                            }
                        }
                    }
                    break;
            }
        } else if (this.searchQuery !== '' && this.searchAllFiles) {
            // 顯示全域搜尋名稱
            modenameContainer.createEl('span', { 
                text: `🔍 ${t('global_search')}`,
                cls: 'ge-mode-title'
            });
        }

        // 創建內容區域
        const contentEl = this.containerEl.createDiv('view-content');

        // 取得置頂清單
        if (this.sourceMode === 'folder' && this.sourcePath !== '/') {
            this.pinnedList = [];
            const folderPath = this.sourcePath;
            if (!folderPath || folderPath === '/') return;
            const folderName = folderPath.split('/').pop() || '';
            const notePath = `${folderPath}/${folderName}.md`;
            const noteFile = this.app.vault.getAbstractFileByPath(notePath);
            if (noteFile instanceof TFile) {
                const metadata = this.app.metadataCache.getFileCache(noteFile)?.frontmatter;
                if (metadata) {
                    if (Array.isArray(metadata['pinned'])) {
                        if (this.plugin.settings.folderNoteDisplaySettings === 'pinned') {
                            // 先過濾掉所有重複的資料夾筆記
                            this.pinnedList = metadata['pinned'].filter((name: string) => name !== `${folderName}.md`);
                            // 將資料夾筆記添加到最前面
                            this.pinnedList.unshift(`${folderName}.md`);
                        } else {
                            this.pinnedList = metadata['pinned'];
                        }
                    } else if (this.plugin.settings.folderNoteDisplaySettings === 'pinned') {
                        // 如果沒有置頂清單，則建立一個僅包含資料夾筆記的清單
                        this.pinnedList = [`${folderName}.md`];
                    }
                }
            }
        };

        // 重新渲染內容
        await this.grid_render();
        (this.leaf as any).updateHeader();

        // 恢復捲動位置
        if (scrollContainer && !resetScroll) {
            contentEl.scrollTop = scrollTop;
        }

        // 如果有之前選中的檔案路徑，嘗試恢復選中狀態
        if (selectedFilePath && this.hasKeyboardFocus) {
            const newIndex = this.gridItems.findIndex(item => item.dataset.filePath === selectedFilePath);
            if (newIndex >= 0) {
                this.selectItem(newIndex);
            }
        }
    }

    async grid_render() {
        const container = this.containerEl.querySelector('.view-content') as HTMLElement;
        container.empty();
        container.addClass('ge-grid-container');

        // 隱藏頂部元素
        const displayValue = this.hideHeaderElements ? 'none' : 'flex';
        const headerButtons = this.containerEl.querySelector('.ge-header-buttons') as HTMLElement;
        const modeHeaderContainer = this.containerEl.querySelector('.ge-mode-header-container') as HTMLElement;
        
        if (headerButtons) headerButtons.style.display = displayValue;
        if (modeHeaderContainer) modeHeaderContainer.style.display = displayValue;

        // 根據設定決定是否啟用卡片模式
        if (this.cardLayout === 'vertical') {
            container.addClass('ge-vertical-card');
        } else {
            container.removeClass('ge-vertical-card');
        }

        // 添加點擊空白處取消選中的事件處理器
        container.addEventListener('click', (event) => {
            // 只有當點擊的是容器本身，而不是其子元素時才清除選中
            if (event.target === container) {
                this.clearSelection();
                this.hasKeyboardFocus = false;
            }
        });

        // 設定網格項目寬度和高度等設定
        const settings = this.plugin.settings;
        const gridItemWidth = this.cardLayout === 'vertical' ? settings.verticalGridItemWidth : settings.gridItemWidth;
        const gridItemHeight = this.cardLayout === 'vertical' ? settings.verticalGridItemHeight : settings.gridItemHeight;
        const imageAreaWidth = settings.imageAreaWidth;
        const imageAreaHeight = this.cardLayout === 'vertical' ? settings.verticalImageAreaHeight : settings.imageAreaHeight;

        container.style.setProperty('--grid-item-width', gridItemWidth + 'px');
        if (gridItemHeight === 0 || this.minMode) {
            container.style.setProperty('--grid-item-height', '100%');
        } else {
            container.style.setProperty('--grid-item-height', gridItemHeight + 'px');
        }
        container.style.setProperty('--image-area-width', imageAreaWidth + 'px');
        container.style.setProperty('--image-area-height', imageAreaHeight + 'px');
        container.style.setProperty('--title-font-size', settings.titleFontSize + 'em');

        // 依圖片位置設定切換樣式類別
        if (this.cardLayout === 'vertical') {
            if (settings.verticalCardImagePosition === 'top') {
                container.addClass('ge-image-top');
                container.removeClass('ge-image-bottom');
            } else {
                container.addClass('ge-image-bottom');
                container.removeClass('ge-image-top');
            }
        }

        // 定義所有可能的模式（不包括 custom-）
        const modeClasses = [
            'bookmarks',
            'search',
            'backlinks',
            'outgoinglinks',
            'all-files',
            'recent-files',
            'random-note',
            'tasks',
            'folder'
        ];

        // 先移除所有模式相關的 class
        this.containerEl.removeClass('ge-mode-custom');  // 特別處理 custom 類別
        modeClasses.forEach(mode => {
            this.containerEl.removeClass(`ge-mode-${mode}`);
        });

        // 添加當前模式的 class
        if (this.sourceMode.startsWith('custom-')) {
            this.containerEl.addClass('ge-mode-custom');
        } else if (modeClasses.includes(this.sourceMode)) {
            this.containerEl.addClass(`ge-mode-${this.sourceMode}`);
        }
        
        // 重置網格項目數組
        this.gridItems = [];

        // 如果是書籤模式且書籤插件未啟用，顯示提示
        if (this.sourceMode === 'bookmarks' && !(this.app as any).internalPlugins.plugins.bookmarks?.enabled) {
            new Notice(t('bookmarks_plugin_disabled'));
            return;
        }

        // 如果是反向連結模式，但沒有活動中的檔案
        if (this.sourceMode === 'backlinks' && !this.app.workspace.getActiveFile()) {
            const noFilesDiv = container.createDiv('ge-no-files');
            noFilesDiv.setText(t('no_backlinks'));
            if (this.plugin.statusBarItem) {
                this.plugin.statusBarItem.setText('');
            }
            return;
        }

        // 如果是資料夾模式，先顯示所有子資料夾
        if (this.sourceMode === 'folder' && this.searchQuery === '') {
            const currentFolder = this.app.vault.getAbstractFileByPath(this.sourcePath || '/');
            if (currentFolder instanceof TFolder) {

                // 為網格容器添加拖曳目標功能（當前資料夾）
                if(Platform.isDesktop) {
                    container.addEventListener('dragover', (event) => {
                        // 如果拖曳目標是資料夾項目，則不處理
                        if ((event.target as HTMLElement).closest('.ge-folder-item')) {
                            return;
                        }
                        // 防止預設行為以允許放置
                        event.preventDefault();
                        // 設定拖曳效果為移動
                        (event as any).dataTransfer!.dropEffect = 'move';
                        // 顯示可放置的視覺提示
                        container.addClass('ge-dragover');
                    }, true); // 使用捕獲階段
                    
                    container.addEventListener('dragleave', (event) => {
                        // 如果移入的是子元素，則不處理
                        if (container.contains(event.relatedTarget as Node)) {
                            return;
                        }
                        // 移除視覺提示
                        container.removeClass('ge-dragover');
                    });
                    
                    container.addEventListener('drop', async (event) => {
                        // 如果拖曳目標是資料夾項目，則不處理
                        if ((event.target as HTMLElement).closest('.ge-folder-item')) {
                            return;
                        }
                        
                        // 防止預設行為
                        event.preventDefault();
                        // 移除視覺提示
                        container.removeClass('ge-dragover');
                        
                        // 獲取拖曳的檔案路徑列表
                        const filesDataString = (event as any).dataTransfer?.getData('application/obsidian-grid-explorer-files');
                        if (filesDataString) {
                            try {
                                // 解析檔案路徑列表
                                const filePaths = JSON.parse(filesDataString);
                                
                                // 獲取當前資料夾路徑
                                const folderPath = currentFolder.path;
                                if (!folderPath) return;
                                
                                // 移動檔案
                                for (const path of filePaths) {
                                    const file = this.app.vault.getAbstractFileByPath(path);
                                    if (file instanceof TFile) {
                                        try {
                                            // 計算新的檔案路徑
                                            const newPath = normalizePath(`${folderPath}/${file.name}`);
                                            // 如果來源路徑和目標路徑相同，則跳過
                                            if (path === newPath) {
                                                continue;
                                            }
                                            // 移動檔案
                                            await this.app.fileManager.renameFile(file, newPath);
                                        } catch (error) {
                                            console.error(`An error occurred while moving the file ${file.path}:`, error);
                                        }
                                    }
                                }
                                return;
                            } catch (error) {
                                console.error('Error parsing dragged files data:', error);
                            }
                        }

                        // 如果沒有檔案路徑列表，則使用檔案路徑
                        const filePath = (event as any).dataTransfer?.getData('text/plain');
                        if (!filePath) return;
                        
                        const cleanedFilePath = filePath.replace(/!?\[\[(.*?)\]\]/, '$1');
                        
                        // 獲取檔案和資料夾物件
                        const file = this.app.vault.getAbstractFileByPath(cleanedFilePath);
                        
                        if (file instanceof TFile) {
                            try {
                                // 計算新的檔案路徑
                                const newPath = normalizePath(`${currentFolder.path}/${file.name}`);
                                // 如果來源路徑和目標路徑相同，則不執行移動
                                if (file.path !== newPath) {
                                    // 移動檔案
                                    await this.app.fileManager.renameFile(file, newPath);
                                }
                            } catch (error) {
                                console.error('An error occurred while moving the file:', error);
                            }
                        }
                    });
                }

                // 顯示子資料夾
                const subfolders = currentFolder.children
                    .filter(child => {
                        // 如果不是資料夾，則不顯示
                        if (!(child instanceof TFolder)) return false;
                        
                        // 使用 isFolderIgnored 函數檢查是否應該忽略此資料夾
                        return !isFolderIgnored(
                            child, 
                            this.plugin.settings.ignoredFolders, 
                            this.plugin.settings.ignoredFolderPatterns, 
                            this.showIgnoredFolders
                        );
                    })
                    .sort((a, b) => a.name.localeCompare(b.name));
                for (const folder of subfolders) {
                    const folderEl = container.createDiv('ge-grid-item ge-folder-item');
                    this.gridItems.push(folderEl); // 添加到網格項目數組
                    
                    // 設置資料夾路徑屬性，用於拖曳功能
                    folderEl.dataset.folderPath = folder.path;
                    
                    const contentArea = folderEl.createDiv('ge-content-area');
                    const titleContainer = contentArea.createDiv('ge-title-container');
                    const customFolderIcon = this.plugin.settings.customFolderIcon;
                    titleContainer.createEl('span', { cls: 'ge-title', text: `${customFolderIcon} ${folder.name}`.trim() });
                    setTooltip(folderEl, folder.name,{ placement: this.cardLayout === 'vertical' ? 'bottom' : 'right' });
                    
                    // 檢查同名筆記是否存在
                    const notePath = `${folder.path}/${folder.name}.md`;
                    const noteFile = this.app.vault.getAbstractFileByPath(notePath);
                    
                    if (noteFile instanceof TFile) {
                        // 使用 span 代替 button，只顯示圖示
                        const noteIcon = titleContainer.createEl('span', {
                            cls: 'ge-foldernote-button'
                        });
                        setIcon(noteIcon, 'panel-left-open');
                        
                        // 點擊圖示時開啟同名筆記
                        noteIcon.addEventListener('click', (e) => {
                            e.stopPropagation(); // 防止觸發資料夾的點擊事件
                            this.app.workspace.getLeaf().openFile(noteFile);
                        });

                        // 根據同名筆記設置背景色
                        const metadata = this.app.metadataCache.getFileCache(noteFile)?.frontmatter;
                        const colorValue = metadata?.color;
                        if (colorValue) {
                            // 依顏色名稱加入對應的樣式類別
                            folderEl.addClass(`ge-folder-color-${colorValue}`);
                        }
                        const iconValue = metadata?.icon;
                        if (iconValue) {
                            // 修改原本的title文字
                            const title = folderEl.querySelector('.ge-title');
                            if (title) {
                                title.textContent = `${iconValue} ${folder.name}`;
                            }
                        }
                        
                    }
                    
                    // 點擊時進入子資料夾
                    folderEl.addEventListener('click', (event) => {
                        if (event.ctrlKey || event.metaKey) {
                            event.preventDefault();
                            event.stopPropagation();
                            this.openFolderInNewView(folder.path);
                        } else {
                            this.setSource('folder', folder.path, true);
                            this.clearSelection();
                        }
                    });

                    // 添加右鍵選單
                    folderEl.addEventListener('contextmenu', (event) => {
                        event.preventDefault();
                        const menu = new Menu();
                        
                        //在新網格視圖開啟
                        menu.addItem((item) => {
                            item
                                .setTitle(t('open_in_new_grid_view'))
                                .setIcon('grid')
                                .onClick(() => {
                                    this.openFolderInNewView(folder.path);
                                });
                        });
                        menu.addSeparator();

                        // 檢查同名筆記是否存在
                        const notePath = `${folder.path}/${folder.name}.md`;
                        let noteFile = this.app.vault.getAbstractFileByPath(notePath);
                        if (noteFile instanceof TFile) {
                            //打開資料夾筆記
                            menu.addItem((item) => {
                                item
                                    .setTitle(t('open_folder_note'))
                                    .setIcon('panel-left-open')
                                    .onClick(() => {
                                        if (noteFile instanceof TFile) {
                                            this.app.workspace.getLeaf().openFile(noteFile);
                                        }
                                    });
                            });
                            //編輯資料夾筆記設定
                            menu.addItem((item) => {
                                item
                                    .setTitle(t('edit_folder_note_settings'))
                                    .setIcon('settings-2')
                                    .onClick(() => {
                                        if (folder instanceof TFolder) {
                                            showFolderNoteSettingsModal(this.app, this.plugin, folder, this);
                                        }
                                    });
                            });
                            //刪除資料夾筆記
                            menu.addItem((item) => {
                                item
                                    .setTitle(t('delete_folder_note'))
                                    .setIcon('folder-x')
                                    .onClick(() => {
                                        this.app.fileManager.trashFile(noteFile as TFile);
                                    });
                            });
                        } else {
                            //建立Folder note
                            menu.addItem((item) => {
                                item
                                    .setTitle(t('create_folder_note'))
                                    .setIcon('file-cog')
                                    .onClick(() => {
                                        if (folder instanceof TFolder) {
                                            showFolderNoteSettingsModal(this.app, this.plugin, folder, this);
                                        }
                                    });
                            });
                        }
                        menu.addSeparator();

                        if (!this.plugin.settings.ignoredFolders.includes(folder.path)) {
                            //加入"忽略此資料夾"選項
                            menu.addItem((item) => {
                                item
                                    .setTitle(t('ignore_folder'))
                                    .setIcon('folder-x')
                                    .onClick(() => {
                                        this.plugin.settings.ignoredFolders.push(folder.path);
                                        this.plugin.saveSettings();
                                    });
                            });
                        } else {
                            //加入"取消忽略此資料夾"選項
                            menu.addItem((item) => {
                                item
                                    .setTitle(t('unignore_folder'))
                                    .setIcon('folder-up')
                                    .onClick(() => {
                                        this.plugin.settings.ignoredFolders = this.plugin.settings.ignoredFolders.filter((path) => path !== folder.path);
                                        this.plugin.saveSettings();
                                    });
                            });
                        }
                        // 搬移資料夾
                        menu.addItem((item) => {
                            item
                                .setTitle(t('move_folder'))
                                .setIcon('folder-cog')
                                .onClick(() => {
                                    if (folder instanceof TFolder) {
                                        new moveFolderSuggestModal(this.plugin, folder, this).open();
                                    }
                                });
                        });
                        // 重新命名資料夾
                        menu.addItem((item) => {
                            item
                                .setTitle(t('rename_folder'))
                                .setIcon('file-cog')
                                .onClick(() => {
                                    if (folder instanceof TFolder) {
                                        showFolderRenameModal(this.app, this.plugin, folder, this);
                                    }
                                });
                        });
                        // 刪除資料夾
                        menu.addItem((item) => {
                            (item as any).setWarning(true);
                            item
                                .setTitle(t('delete_folder'))
                                .setIcon('trash')
                                .onClick(async () => {
                                    if (folder instanceof TFolder) {
                                        await this.app.fileManager.trashFile(folder);
                                        // 重新渲染視圖
                                        setTimeout(() => {
                                            this.render();
                                        }, 100);
                                    }
                                });
                        });
                        menu.showAtMouseEvent(event);
                    });
                }
                
                // 資料夾渲染完插入 break（僅當有資料夾）
                if (subfolders.length > 0) {
                    container.createDiv('ge-break');
                }
            }
        }

        // 為資料夾項目添加拖曳目標功能
        if(Platform.isDesktop) {
            const folderItems = this.containerEl.querySelectorAll('.ge-folder-item');
            folderItems.forEach(folderItem => {
                folderItem.addEventListener('dragover', (event) => {
                    // 防止預設行為以允許放置
                    event.preventDefault();
                    // 設定拖曳效果為移動
                    (event as any).dataTransfer!.dropEffect = 'move';
                    // 顯示可放置的視覺提示
                    folderItem.addClass('ge-dragover');
                });
                
                folderItem.addEventListener('dragleave', () => {
                    // 移除視覺提示
                    folderItem.removeClass('ge-dragover');
                });
                
                folderItem.addEventListener('drop', async (event) => {
                    // 防止預設行為
                    event.preventDefault();
                    // 移除視覺提示
                    folderItem.removeClass('ge-dragover');
                    
                    // 獲取拖曳的檔案路徑列表
                    const filesDataString = (event as any).dataTransfer?.getData('application/obsidian-grid-explorer-files');
                    if (filesDataString) {
                        try {
                            // 解析檔案路徑列表
                            const filePaths = JSON.parse(filesDataString);
                            
                            // 獲取目標資料夾路徑
                            const folderPath = (folderItem as any).dataset.folderPath;
                            if (!folderPath) return;
                            
                            // 獲取資料夾物件
                            const folder = this.app.vault.getAbstractFileByPath(folderPath);
                            if (!(folder instanceof TFolder)) return;
                            
                            // 移動檔案
                            for (const path of filePaths) {
                                const file = this.app.vault.getAbstractFileByPath(path);
                                if (file instanceof TFile) {
                                    try {
                                        // 計算新的檔案路徑
                                        const newPath = normalizePath(`${folderPath}/${file.name}`);
                                        // 移動檔案
                                        await this.app.fileManager.renameFile(file, newPath);
                                    } catch (error) {
                                        console.error(`An error occurred while moving the file ${file.path}:`, error);
                                    }
                                }
                            }

                            return;

                        } catch (error) {
                            console.error('Error parsing dragged files data:', error);
                        }
                    }

                    // 如果沒有檔案路徑列表，則使用檔案路徑
                    const filePath = (event as any).dataTransfer?.getData('text/plain');
                    if (!filePath) return;
                    
                    const cleanedFilePath = filePath.replace(/!?\[\[(.*?)\]\]/, '$1');
                    
                    // 獲取目標資料夾路徑
                    const folderPath = (folderItem as any).dataset.folderPath;
                    if (!folderPath) return;
                    
                    // 獲取檔案和資料夾物件
                    const file = this.app.vault.getAbstractFileByPath(cleanedFilePath);
                    const folder = this.app.vault.getAbstractFileByPath(folderPath);
                    
                    if (file instanceof TFile && folder instanceof TFolder) {
                        try {
                            // 計算新的檔案路徑
                            const newPath = normalizePath(`${folderPath}/${file.name}`);
                            // 移動檔案
                            await this.app.fileManager.renameFile(file, newPath);

                        } catch (error) {
                            console.error('An error occurred while moving the file:', error);
                        }
                    }
                });
            });
        }
        
        let loadingDiv: HTMLElement | null = null;
        if (this.searchQuery || this.sourceMode === 'tasks') {
            // 顯示搜尋中的提示
            loadingDiv = container.createDiv({ text: t('searching'), cls: 'ge-loading-indicator' });
        }

        let files: TFile[] = [];
        // 使用 Map 來記錄原始順序
        let fileIndexMap = new Map<TFile, number>();
        if (this.searchQuery) {
            // 取得 vault 中所有支援的檔案
            let allFiles: TFile[] = [];
            if (this.searchAllFiles) {
                // 全部檔案
                allFiles = this.app.vault.getFiles().filter(file => 
                    isDocumentFile(file) || (isMediaFile(file) && this.searchMediaFiles)
                );
            } else {
                // 當前位置檔案
                allFiles = await getFiles(this, this.searchMediaFiles);

                if (this.sourceMode === 'bookmarks') {
                    allFiles = allFiles.filter(file => 
                        isDocumentFile(file) || (isMediaFile(file) && this.searchMediaFiles)
                    );
                    // 使用 Map 來記錄原始順序
                    allFiles.forEach((file, index) => {
                        fileIndexMap.set(file, index);
                    });
                } else if (this.sourceMode === 'search') {
                    allFiles = allFiles.filter(file =>
                        isDocumentFile(file) || (isMediaFile(file) && this.searchMediaFiles)
                    );
                } else if (this.sourceMode === 'recent-files') {
                    // 搜尋"最近檔案"的當前位置時，先作忽略檔案和只取前n筆
                    allFiles = ignoredFiles(allFiles, this).slice(0, this.plugin.settings.recentFilesCount);
                } else if (this.sourceMode.startsWith('custom-')) {
                    // 使用 Map 來記錄原始順序
                    allFiles.forEach((file, index) => {
                        fileIndexMap.set(file, index);
                    });
                }
            }

            // 根據搜尋關鍵字進行過濾（不分大小寫）
            const searchTerms = this.searchQuery.toLowerCase().split(/\s+/).filter(term => term.trim() !== '');
            
            // 分離標籤搜尋、一般搜尋和連結搜尋
            const tagTerms: string[] = [];
            const linkTerms: string[] = [];
            const normalTerms: string[] = [];
            
            for (const term of searchTerms) {
                if (term.startsWith('#')) {
                    tagTerms.push(term.substring(1));
                } else if (term.startsWith('[[') && term.endsWith(']]')) {
                    linkTerms.push(term.slice(2, -2)); // 移除 [[ 和 ]]
                } else {
                    normalTerms.push(term);
                }
            }

            // 檢查是否有 Obsidian 連結格式 [[ ]]
            let linkTargetFileSets: Set<string>[] = [];
            const hasLinkSearch = linkTerms.length > 0;
            
            if (hasLinkSearch) {
                for (const linkTarget of linkTerms) {                  
                    // 尋找目標檔案
                    let targetFile = this.app.vault.getAbstractFileByPath(linkTarget + '.md');
                    if (!targetFile) {
                        targetFile = this.app.metadataCache.getFirstLinkpathDest(linkTarget, '');
                    }
                    
                    if (targetFile && 'extension' in targetFile) {
                        // 使用 Obsidian 的 getBacklinksForFile API
                        const backlinks = (this.app.metadataCache as any).getBacklinksForFile(targetFile);
                        
                        const currentLinkFiles = new Set<string>();
                        if (backlinks) {
                            // 收集所有反向連結的檔案路徑
                            for (const [filePath, links] of backlinks.data.entries()) {
                                currentLinkFiles.add(filePath);
                            }
                        }
                        linkTargetFileSets.push(currentLinkFiles);
                    } else {
                        // 如果找不到目標檔案，加入空集合
                        linkTargetFileSets.push(new Set<string>());
                    }
                }
            }
            
            // 使用 Promise.all 來非同步地讀取所有檔案內容，順序可能會跟之前不同
            await Promise.all(
                allFiles.map(async file => {
                    // 檢查連結搜尋條件：檔案必須在所有連結的反向連結中
                    if (hasLinkSearch) {
                        const isInAllLinkTargets = linkTargetFileSets.every(linkSet => linkSet.has(file.path));
                        if (!isInAllLinkTargets) {
                            return; // 如果檔案不在所有連結的反向連結中，直接跳過
                        }
                    }
                    
                    const fileName = file.name.toLowerCase();
                    let matchesNormalTerms = true;
                    let matchesTags = true;
                    
                    // 檢查一般搜尋詞
                    if (normalTerms.length > 0) {
                        // 檢查檔案名稱是否包含所有一般搜尋字串
                        const matchesFileName = normalTerms.every(term => fileName.includes(term));
                        
                        if (!matchesFileName && file.extension === 'md') {
                            // 如果檔名不匹配且是 Markdown 檔案，檢查內容
                            const content = (await this.app.vault.cachedRead(file)).toLowerCase();
                            matchesNormalTerms = normalTerms.every(term => content.includes(term));
                        } else {
                            matchesNormalTerms = matchesFileName;
                        }
                    }
                    
                    // 檢查標籤搜尋詞
                    if (tagTerms.length > 0) {
                        if (file.extension !== 'md') {
                            matchesTags = false; // 非 Markdown 檔案不能匹配標籤
                        } else {
                            const fileCache = this.app.metadataCache.getFileCache(file);
                            matchesTags = false;
                            
                            if (fileCache) {
                                const collectedTags: string[] = [];

                                // 內文標籤
                                if (Array.isArray(fileCache.tags)) {
                                    for (const t of fileCache.tags) {
                                        if (t && t.tag) {
                                            const clean = t.tag.toLowerCase().replace(/^#/, '');
                                            collectedTags.push(...clean.split(/\s+/).filter(st => st.trim() !== ''));
                                        }
                                    }
                                }

                                // frontmatter 標籤
                                if (fileCache.frontmatter && fileCache.frontmatter.tags) {
                                    const fmTags = fileCache.frontmatter.tags;
                                    if (typeof fmTags === 'string') {
                                        collectedTags.push(
                                            ...fmTags.split(/[,\s]+/)
                                                .map(t => t.toLowerCase().replace(/^#/, ''))
                                                .filter(t => t.trim() !== '')
                                        );
                                    } else if (Array.isArray(fmTags)) {
                                        for (const t of fmTags) {
                                            if (typeof t === 'string') {
                                                const clean = t.toLowerCase().replace(/^#/, '');
                                                collectedTags.push(...clean.split(/\s+/).filter(st => st.trim() !== ''));
                                            }
                                        }
                                    }
                                }

                                matchesTags = tagTerms.every(tag => collectedTags.includes(tag));
                            }
                        }
                    }
                    
                    // 只有當所有條件都符合時才加入結果
                    if (matchesNormalTerms && matchesTags) {
                        files.push(file);
                    }
                })
            );
            
            // 排序檔案
            if (this.sourceMode === 'bookmarks') {
                // 保持原始順序
                files.sort((a, b) => {
                    const indexA = fileIndexMap.get(a) ?? Number.MAX_SAFE_INTEGER;
                    const indexB = fileIndexMap.get(b) ?? Number.MAX_SAFE_INTEGER;
                    return indexA - indexB;
                });
            } else if (this.sourceMode === 'recent-files') {
                // 臨時的排序類型
                const sortType = this.sortType;
                this.sortType = 'mtime-desc';
                files = sortFiles(files, this);
                this.sortType = sortType;
            } else if (this.sourceMode === 'random-note') {
                // 臨時的排序類型
                const sortType = this.sortType;
                this.sortType = 'random';
                files = sortFiles(files, this);
                this.sortType = sortType;
            } else if (this.sourceMode.startsWith('custom-')) {
                // 保持原始順序
                files.sort((a, b) => {
                    const indexA = fileIndexMap.get(a) ?? Number.MAX_SAFE_INTEGER;
                    const indexB = fileIndexMap.get(b) ?? Number.MAX_SAFE_INTEGER;
                    return indexA - indexB;
                });
            } else {
                files = sortFiles(files, this);
            }

            // 忽略檔案
            files = ignoredFiles(files, this);
        } else {
            // 無搜尋關鍵字的情況
            files = await getFiles(this, this.randomNoteIncludeMedia);

            // 忽略檔案
            files = ignoredFiles(files, this)

            // 最近檔案模式，只取前n筆
            if (this.sourceMode === 'recent-files') {
                files = files.slice(0, this.plugin.settings.recentFilesCount);
            }

            // 隨機筆記模式，只取前n筆
            if (this.sourceMode === 'random-note') {
                files = files.slice(0, this.plugin.settings.randomNoteCount);
            }
        }

        if (loadingDiv) {
            loadingDiv.remove();
        }

        // 如果沒有檔案，顯示提示訊息
        if (files.length === 0) {
            const noFilesDiv = container.createDiv('ge-no-files');
            if (this.sourceMode !== 'backlinks') {
                noFilesDiv.setText(t('no_files'));
            } else {
                noFilesDiv.setText(t('no_backlinks'));
            }
            if (this.plugin.statusBarItem) {
                this.plugin.statusBarItem.setText('');
            }
            return;
        }

        // 若有置頂清單且目前為資料夾模式，將置頂檔案移到最前面並維持其在清單中的順序
        if (this.pinnedList.length > 0 && this.sourceMode === 'folder') {
            const pinnedFiles = files.filter(f => this.pinnedList.includes(f.name));
            // 依照 pinnedList 順序排序
            pinnedFiles.sort((a, b) => this.pinnedList.indexOf(a.name) - this.pinnedList.indexOf(b.name));
            const otherFiles = files.filter(f => !this.pinnedList.includes(f.name));
            files = [...pinnedFiles, ...otherFiles];
        }
        
        if (this.sourceMode === 'folder' && this.sourcePath !== '/') {
            if (this.plugin.settings.folderNoteDisplaySettings === 'hidden') {
                const currentFolder = this.app.vault.getAbstractFileByPath(this.sourcePath);
                if (currentFolder instanceof TFolder) {
                    const folderName = currentFolder.name;
                    files = files.filter(f => f.name !== `${folderName}.md`);
                }
            }
        }

        // 創建 Intersection Observer
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(async entry => {
                if (entry.isIntersecting) {
                    const fileEl = entry.target as HTMLElement; 
                    const filePath = fileEl.dataset.filePath;
                    if (!filePath) return;

                    const file = this.app.vault.getAbstractFileByPath(filePath);
                    if (!(file instanceof TFile)) return;

                    // 載入預覽內容
                    let imageUrl: string | null = '';
                    const contentArea = fileEl.querySelector('.ge-content-area') as Element;
                    if (!contentArea.hasAttribute('data-loaded')) {
                        // 根據檔案類型處理
                        if (file.extension === 'md') {
                            let summaryLength = this.plugin.settings.summaryLength;
                            if (summaryLength < 50) {
                                summaryLength = 100;
                                this.plugin.settings.summaryLength = 100;
                                this.plugin.saveSettings();
                            }

                            // Markdown 檔案顯示內容預覽
                            const content = await this.app.vault.cachedRead(file);
                            const frontMatterInfo = getFrontMatterInfo(content);
                            let metadata: FrontMatterCache | undefined = undefined;
                            if (frontMatterInfo.exists) {
                                metadata = this.app.metadataCache.getFileCache(file)?.frontmatter;
                            }

                            let pEl: HTMLElement | null = null;
                            if (!this.minMode) {
                                let summaryField = this.plugin.settings.noteSummaryField || 'summary';
                                let summaryValue = metadata?.[summaryField];
                                if (this.sourceMode.startsWith('custom-')) {
                                    // 自訂模式下，使用自訂的 fields 來顯示摘要
                                    const mode = this.plugin.settings.customModes.find(m => m.internalName === this.sourceMode);
                                    if (mode) {
                                        let fields = mode?.fields || '';
                                        // 當有選到子選項 (index >= 0) 而且 options 陣列確實存在
                                        if (this.customOptionIndex >= 0 &&
                                            mode.options &&
                                            this.customOptionIndex < mode.options.length) {
                                            const option = mode.options[this.customOptionIndex];
                                            fields = option.fields || '';
                                        }
                                        
                                        // 如果 fields 不為空，則使用它來顯示摘要
                                        if (fields) {
                                            // 將 fields 以逗號分隔成陣列，並過濾掉空值
                                            const fieldList = fields.split(',').map(f => f.trim()).filter(Boolean);
                                            const fieldValues: string[] = [];
                                            
                                            // 收集所有欄位值，並處理別名（"原始欄位|別名"）
                                            fieldList.forEach(fieldEntry => {
                                                // 解析欄位與顯示名稱
                                                // 只從右邊數來的第一個 '|' 進行分割
                                                // 例如 "State|A|狀態" 會變成 ["State|A", "狀態"]
                                                const lastPipeIndex = fieldEntry.lastIndexOf('|');
                                                let fieldKey, displayName;
                                                
                                                if (lastPipeIndex !== -1) {
                                                    // 如果找到 '|'，則分割成欄位名稱和顯示名稱
                                                    fieldKey = fieldEntry.substring(0, lastPipeIndex).trim();
                                                    displayName = fieldEntry.substring(lastPipeIndex + 1).trim() || fieldKey;
                                                } else {
                                                    // 如果沒有 '|'，則使用原始欄位名稱
                                                    fieldKey = fieldEntry.trim();
                                                    displayName = fieldKey;
                                                }
    
                                                if (metadata?.[fieldKey] !== undefined && metadata?.[fieldKey] !== '' && metadata?.[fieldKey] !== null) {
                                                    // 如果是數字，則加入千位分隔符號
                                                    if (typeof metadata[fieldKey] === 'number') {
                                                        metadata[fieldKey] = metadata[fieldKey].toLocaleString();
                                                    }
                                                    // 如果是陣列，則轉換為字串
                                                    if (Array.isArray(metadata[fieldKey])) {
                                                        metadata[fieldKey] = metadata[fieldKey].join(', ');
                                                    }
                                                    fieldValues.push(`${displayName}: ${metadata[fieldKey]}`);
                                                }
                                            });
                                            
                                            // 如果有找到任何欄位值，則組合起來
                                            if (fieldValues.length > 0) {
                                                summaryValue = fieldValues.join('\n'); // 使用 | 分隔不同欄位
                                            }
                                        }
                                    }  
                                }
                                if (summaryValue) {
                                    if (!this.sourceMode.startsWith('custom-')) {
                                        // Frontmatter 有設定摘要值
                                        pEl = contentArea.createEl('p', { text: summaryValue.trim() });
                                    } else {
                                        // custom mode 有設定顯示欄位值
                                        pEl = contentArea.createEl('p', { text: summaryValue.trim() , cls: 'ge-content-area-p-field' });
                                    }
                                } else {
                                    // Frontmatter 沒有設定摘要值，則使用內文
                                    let contentWithoutFrontmatter = '';
                                    if (summaryLength < 500) {
                                        contentWithoutFrontmatter = content.substring(frontMatterInfo.contentStart).slice(0, 500);
                                    } else {
                                        contentWithoutFrontmatter = content.substring(frontMatterInfo.contentStart).slice(0, summaryLength + summaryLength);
                                    }

                                    let contentWithoutMediaLinks = '';

                                    if (this.plugin.settings.showCodeBlocksInSummary) {
                                        contentWithoutMediaLinks = contentWithoutFrontmatter;
                                    } else {
                                        // 刪除 code block
                                        contentWithoutMediaLinks = contentWithoutFrontmatter
                                            .replace(/```[\s\S]*?```\n/g, '')
                                            .replace(/```[\s\S]*$/,'');                  
                                    }

                                    // 刪除註解及連結
                                    contentWithoutMediaLinks = contentWithoutMediaLinks
                                        .replace(/<!--[\s\S]*?-->/g, '')
                                        .replace(/!?\[([^\]]*)\]\([^)]+\)|!?\[\[([^\]]+)\]\]/g, (match, p1, p2) => {
                                            const linkText = p1 || p2 || '';
                                            if (!linkText) return '';
                                            
                                            // 獲取副檔名並檢查是否為圖片或影片
                                            const extension = linkText.split('.').pop()?.toLowerCase() || '';
                                            return (IMAGE_EXTENSIONS.has(extension) || VIDEO_EXTENSIONS.has(extension)) ? '' : linkText;
                                        });  

                                    //把開頭的標題整行刪除
                                    if (contentWithoutMediaLinks.startsWith('# ') || contentWithoutMediaLinks.startsWith('## ') || contentWithoutMediaLinks.startsWith('### ')) {
                                        contentWithoutMediaLinks = contentWithoutMediaLinks.split('\n').slice(1).join('\n');
                                    }
                                    
                                    if (!this.plugin.settings.showCodeBlocksInSummary) {
                                        // 不刪除code block的情況下，包含這些特殊符號
                                        contentWithoutMediaLinks = contentWithoutMediaLinks.replace(/[>|\-#*]/g,'').trim();
                                    }

                                    // 只取前 summaryLength 個字符作為預覽
                                    const preview = contentWithoutMediaLinks.slice(0, summaryLength) + (contentWithoutMediaLinks.length > summaryLength ? '...' : '');
                                    
                                    // 創建預覽內容
                                    pEl = contentArea.createEl('p', { text: preview.trim() });
                                }
                            } 

                            //將預覽文字設定到標題的 title 屬性中
                            const titleEl = fileEl.querySelector('.ge-title');
                            if (titleEl) {
                                setTooltip(contentArea as HTMLElement, `${titleEl.textContent}`)
                            }

                            if (frontMatterInfo.exists) {
                                const colorValue = metadata?.color;
                                if (colorValue) {
                                    // 使用 CSS 類別來設置顏色
                                    fileEl.addClass(`ge-note-color-${colorValue}`);
                                    
                                    // 設置預覽內容文字顏色
                                    if (pEl) {
                                        pEl.addClass(`ge-note-color-${colorValue}-text`);
                                    }
                                }
                                const titleField = this.plugin.settings.noteTitleField || 'title';
                                const titleValue = metadata?.[titleField];
                                if (titleValue) {
                                    // 將標題文字設為 frontmatter 的 title
                                    if (titleEl) {
                                        titleEl.textContent = titleValue;
                                    }
                                } 

                                const displayValue = metadata?.display;
                                if (displayValue === 'minimized') {
                                    // 移除已建立的預覽段落
                                    if (pEl) {
                                        pEl.remove();
                                    }
                                    // 移除圖片區域（若已存在）
                                    const imageAreaEl = fileEl.querySelector('.ge-image-area');
                                    if (imageAreaEl) {
                                        imageAreaEl.remove();
                                    }
                                    fileEl.style.height = '100%';
                                }

                                // 如果 frontmatter 中存在 redirect 欄位，將圖示設為 shuffle
                                const redirectValue = metadata?.redirect;
                                if (redirectValue) {
                                    const iconContainer = fileEl.querySelector('.ge-icon-container');
                                    if (iconContainer) {
                                        setIcon(iconContainer as HTMLElement, 'shuffle');
                                    }
                                }
                            }

                            imageUrl = await findFirstImageInNote(this.app, content);
                        } else {
                            // 其他檔案顯示副檔名
                            if (!this.minMode) {
                                contentArea.createEl('p', { text: file.extension.toUpperCase() });
                            }

                            setTooltip(fileEl as HTMLElement, `${file.name}`,{ delay:2000 })
                        }
                        
                        // 顯示標籤（僅限 Markdown 檔案）
                        if (file.extension === 'md' && this.showNoteTags && !this.minMode) {
                            const fileCache = this.app.metadataCache.getFileCache(file);
                            const displaySetting = fileCache?.frontmatter?.display;

                            // 如果筆記是最小化就直接跳過標籤邏輯
                            if (displaySetting !== 'minimized') {

                                const allTags = new Set<string>();
                                
                                // 從 frontmatter 獲取標籤
                                let frontmatterTags = fileCache?.frontmatter?.tags || [];
                                
                                // 處理不同的標籤格式
                                if (typeof frontmatterTags === 'string') {
                                    // 如果是字符串，按逗號或空格分割
                                    frontmatterTags.split(/[,\s]+/).filter(tag => tag.trim() !== '')
                                        .forEach(tag => allTags.add(tag));
                                } else if (Array.isArray(frontmatterTags)) {
                                    frontmatterTags.forEach(tag => {
                                        // 處理陣列中的每個標籤，可能是字符串或包含空格的字符串
                                        if (typeof tag === 'string') {
                                            // 檢查標籤是否包含空格（可能是未被正確分割的多個標籤）
                                            if (tag.includes(' ')) {
                                                // 按空格分割並添加每個子標籤
                                                tag.split(/\s+/).filter(subTag => subTag.trim() !== '')
                                                    .forEach(subTag => allTags.add(subTag));
                                            } else {
                                                allTags.add(tag);
                                            }
                                        }
                                    });
                                }
                                
                                // 從檔案 cache 中獲取內文標籤
                                const cacheTags = fileCache?.tags || [];
                                cacheTags.forEach(tagObj => {
                                    const tag = tagObj.tag.startsWith('#') ? tagObj.tag.substring(1) : tagObj.tag;
                                    allTags.add(tag);
                                });
                                
                                if (allTags.size > 0) {
                                    // 創建標籤容器
                                    const tagsContainer = contentArea.createDiv('ge-tags-container');
                                    
                                    // 根據區塊寬度動態計算可顯示的標籤數量
                                    // const containerWidth = tagsContainer.getBoundingClientRect().width;
                                    // const tagWidth = 70;
                                    // const maxTags = Math.floor(containerWidth / tagWidth);

                                    // 取得要顯示的標籤
                                    // const displayTags = Array.from(allTags).slice(0, maxTags);

                                    // 取得所有標籤
                                    const displayTags = Array.from(allTags);
                                
                                    displayTags.forEach(tag => {
                                        const tagEl = tagsContainer.createEl('span', { 
                                            cls: 'ge-tag',
                                            text: tag.startsWith('#') ? tag : `#${tag}`
                                        });
                                        
                                        //添加右鍵選單事件，點擊後開啟選單，點擊選單中的選項後追加標籤到搜尋關鍵字內並重新渲染
                                        tagEl.addEventListener('contextmenu', (e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            const tagText = tag.startsWith('#') ? tag : `#${tag}`;
                                            const menu = new Menu();
                                            //添加加入搜尋選項
                                            if (!this.searchQuery.includes(tagText)) {
                                                menu.addItem(item => item
                                                    .setTitle(t('add_tag_to_search'))
                                                    .setIcon('circle-plus')
                                                    .onClick(() => {
                                                        this.searchQuery += ` ${tagText}`;
                                                        this.render(true);
                                                        return false;
                                                    })
                                                );
                                            }
                                            // 添加刪除標籤選項
                                            if (this.searchQuery.includes(tagText)) {
                                                menu.addItem(item => item
                                                    .setTitle(t('remove_tag_from_search'))
                                                    .setIcon('circle-minus')
                                                    .onClick(() => {
                                                        this.searchQuery = this.searchQuery.replace(tagText, '');
                                                        this.render(true);
                                                        return false;
                                                    })
                                                );
                                            }
                                            menu.showAtPosition({
                                                x: e.clientX,
                                                y: e.clientY
                                            });
                                        });

                                        // 添加點擊事件，點擊後設置搜尋關鍵字並重新渲染
                                        tagEl.addEventListener('click', (e) => {
                                            e.preventDefault();
                                            e.stopPropagation(); // 防止事件冒泡到卡片
                                            const tagText = tag.startsWith('#') ? tag : `#${tag}`;
                                            if (this.searchQuery === tagText) {
                                                return;
                                            }
                                            this.searchQuery = tagText;
                                            this.render(true);
                                            return false;
                                        });
                                    });
                                }
                            }
                        }
                        
                        contentArea.setAttribute('data-loaded', 'true');
                    }
                    
                    // 載入圖片預覽
                    if (!this.minMode) {
                        const imageArea = fileEl.querySelector('.ge-image-area');
                        if (imageArea && !imageArea.hasAttribute('data-loaded')) {
                            // 根據檔案類型處理
                            if (isImageFile(file)) {
                                // 直接顯示圖片
                                const img = imageArea.createEl('img');
                                img.src = this.app.vault.getResourcePath(file);
                                imageArea.setAttribute('data-loaded', 'true');
                            } else if (isVideoFile(file)) {
                                // 根據設定決定是否顯示影片縮圖
                                if (this.plugin.settings.showVideoThumbnails) {
                                    // 顯示影片縮圖
                                    const video = imageArea.createEl('video');
                                    video.src = this.app.vault.getResourcePath(file);
                                } else {
                                    // 顯示播放圖示
                                    const videoThumb = imageArea.createDiv('ge-video-thumbnail');
                                    setIcon(videoThumb, 'play-circle');
                                }
                                imageArea.setAttribute('data-loaded', 'true');
                            } else if (file.extension === 'md') {
                                // Markdown 檔案尋找內部圖片
                                if (imageUrl) {
                                    const img = imageArea.createEl('img');
                                    img.src = imageUrl;
                                    imageArea.setAttribute('data-loaded', 'true');
                                } else {
                                    // 如果沒有圖片，移除圖片區域
                                    imageArea.remove();
                                }
                            } else {
                                // 其他檔案類型，移除圖片區域
                                imageArea.remove();
                            }
                        }
                    }
                    
                    // 一旦載入完成，就不需要再觀察這個元素
                    observer.unobserve(fileEl);
                }
            });
        }, {
            root: container,
            rootMargin: '50px', // 預先載入視窗外 50px 的內容
            threshold: 0.1
        });
        
        // 顯示檔案
        if (files.length > 0) {
            // 檢查是否應該顯示日期分隔器
            const dateDividerMode = this.plugin.settings.dateDividerMode || 'none';
            const sortType = this.folderSortType ? this.folderSortType : this.sortType;
            const shouldShowDateDividers = dateDividerMode !== 'none' && 
                (sortType.startsWith('mtime-') || sortType.startsWith('ctime-')) &&
                this.sourceMode !== 'random-note' &&
                this.sourceMode !== 'bookmarks' &&
                this.showDateDividers;

            let lastDateString = '';
            let pinDividerAdded = false;
            let blankDividerAdded = false;

            // 每次重新渲染時遞增 token，以便中斷舊批次
            const currentToken = ++this.renderToken;
            // 設定批次渲染狀態
            const state: DividerState = { lastDateString: lastDateString, pinDividerAdded: pinDividerAdded, blankDividerAdded: blankDividerAdded };
            const paramsBase: FileRenderParams = { container, observer, files, dateDividerMode, sortType, shouldShowDateDividers, state };
            const selfRef = this;

            if (Platform.isIosApp) {
                // iOS 專用：以 time-slice 方式分批，避免阻塞點擊事件
                const TIME_BUDGET_MS = 6; // 每幀最多執行 6ms
                const processChunk = (start: number) => {
                    if (currentToken !== this.renderToken) return;
                    const startTime = performance.now();
                    let i = start;
                    for (; i < files.length; i++) {
                        selfRef.processFile(files[i], paramsBase);
                        if (performance.now() - startTime > TIME_BUDGET_MS) {
                            break; // 超過時間預算，讓出主執行緒
                        }
                    }
                    if (i < files.length) {
                        requestAnimationFrame(() => processChunk(i)); // 下一幀繼續
                    }
                };
                processChunk(0);
            } else {
                // 其他平台維持原本固定 batchSize 的邏輯
                const batchSize = 50;
                const processBatch = (start: number) => {
                    if (currentToken !== this.renderToken) return;
                    const end = Math.min(start + batchSize, files.length);
                    for (let i = start; i < end; i++) {
                        selfRef.processFile(files[i], paramsBase);
                    }
                    if (end < files.length) {
                        const cb = () => processBatch(end);
                        if (typeof (window as any).requestIdleCallback === 'function') {
                            (window as any).requestIdleCallback(cb);
                        } else {
                            setTimeout(cb, 0);
                        }
                    }
                };
                processBatch(0);
            }
        }

        if (this.plugin.statusBarItem) {
            this.plugin.statusBarItem.setText(`${files.length} ${t('files')}`);
        }
    }

    // 處理單個檔案渲染
    private processFile(file: TFile, params: FileRenderParams): void {
        const { container, observer, files, dateDividerMode, sortType, shouldShowDateDividers, state } = params;

        // 如果需要顯示置頂分隔器，且尚未加入，當前檔案為置頂清單之一時插入
        if (!state.pinDividerAdded && this.pinnedList.includes(file.name)) {
            const pinDivider = container.createDiv('ge-pin-divider');
            pinDivider.textContent = t('pinned');
            state.pinDividerAdded = true;

            // 針對 iOS 設備進行特殊處理
            if (Platform.isIosApp) {
                pinDivider.style.width = 'calc(100% - 16px)';
            }
        }

        // 插入空白分隔器：當已加入置頂分隔器且尚未加入空白分隔器，且當前檔案不是置頂檔案
        if (state.pinDividerAdded && !state.blankDividerAdded && !this.pinnedList.includes(file.name)) {
            container.createDiv('ge-break');
            state.blankDividerAdded = true;
        }
        
        // 日期分隔器
        if (shouldShowDateDividers && !this.pinnedList.includes(file.name)) {
            let timestamp = 0;
                    
            // 根據排序類型獲取日期時間戳
            if (sortType.startsWith('mtime-') || sortType.startsWith('ctime-')) {
                // 判斷是否以修改日期排序，最近檔案模式使用修改日期排序
                const isModifiedTime = sortType.startsWith('mtime-') || this.sourceMode === 'recent-files';
                
                // 檢查是否是 Markdown 文件，且有設定對應的 frontmatter 字段
                let frontMatterDate = null;
                if (file.extension === 'md') {
                    const metadata = this.app.metadataCache.getFileCache(file);
                    if (metadata?.frontmatter) {
                        const fieldSetting = isModifiedTime 
                            ? this.plugin.settings.modifiedDateField 
                            : this.plugin.settings.createdDateField;

                        const fieldNames = fieldSetting
                            ? fieldSetting.split(',').map(f => f.trim()).filter(Boolean)
                            : [];

                        for (const fieldName of fieldNames) {
                            const dateStr = metadata.frontmatter[fieldName];
                            if (dateStr) {
                                const date = new Date(dateStr);
                                if (!isNaN(date.getTime())) {
                                    frontMatterDate = date;
                                    break; // 已找到有效日期
                                }
                            }
                        }
                    }
                }
                
                // 使用 frontmatter 中的日期或檔案的狀態日期
                if (frontMatterDate) {
                    timestamp = frontMatterDate.getTime();
                } else {
                    timestamp = isModifiedTime ? file.stat.mtime : file.stat.ctime;
                }
            }

            // 創建日期物件並格式化
            const fileDate = new Date(timestamp);

            // 根據日期分隔器模式設定格式化
            let currentDateString = '';

            if (dateDividerMode === 'year') {
                // 年分隔器：只顯示年份
                currentDateString = fileDate.getFullYear().toString();
            } else if (dateDividerMode === 'month') {
                // 月分隔器：顯示年-月
                const year = fileDate.getFullYear();
                const month = fileDate.getMonth() + 1; // getMonth() 回傳 0-11
                currentDateString = `${year}-${month.toString().padStart(2, '0')}`;
            } else {
                // 日分隔器：顯示完整日期（預設行為）
                currentDateString = fileDate.toLocaleDateString();
            }

            // 如果日期不同於上一個檔案的日期，添加分隔器
            if (currentDateString !== state.lastDateString) {
                state.lastDateString = currentDateString;
                
                // 創建日期分隔器
                const dateDivider = container.createDiv('ge-date-divider');
                dateDivider.textContent = currentDateString;
                
                // 針對 iOS 設備進行特殊處理
                if (Platform.isIosApp) {
                    dateDivider.style.width = 'calc(100% - 16px)';
                }
            }
        }

        const fileEl = container.createDiv('ge-grid-item');
        this.gridItems.push(fileEl); // 添加到網格項目數組
        fileEl.dataset.filePath = file.path;

        // 如果檔案與父資料夾同名，添加 ge-foldernote 類別
        const parentPath = file.parent?.path || '';
        const parentName = parentPath.split('/').pop() || '';
        if (parentName === file.basename) {
            fileEl.addClass('ge-foldernote');
        }

        //如果檔案是否處於置頂範圍，添加 ge-pinned 類別
        if (this.pinnedList.includes(file.name)) {
            fileEl.addClass('ge-pinned');
        }
        
        // 創建左側內容區，包含圖示和標題
        const contentArea = fileEl.createDiv('ge-content-area');
        
        // 創建標題容器
        const titleContainer = contentArea.createDiv('ge-title-container');
        const extension = file.extension.toLowerCase();

        // 檢查是否為媒體檔案，如果是則添加 ge-media-card 類別
        if (this.cardLayout === 'vertical' && 
            (isImageFile(file) || isVideoFile(file)) &&
            !this.minMode) {
            fileEl.addClass('ge-media-card');
        }

        // 添加檔案類型圖示
        if (isImageFile(file)) {
            const iconContainer = titleContainer.createDiv('ge-icon-container ge-img');
            setIcon(iconContainer, 'image');
        } else if (isVideoFile(file)) {
            const iconContainer = titleContainer.createDiv('ge-icon-container ge-video');
            setIcon(iconContainer, 'play-circle');
        } else if (isAudioFile(file)) {
            const iconContainer = titleContainer.createDiv('ge-icon-container ge-audio');
            setIcon(iconContainer, 'music');
        } else if (extension === 'pdf') {
            const iconContainer = titleContainer.createDiv('ge-icon-container ge-pdf');
            setIcon(iconContainer, 'paperclip');
        } else if (extension === 'canvas') {
            const iconContainer = titleContainer.createDiv('ge-icon-container ge-canvas');
            setIcon(iconContainer, 'layout-dashboard');
        } else if (extension === 'base') {
            const iconContainer = titleContainer.createDiv('ge-icon-container ge-base');
            setIcon(iconContainer, 'layout-list');
        } else if (extension === 'md' || extension === 'txt') {
            const iconContainer = titleContainer.createDiv('ge-icon-container');
            setIcon(iconContainer, 'file-text');
        } else {
            const iconContainer = titleContainer.createDiv('ge-icon-container');
            setIcon(iconContainer, 'file');
        }

        // 創建標題（立即載入）
        const shouldShowExtension = this.minMode && extension !== 'md';
        const displayText = shouldShowExtension ? `${file.basename}.${file.extension}` : file.basename;
        const titleEl = titleContainer.createEl('span', { cls: 'ge-title', text: displayText });
        if (this.plugin.settings.multiLineTitle) titleEl.addClass('ge-multiline-title');

        // 創建圖片區域，但先不載入圖片
        if (!this.minMode) {
            fileEl.createDiv('ge-image-area');
        }
        
        // 開始觀察這個元素
        observer.observe(fileEl);

        // 點擊時開啟檔案
        fileEl.addEventListener('click', (event) => {
            // 獲取項目索引
            const index = this.gridItems.indexOf(fileEl);
            if (index < 0) return;

            // 處理多選邏輯
            if (event.ctrlKey || event.metaKey) {
                if (this.selectedItems.size > 1) {
                    // 如果已有選中2個以上的狀態，則繼續選中
                    this.selectItem(index, true);
                    this.hasKeyboardFocus = true;
                } else {
                    // 沒有選中狀態則開啟新分頁
                    if (isMediaFile(file)) {
                        // 開啟媒體檔案
                        if (isAudioFile(file)) {
                            FloatingAudioPlayer.open(this.app, file);
                        } else {
                            this.openMediaFile(file, files);
                        }
                    } else {
                        // 開啟文件檔案到新分頁
                        this.app.workspace.getLeaf(true).openFile(file);
                    }
                }
                event.preventDefault();
                return;
            } else if (event.shiftKey) {
                // Shift 鍵：範圍選擇
                this.handleRangeSelection(index);
                this.hasKeyboardFocus = true;
                event.preventDefault();
                return;
            } else if (event.altKey || this.plugin.settings.showNoteInGrid) {
                // Alt 鍵或設定為預設時：在 grid container 中顯示筆記
                this.selectItem(index);
                this.hasKeyboardFocus = true;
                
                if (isMediaFile(file)) {
                    // 媒體檔案：正常開啟
                    if (isAudioFile(file)) {
                        FloatingAudioPlayer.open(this.app, file);
                    } else {
                        this.openMediaFile(file, files);
                    }
                } else if (file.extension === 'pdf' || file.extension === 'canvas' || file.extension === 'base') {
                    this.app.workspace.getLeaf(true).openFile(file);
                } else {
                    // 非媒體檔案：在 grid container 中顯示筆記
                    this.showNoteInGrid(file);
                }
                event.preventDefault();
                return;
            } else {
                // 一般點擊：選中單個項目並開啟
                this.selectItem(index);
                this.hasKeyboardFocus = true;

                // 根據檔案類型處理點擊事件
                if (isMediaFile(file)) {
                    // 開啟媒體檔案
                    if (isAudioFile(file)) {
                        FloatingAudioPlayer.open(this.app, file);
                    } else {
                        this.openMediaFile(file, files);
                    }
                } else {
                    // 開啟文件檔案
                    const fileCache = this.app.metadataCache.getFileCache(file);
                    const redirectType = fileCache?.frontmatter?.type;
                    const redirectPath = fileCache?.frontmatter?.redirect;

                    if (redirectType && typeof redirectPath === 'string' && redirectPath.trim() !== '') {
                        let target;
                        
                        if (redirectType === 'file') {
                            if (redirectPath.startsWith('[[') && redirectPath.endsWith(']]')) {
                                const noteName = redirectPath.slice(2, -2);
                                target = this.app.metadataCache.getFirstLinkpathDest(noteName, file.path);
                            } else {
                                target = this.app.vault.getAbstractFileByPath(normalizePath(redirectPath));
                            }
                            
                            if (target instanceof TFile) {
                                this.app.workspace.getLeaf().openFile(target);
                            } else {
                                new Notice(`${t('target_not_found')}: ${redirectPath}`);
                            }
                        }
                        else if (redirectType === 'folder') {
                            // 判斷redirectPath是否為資料夾
                            if (this.app.vault.getAbstractFileByPath(normalizePath(redirectPath)) instanceof TFolder) {
                                this.setSource('folder', redirectPath, true);
                                this.clearSelection();
                            } else {
                                new Notice(`${t('target_not_found')}: ${redirectPath}`);
                            }
                        } else if (redirectType === 'mode') {
                            // 判斷redirectPath是否為模式
                            this.setSource(redirectPath, '', true);
                            this.clearSelection();
                        } else {
                            new Notice(`${t('target_not_found')}: ${redirectPath}`);
                        }
                    } else {
                        // 非捷徑就正常開啟檔案
                        const leaf = this.app.workspace.getLeaf();
                        if (this.searchQuery !== '') {
                            this.app.vault.cachedRead(file).then((content) => {
                                const searchQuery = this.searchQuery;
                                const lowerContent = content.toLowerCase();
                                let idx = -1;
                                let lineNumber = 0;

                                // 1. 先嘗試完整比對（不分大小寫）
                                idx = lowerContent.indexOf(searchQuery.toLowerCase());
                                
                                // 2. 若找不到，嘗試拆開關鍵字搜尋
                                if (idx === -1 && searchQuery.includes(' ')) {
                                    const keywords = searchQuery.split(/\s+/).filter(k => k.trim() !== '');
                                    if (keywords.length > 1) {
                                        // 找第一個出現的關鍵字
                                        for (const keyword of keywords) {
                                            const keywordIdx = lowerContent.indexOf(keyword.toLowerCase());
                                            if (keywordIdx !== -1) {
                                                idx = keywordIdx;
                                                break;
                                            }
                                        }
                                    }
                                }

                                if (idx !== -1) {
                                    lineNumber = content.substring(0, idx).split('\n').length - 1;
                                    leaf.openFile(file, { eState: { line: lineNumber } }).then(() => {
                                        (this.app as any)?.commands?.executeCommandById?.('editor:focus');
                                    });
                                    return;
                                }
                                // 若都找不到關鍵字，直接開檔
                                leaf.openFile(file);
                            });
                        } else {
                            leaf.openFile(file);
                        }
                    }
                }
            }
        });

        // 避免中鍵點擊會自動滾動頁面
        fileEl.addEventListener('mousedown', (event) => {
            if (event.button === 1) {
                event.preventDefault();
            }
        });

        fileEl.addEventListener('mouseup', (event) => {
            if (event.button === 1) {
                event.preventDefault();
                if (!isMediaFile(file)) {
                    this.app.workspace.getLeaf(true).openFile(file);
                }
            }
        });

        if(Platform.isDesktop) {
            // 添加拖曳功能
            fileEl.setAttribute('draggable', 'true');
            fileEl.addEventListener('dragstart', (event) => {
                // 獲取項目索引
                const index = this.gridItems.indexOf(fileEl);
                if (index >= 0) {
                    // 如果項目未被選中，則選中它
                    if (!this.selectedItems.has(index)) {
                        this.selectItem(index);
                    }
                }

                // 獲取選中的檔案
                const selectedFiles = this.getSelectedFiles();
                let drag_filename = '';
                
                // 添加拖曳資料
                if (selectedFiles.length > 1) {
                    // 如果多個檔案被選中，使用 files-menu
                    const fileList = selectedFiles.map(f => {
                        const isMedia = isMediaFile(f);
                        return isMedia ? `![[${f.path}]]` : `[[${f.path}]]`;
                    }).join('\n');
                    event.dataTransfer?.setData('text/plain', fileList);
                    
                    // 添加檔案路徑列表
                    event.dataTransfer?.setData('application/obsidian-grid-explorer-files', 
                        JSON.stringify(selectedFiles.map(f => f.path)));
                    
                    drag_filename = `${selectedFiles.length} ${t('files')}`;
                } else {
                    // 如果只有單個檔案被選中，使用檔案路徑
                    const isMedia = isMediaFile(file);
                    const mdLink = isMedia
                        ? `![[${file.path}]]` // 媒體檔案使用 ![[]] 格式
                        : `[[${file.path}]]`;  // 一般檔案使用 [[]] 格式

                    // 添加拖曳資料
                    event.dataTransfer?.setData('text/plain', mdLink);
                    
                    // 添加檔案路徑列表
                    event.dataTransfer?.setData('application/obsidian-grid-explorer-files', 
                        JSON.stringify([file.path]));

                    drag_filename = file.basename;
                }
                
                const dragImage = document.createElement('div');
                dragImage.className = 'ge-custom-drag-preview';
                dragImage.textContent = drag_filename;
                
                // 將元素暫時加入 DOM
                document.body.appendChild(dragImage);
                
                // 設定拖曳圖示
                event.dataTransfer!.setDragImage(dragImage, 20, 20);

                // 延遲移除元素（讓拖曳圖示正常顯示）
                setTimeout(() => {
                    document.body.removeChild(dragImage);
                }, 0);

                // 設定拖曳效果
                event.dataTransfer!.effectAllowed = 'all';
                // 添加拖曳中的視覺效果
                fileEl.addClass('ge-dragging');
            });
            
            fileEl.addEventListener('dragend', () => {
                // 移除拖曳中的視覺效果
                fileEl.removeClass('ge-dragging');
            });
        }
        
        // 添加右鍵選單
        fileEl.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            const menu = new Menu();
            
            // 獲取項目索引
            const index = this.gridItems.indexOf(fileEl);
            if (index >= 0) {
                // 如果項目未被選中，則選中它
                if (!this.selectedItems.has(index)) {
                    this.selectItem(index);
                }
            }

            // 獲取選中的檔案
            const selectedFiles = this.getSelectedFiles();
            
            if (selectedFiles.length > 1) {
                // 多個檔案被選中，使用 files-menu
                this.app.workspace.trigger('files-menu', menu, selectedFiles);
                
                // 檢查是否所有選中的檔案都是 md 檔案
                const allMdFiles = selectedFiles.every(file => file.extension === 'md');
                if (allMdFiles) {
                    menu.addItem((item) => {
                        item
                            .setTitle(t('set_note_attribute'))
                            .setIcon('palette')
                            .onClick(() => {
                                showNoteSettingsModal(this.app, this.plugin, selectedFiles);
                            });
                    });
                }
            } else {
                this.app.workspace.trigger('file-menu', menu, file);
            }

            // 添加置顶和最小化显示菜单项（仅限 md 文件且在文件夹模式下）
            if (file.extension === 'md' && this.sourceMode === 'folder' && this.sourcePath !== '/') {
                // 获取当前文件的状态
                const fileCache = this.app.metadataCache.getFileCache(file);
                const isCurrentlyPinned = this.pinnedList.includes(file.name);
                const isCurrentlyMinimized = fileCache?.frontmatter?.display === 'minimized';

                // 置顶/取消置顶选项
                menu.addItem((item) => {
                    item
                        .setTitle(isCurrentlyPinned ? t('unpin') : t('pin'))
                        .setIcon(isCurrentlyPinned ? 'pin-off' : 'pin')
                        .onClick(async () => {
                            await this.togglePinNote(file);
                        });
                });

                // 最小化显示切换选项
                menu.addItem((item) => {
                    item
                        .setTitle(isCurrentlyMinimized ? t('display_normal') : t('display_minimized'))
                        .setIcon(isCurrentlyMinimized ? 'maximize-2' : 'minimize-2')
                        .onClick(async () => {
                            await this.toggleMinimizeNote(file);
                        });
                });

                menu.addSeparator();
            }

            // 设置笔记属性选项（单个文件）
            if (selectedFiles.length === 1 && file.extension === 'md') {
                menu.addItem((item) => {
                    item
                        .setTitle(t('set_note_attribute'))
                        .setIcon('palette')
                        .onClick(() => {
                            showNoteSettingsModal(this.app, this.plugin, file);
                        });
                });
            }

            // 新增在新分頁開啟選項
            menu.addItem((item) => {
                item
                    .setTitle(t('open_in_new_tab'))
                    .setIcon('external-link')
                    .setSection?.("open")
                    .onClick(() => {
                        if (selectedFiles.length > 1) {
                            // 如果多個檔案被選中，開啟所有文件檔案
                            const documentFiles = selectedFiles.filter(f => isDocumentFile(f));
                            for (const docFile of documentFiles) {
                                this.app.workspace.getLeaf(true).openFile(docFile);
                            }
                        } else {
                            this.app.workspace.getLeaf(true).openFile(file);
                        }
                    });
            });

            // 刪除選項
            menu.addItem((item) => {
                (item as any).setWarning(true);
                item
                    .setTitle(t('delete_note'))
                    .setIcon('trash')
                    .onClick(async () => {
                        if (selectedFiles.length > 1) {
                            // 刪除多個檔案
                            for (const f of selectedFiles) {
                                await this.app.fileManager.trashFile(f);
                            }
                        } else {
                            // 刪除單個檔案
                            await this.app.fileManager.trashFile(file);
                        }
                        // 清除選中狀態
                        this.clearSelection();
                    });
            });
            menu.showAtMouseEvent(event);
        });
    }

    onPaneMenu(menu: Menu, source: string) {
        menu.addItem(item => {
            item
                .setTitle(t('hide_header_elements'))
                .setIcon("archive-restore")
                .setChecked(this.hideHeaderElements)
                .onClick(() => {
                    this.hideHeaderElements = !this.hideHeaderElements;
                    this.app.workspace.requestSaveLayout();
                    this.render(true);
                });   
        });
        menu.addItem((item) => {
            item
                .setTitle(t('reselect'))
                .setIcon("grid")
                .onClick(() => {
                    showFolderSelectionModal(this.app, this.plugin, this);
                });
        });
        menu.addItem((item) => {
            item
                .setTitle(t('refresh'))
                .setIcon("refresh-cw")
                .onClick(() => {
                    this.render(true);
                });
        });
    }

    // 在新視窗中開啟資料夾
    private openFolderInNewView(folderPath: string) {
        const { workspace } = this.app;
        let leaf = null;
        workspace.getLeavesOfType('grid-view');
        switch (this.plugin.settings.defaultOpenLocation) {
            case 'left':
                leaf = workspace.getLeftLeaf(false);
                break;
            case 'right':
                leaf = workspace.getRightLeaf(false);
                break;
            case 'tab':
            default:
                leaf = workspace.getLeaf('tab');
                break;
        }
        if (!leaf) {
            // 如果無法獲取指定位置的 leaf，則回退到新分頁
            leaf = workspace.getLeaf('tab');
        }
        leaf.setViewState({ type: 'grid-view', active: true });
        // 設定資料來源
        if (leaf.view instanceof GridView) {
            leaf.view.setSource('folder', folderPath);
        }
        // 確保視圖是活躍的
        workspace.revealLeaf(leaf);
    }

    // 清除選中狀態
    clearSelection() {
        this.gridItems.forEach(item => {
            item.removeClass('ge-selected-item');
        });
        this.selectedItemIndex = -1;
        this.selectedItems.clear();
    }

    // 選中指定索引的項目
    selectItem(index: number, multiSelect = false) {
        // 如果不是多選模式，先清除所有項目的選中狀態
        if (!multiSelect) {
            this.gridItems.forEach(item => {
                item.removeClass('ge-selected-item');
            });
            this.selectedItems.clear();
        }

        // 確保索引在有效範圍內
        if (index >= 0 && index < this.gridItems.length) {
            this.selectedItemIndex = index;
            const selectedItem = this.gridItems[index];
            
            // 如果是多選模式且項目已被選中，則取消選中
            if (multiSelect && this.selectedItems.has(index)) {
                selectedItem.removeClass('ge-selected-item');
                this.selectedItems.delete(index);
                // 如果取消選中後沒有選中項目，則設置 selectedItemIndex 為 -1
                if (this.selectedItems.size === 0) {
                    this.selectedItemIndex = -1;
                } else {
                    // 否則設置為最後一個選中項目
                    this.selectedItemIndex = Array.from(this.selectedItems).pop() || -1;
                }
            } else {
                // 否則選中項目
                selectedItem.addClass('ge-selected-item');
                this.selectedItems.add(index);
            }
            
            // 確保選中的項目在視圖中可見
            selectedItem.scrollIntoView({ block: 'nearest' });
        }
    }

    // 處理範圍選擇（Shift 鍵）
    handleRangeSelection(index: number) {
        if (this.selectedItemIndex === -1) {
            // 如果沒有已選中的項目，直接選中當前項目
            this.selectItem(index);
            return;
        }

        // 計算範圍的起始和結束索引
        const startIndex = Math.min(this.selectedItemIndex, index);
        const endIndex = Math.max(this.selectedItemIndex, index);

        // 清除現有選擇
        this.gridItems.forEach(item => {
            item.removeClass('ge-selected-item');
        });
        this.selectedItems.clear();

        // 選中範圍內的所有項目
        for (let i = startIndex; i <= endIndex; i++) {
            this.gridItems[i].addClass('ge-selected-item');
            this.selectedItems.add(i);
        }

        // 更新當前選中索引
        this.selectedItemIndex = index;
    }

    // 獲取所有選中項目的檔案
    getSelectedFiles(): TFile[] {
        const files: TFile[] = [];
        this.selectedItems.forEach(index => {
            const fileEl = this.gridItems[index];
            const filePath = fileEl.dataset.filePath;
            if (filePath) {
                const file = this.app.vault.getAbstractFileByPath(filePath);
                if (file instanceof TFile) {
                    files.push(file);
                }
            }
        });
        return files;
    }

    // 開啟媒體檔案
    openMediaFile(file: TFile, mediaFiles?: TFile[]) {
        // 如果沒有傳入媒體檔案列表，則獲取
        const getMediaFilesPromise = mediaFiles 
            ? Promise.resolve(mediaFiles.filter(f => isMediaFile(f)))
            : getFiles(this, this.randomNoteIncludeMedia).then(allFiles => allFiles.filter(f => isMediaFile(f)));
        
        getMediaFilesPromise.then(filteredMediaFiles => {
            // 找到當前檔案在媒體檔案列表中的索引
            const currentIndex = filteredMediaFiles.findIndex(f => f.path === file.path);
            if (currentIndex === -1) return;

            // 使用 MediaModal 開啟媒體檔案，並傳入 this 作為 gridView 參數
            const mediaModal = new MediaModal(this.app, file, filteredMediaFiles, this);
            mediaModal.open();
        });
    }

    // 在 grid container 中顯示筆記
    async showNoteInGrid(file: TFile) {
        // 檢查是否為捷徑檔案
        const fileCache = this.app.metadataCache.getFileCache(file);
        const redirectType = fileCache?.frontmatter?.type;
        const redirectPath = fileCache?.frontmatter?.redirect;

        if (redirectType && typeof redirectPath === 'string' && redirectPath.trim() !== '') {
            let target;
            
            if (redirectType === 'file') {
                if (redirectPath.startsWith('[[') && redirectPath.endsWith(']]')) {
                    const noteName = redirectPath.slice(2, -2);
                    target = this.app.metadataCache.getFirstLinkpathDest(noteName, file.path);
                } else {
                    target = this.app.vault.getAbstractFileByPath(normalizePath(redirectPath));
                }
                
                if (target instanceof TFile) {
                    // 遞迴處理目標檔案
                    this.showNoteInGrid(target);
                    return;
                } else {
                    new Notice(`${t('target_not_found')}: ${redirectPath}`);
                    return;
                }
            }
            else if (redirectType === 'folder') {
                // 判斷redirectPath是否為資料夾
                if (this.app.vault.getAbstractFileByPath(normalizePath(redirectPath)) instanceof TFolder) {
                    this.setSource('folder', redirectPath, true);
                    this.clearSelection();
                    return;
                } else {
                    new Notice(`${t('target_not_found')}: ${redirectPath}`);
                    return;
                }
            } else if (redirectType === 'mode') {
                // 判斷redirectPath是否為模式
                this.setSource(redirectPath, '', true);
                this.clearSelection();
                return;
            } else {
                new Notice(`${t('target_not_found')}: ${redirectPath}`);
                return;
            }
        }

        // 關閉之前的筆記顯示
        if (this.isShowingNote) {
            this.hideNoteInGrid();
        }

        const gridContainer = this.containerEl.querySelector('.ge-grid-container');
        if (!gridContainer) return;

        // 隱藏網格內容
        gridContainer.addClass('ge-hidden');

        // 創建筆記顯示容器
        this.noteViewContainer = this.containerEl.createDiv('ge-note-view-container');

        // 頂部列 (左右區塊)
        const topBar = this.noteViewContainer.createDiv('ge-note-top-bar');
        const leftBar = topBar.createDiv('ge-note-top-left');
        const rightBar = topBar.createDiv('ge-note-top-right');

        // 筆記標題
        const noteTitle = leftBar.createDiv('ge-note-title');
        noteTitle.textContent = file.basename;
        setTooltip(noteTitle, file.basename);

        // 編輯按鈕
        const editButton = rightBar.createEl('button', { cls: 'ge-note-edit-button' });
        setIcon(editButton, 'pencil');
        editButton.addEventListener('click', () => {
            this.app.workspace.getLeaf().openFile(file);
        });

        // 關閉按鈕
        const closeButton = rightBar.createEl('button', { cls: 'ge-note-close-button' });
        setIcon(closeButton, 'x');
        closeButton.addEventListener('click', () => {
            this.hideNoteInGrid();
        });

        // 捲動內容容器
        const scrollContainer = this.noteViewContainer.createDiv('ge-note-scroll-container');

        // 假設在視圖側邊欄則把字型調小
        const isInSidebar = this.leaf.getRoot() === this.app.workspace.leftSplit || 
                            this.leaf.getRoot() === this.app.workspace.rightSplit;
        if (isInSidebar) {
            scrollContainer.style.fontSize = '1em';
            scrollContainer.style.backgroundColor = 'var(--background-secondary)';
        }

        // 創建筆記內容容器
        const noteContent = scrollContainer.createDiv('ge-note-content-container');
        if (isInSidebar) {
            noteContent.style.padding = '15px';
        }
        
        // 創建筆記內容區域
        const noteContentArea = noteContent.createDiv('ge-note-content');

        try {
            // 讀取筆記內容
            const content = await this.app.vault.read(file);

            // 使用 Obsidian 的 MarkdownRenderer 渲染內容
            await MarkdownRenderer.render(
                this.app,
                content,
                noteContentArea,
                file.path,
                this
            );
            
            // 加上自訂屬性 data-source-path
            noteContentArea
                .querySelectorAll<HTMLImageElement>('img')
                .forEach((img) => (img.dataset.sourcePath = file.path));

            // 處理內部連結點擊
            const handleLinkClick = (e: MouseEvent) => {
                const target = e.target as HTMLElement;
                const link = target.closest('a.internal-link');
                if (link) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const href = link.getAttribute('href');
                    if (href) {
                        const linkText = link.getAttribute('data-href') || href;
                        const linkedFile = this.app.metadataCache.getFirstLinkpathDest(linkText, file.path);
                        if (linkedFile) {
                            this.app.workspace.getLeaf().openFile(linkedFile);
                        }
                    }
                }
            };

            // 使用 registerDomEvent 註冊事件
            this.registerDomEvent(noteContentArea, 'click', handleLinkClick);
        } catch (error) {
            noteContentArea.textContent = '無法載入筆記內容';
            console.error('Error loading note content:', error);
        }

        // 設定狀態
        this.isShowingNote = true;

        // 註冊鍵盤事件監聽器
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                this.hideNoteInGrid();
                e.preventDefault();
            }
        };
        
        document.addEventListener('keydown', handleKeyDown);
        
        // 儲存事件監聽器以便後續移除
        (this.noteViewContainer as any).keydownHandler = handleKeyDown;
    }

    // 隱藏筆記顯示
    hideNoteInGrid() {
        if (!this.isShowingNote) return;

        const gridContainer = this.containerEl.querySelector('.ge-grid-container');
        if (gridContainer) {
            gridContainer.removeClass('ge-hidden');
        }

        if (this.noteViewContainer) {
            // 移除鍵盤事件監聽器
            const keydownHandler = (this.noteViewContainer as any).keydownHandler;
            if (keydownHandler) {
                document.removeEventListener('keydown', keydownHandler);
            }
            
            this.noteViewContainer.remove();
            this.noteViewContainer = null;
        }

        this.isShowingNote = false;
    }

    // 顯示捷徑選擇 Modal
    showShortcutSelectionModal() {
        const modal = new ShortcutSelectionModal(this.app, this.plugin, async (option) => {
            await this.createShortcut(option);
        });
        modal.open();
    }

    // 創建捷徑檔案
    private async createShortcut(option: { type: 'mode' | 'folder' | 'file'; value: string; display: string; }) {
        try {
            // 生成不重複的檔案名稱
            let counter = 0;
            let shortcutName = `${option.display}`;
            let newPath = `${shortcutName}.md`;
            while (this.app.vault.getAbstractFileByPath(newPath)) {
                counter++;
                shortcutName = `${option.display} ${counter}`;
                newPath = `${shortcutName}.md`;
            }

            // 創建新檔案
            const newFile = await this.app.vault.create(newPath, '');

            // 使用 processFrontMatter 來更新 frontmatter
            await this.app.fileManager.processFrontMatter(newFile, (frontmatter: any) => {                
                if (option.type === 'mode') {
                    frontmatter.type = 'mode';
                    frontmatter.redirect = option.value;
                } else if (option.type === 'folder') {
                    frontmatter.type = 'folder';
                    frontmatter.redirect = option.value;
                } else if (option.type === 'file') {
                    const link = this.app.fileManager.generateMarkdownLink(
                        this.app.vault.getAbstractFileByPath(option.value) as TFile, 
                        ""
                    );
                    frontmatter.type = "file";
                    frontmatter.redirect = link;
                }
            });

            new Notice(`${t('shortcut_created')}: ${shortcutName}`);

        } catch (error) {
            console.error('Create shortcut error', error);
            new Notice(t('Failed to create shortcut'));
        }
    }

    // 保存視圖狀態
    getState() {
        return {
            type: 'grid-view',
            state: {
                sourceMode: this.sourceMode,
                sourcePath: this.sourcePath,
                sortType: this.sortType,
                folderSortType: this.folderSortType,
                searchQuery: this.searchQuery,
                searchAllFiles: this.searchAllFiles,
                searchMediaFiles: this.searchMediaFiles,
                randomNoteIncludeMedia: this.randomNoteIncludeMedia,
                minMode: this.minMode,
                showIgnoredFolders: this.showIgnoredFolders,
                baseCardLayout: this.baseCardLayout,
                cardLayout: this.cardLayout,
                hideHeaderElements: this.hideHeaderElements,
                showDateDividers: this.showDateDividers,
                showNoteTags: this.showNoteTags,
                recentSources: this.recentSources,
            }
        };
    }

    // 讀取視圖狀態
    async setState(state: any): Promise<void> {  
        if (state.state) {
            this.sourceMode = state.state.sourceMode || 'folder';
            this.sourcePath = state.state.sourcePath || '/';
            this.sortType = state.state.sortType || this.plugin.settings.defaultSortType;
            this.folderSortType = state.state.folderSortType || '';
            this.searchQuery = state.state.searchQuery || '';
            this.searchAllFiles = state.state.searchAllFiles ?? true;
            this.searchMediaFiles = state.state.searchMediaFiles ?? false;
            this.randomNoteIncludeMedia = state.state.randomNoteIncludeMedia ?? false;
            this.minMode = state.state.minMode ?? false;
            this.showIgnoredFolders = state.state.showIgnoredFolders ?? false;
            this.baseCardLayout = state.state.baseCardLayout ?? 'horizontal';
            this.cardLayout = state.state.cardLayout ?? this.baseCardLayout; // 同步 baseCardLayout 的卡片樣式，以便 render() 使用正確的 cardLayout
            this.hideHeaderElements = state.state.hideHeaderElements ?? false;
            this.showDateDividers = state.state.showDateDividers ?? this.plugin.settings.dateDividerMode !== 'none';
            this.showNoteTags = state.state.showNoteTags ?? this.plugin.settings.showNoteTags;
            this.recentSources = state.state.recentSources ?? [];
            this.render();
        }
    }

    // 切换笔记置顶状态
    async togglePinNote(file: TFile) {
        const folder = file.parent;
        if (!folder || folder === this.app.vault.getRoot()) return;
        
        const notePath = `${folder.path}/${folder.name}.md`;
        let noteFile = this.app.vault.getAbstractFileByPath(notePath);
        
        // 如果文件夹笔记不存在，创建一个
        if (!(noteFile instanceof TFile)) {
            const isCurrentlyPinned = this.pinnedList.includes(file.name);
            if (!isCurrentlyPinned) {
                const initialContent = `---\npinned:\n  - ${file.name}\n---\n`;
                noteFile = await this.app.vault.create(notePath, initialContent);
            } else {
                return; // 如果要取消置顶但文件夹笔记不存在，直接返回
            }
        }
        
        // 更新置顶列表
        await this.app.fileManager.processFrontMatter(noteFile as TFile, (frontmatter) => {
            let list: string[] = Array.isArray(frontmatter['pinned']) ? frontmatter['pinned'] : [];
            const isCurrentlyPinned = list.includes(file.name);
            
            if (isCurrentlyPinned) {
                // 取消置顶
                list = list.filter(n => n !== file.name);
            } else {
                // 添加置顶
                list.push(file.name);
            }
            
            if (list.length > 0) {
                frontmatter['pinned'] = list;
            } else {
                delete frontmatter['pinned'];
            }
        });
        
        // 等待一小段时间确保 metadata cache 更新
        setTimeout(() => {
            this.render();
        }, 200);
    }
    
    // 切换笔记最小化显示状态
    async toggleMinimizeNote(file: TFile) {
        await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
            const isCurrentlyMinimized = frontmatter['display'] === 'minimized';
            
            if (isCurrentlyMinimized) {
                // 切换为正常显示
                if (frontmatter['display'] === 'minimized') {
                    delete frontmatter['display'];
                }
            } else {
                // 切换为最小化显示
                frontmatter['display'] = 'minimized';
            }
        });
        
        // 等待一小段时间确保 metadata cache 更新
        setTimeout(() => {
            this.render();
        }, 200);
    }
}