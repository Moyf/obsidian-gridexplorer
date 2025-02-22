const { Plugin, ItemView, Modal, TFolder, TFile, PluginSettingTab, Setting, Menu, setIcon, getLanguage, getFrontMatterInfo } = require('obsidian');

// 語系檔案
const TRANSLATIONS = {
    'zh-TW': {
        // 通知訊息
        'bookmarks_plugin_disabled': '請先啟用書籤插件',

        // 按鈕和標籤
        'sorting': '排序方式',
        'refresh': '重新整理',
        'reselect_folder': '重新選擇位置',
        'go_up': '回上層資料夾',
        'no_backlinks': '沒有反向連結',
        'search': '搜尋',
        'search_placeholder': '搜尋關鍵字',
        'cancel': '取消',
        'new_note': '新增筆記',
        'untitled': '未命名',
        'notes': '個筆記',

        // 視圖標題
        'grid_view_title': '網格視圖',
        'bookmarks_mode': '書籤',
        'folder_mode': '資料夾',
        'search_results': '搜尋結果',
        'backlinks_mode': '反向連結',
        'all_notes_mode': '所有筆記',

        // 排序選項
        'sort_name_asc': '名稱 (A → Z)',
        'sort_name_desc': '名稱 (Z → A)',
        'sort_mtime_desc': '修改時間 (新 → 舊)',
        'sort_mtime_asc': '修改時間 (舊 → 新)',
        'sort_ctime_desc': '建立時間 (新 → 舊)',
        'sort_ctime_asc': '建立時間 (舊 → 新)',
        'sort_random': '隨機排序',

        // 設定
        'grid_view_settings': '網格視圖設定',
        'ignored_folders': '忽略的資料夾',
        'ignored_folders_desc': '在這裡設定要忽略的資料夾（每行一個資料夾路徑）',
        'ignored_folders_placeholder': '範例：\n.obsidian\nTemplates',
        'default_sort_type': '預設排序模式',
        'default_sort_type_desc': '設定開啟網格視圖時的預設排序方式',
        'grid_item_width': '網格項目寬度',
        'grid_item_width_desc': '設定網格項目的寬度',
        'image_area_width': '圖片區域寬度',
        'image_area_width_desc': '設定圖片預覽區域的寬度',
        'image_area_height': '圖片區域高度',
        'image_area_height_desc': '設定圖片預覽區域的高度',

        // 選擇資料夾對話框
        'select_folders': '選擇資料夾',
        'open_grid_view': '開啟網格視圖',
        'open_in_grid_view': '在網格視圖中開啟',
        'delete_note': '刪除筆記',
        'open_in_new_tab': '在新分頁開啟',
    },
    'en': {
        // Notifications
        'bookmarks_plugin_disabled': 'Please enable the Bookmarks plugin first',

        // Buttons and Labels
        'sorting': 'Sort by',
        'refresh': 'Refresh',
        'reselect_folder': 'Reselect folder',
        'go_up': 'Go Up',
        'no_backlinks': 'No backlinks',
        'search': 'Search',
        'search_placeholder': 'Search keyword',
        'cancel': 'Cancel',
        'new_note': 'New note',
        'untitled': 'Untitled',
        'notes': 'Notes',

        // View Titles
        'grid_view_title': 'Grid View',
        'bookmarks_mode': 'Bookmarks',
        'folder_mode': 'Folder',
        'search_results': 'Search results',
        'backlinks_mode': 'Backlinks',
        'all_notes_mode': 'All notes',

        // Sort Options
        'sort_name_asc': 'Name (A → Z)',
        'sort_name_desc': 'Name (Z → A)',
        'sort_mtime_desc': 'Modified time (New → Old)',
        'sort_mtime_asc': 'Modified time (Old → New)',
        'sort_ctime_desc': 'Created time (New → Old)',
        'sort_ctime_asc': 'Created time (Old → New)',
        'sort_random': 'Random',

        // Settings
        'grid_view_settings': 'Grid view settings',
        'ignored_folders': 'Ignored folders',
        'ignored_folders_desc': 'Set folders to be ignored (one path per line)',
        'ignored_folders_placeholder': 'Example:\n.obsidian\nTemplates',
        'default_sort_type': 'Default sort type',
        'default_sort_type_desc': 'Set the default sorting method when opening Grid View',
        'grid_item_width': 'Grid item width',
        'grid_item_width_desc': 'Set the width of grid items',
        'image_area_width': 'Image area width',
        'image_area_width_desc': 'Set the width of the image preview area',
        'image_area_height': 'Image area height',
        'image_area_height_desc': 'Set the height of the image preview area',

        // Folder Selection Dialog
        'select_folders': 'Select folder',
        'open_grid_view': 'Open Grid View',
        'open_in_grid_view': 'Open in grid view',
        'delete_note': 'Delete note',
        'open_in_new_tab': 'Open in new tab',
    },
    'zh': {
        // 通知信息
        'bookmarks_plugin_disabled': '请先启用书签插件',

        // 按钮和标签
        'sorting': '排序方式',
        'refresh': '刷新',
        'reselect_folder': '重新选择位置',
        'go_up': '回上层文件夹',
        'no_backlinks': '没有反向链接',
        'search': '搜索',
        'search_placeholder': '搜索关键字',
        'cancel': '取消',
        'new_note': '新增笔记',
        'untitled': '未命名',
        'notes': '個笔记',

        // 视图标题
        'grid_view_title': '网格视图',
        'bookmarks_mode': '书签',
        'folder_mode': '文件夹',
        'search_results': '搜索结果',
        'backlinks_mode': '反向链接',
        'all_notes_mode': '所有笔记',

        // 排序选项
        'sort_name_asc': '名称 (A → Z)',
        'sort_name_desc': '名称 (Z → A)',
        'sort_mtime_desc': '修改时间 (新 → 旧)',
        'sort_mtime_asc': '修改时间 (旧 → 新)',
        'sort_ctime_desc': '建立时间 (新 → 旧)',
        'sort_ctime_asc': '建立时间 (旧 → 新)',
        'sort_random': '随机排序',

        // 设置
        'grid_view_settings': '网格视图设置',
        'ignored_folders': '忽略的文件夹',
        'ignored_folders_desc': '在这里设置要忽略的文件夹（每行一个文件夹路径）',
        'ignored_folders_placeholder': '範例：\n.obsidian\nTemplates',
        'default_sort_type': '預设排序模式',
        'default_sort_type_desc': '设置开启网格视图时的預设排序方式',
        'grid_item_width': '网格项目宽度',
        'grid_item_width_desc': '设置网格项目的宽度',
        'image_area_width': '圖片區域寬度',
        'image_area_width_desc': '设置圖片預覽區域的寬度',
        'image_area_height': '圖片區域高度',
        'image_area_height_desc': '设置圖片預覽區域的高度',

        // 选择资料夹对话框
        'select_folders': '选择文件夹',
        'open_grid_view': '开启网格视图',
        'open_in_grid_view': '在网格视图中开启',
        'delete_note': '删除笔记',
        'open_in_new_tab': '在新分頁開啟',
    },
    'ja': {
        // 通知メッジ
        'bookmarks_plugin_disabled': 'ブックマークプラグインを有効にしてください',

        // ボタンとラベル
        'sorting': 'ソート',
        'refresh': 'リフレッシュ',
        'reselect_folder': 'フォルダを再選択',
        'go_up': '上へ',
        'no_backlinks': 'バックリンクはありません',
        'search': '検索',
        'search_placeholder': '検索キーワード',
        'cancel': 'キャンセル',
        'new_note': '新規ノート',
        'untitled': '無題のファイル',
        'notes': 'ファイル',

        // ビュータイトル
        'grid_view_title': 'グリッドビュー',
        'bookmarks_mode': 'ブックマーク',
        'folder_mode': 'フォルダ',
        'search_results': '検索結果',
        'backlinks_mode': 'バックリンク',
        'all_notes_mode': 'すべてのノート',

        // ソートオプション
        'sort_name_asc': '名前 (A → Z)',
        'sort_name_desc': '名前 (Z → A)',
        'sort_mtime_desc': '変更時間 (新 → 旧)',
        'sort_mtime_asc': '変更時間 (旧 → 新)',
        'sort_ctime_desc': '作成時間 (新 → 旧)',
        'sort_ctime_asc': '作成時間 (旧 → 新)',
        'sort_random': 'ランダム',

        // 設定
        'grid_view_settings': 'グリッドビューセッティング',
        'ignored_folders': '無視するフォルダ',
        'ignored_folders_desc': '無視するフォルダを設定します（1行に1つのフォルダパス）',
        'ignored_folders_placeholder': '例：\n.obsidian\nTemplates',
        'default_sort_type': 'デフォルトのソートタイプ',
        'default_sort_type_desc': 'グリッドビューを開くときのデフォルトのソート方法を設定します',
        'grid_item_width': 'グリッドアイテムの幅',
        'grid_item_width_desc': 'グリッドアイテムの幅を設定します',
        'image_area_width': '画像エリア幅',
        'image_area_width_desc': '画像プレビュー領域の幅を設定します',
        'image_area_height': '画像エリア高さ',
        'image_area_height_desc': '画像プレビュー領域の高さを設定します',

        // フォルダ選択ダイアログ
        'select_folders': 'フォルダを選択',
        'open_grid_view': 'グリッドビューを開く',
        'open_in_grid_view': 'グリッドビューで開く',
        'delete_note': 'ノートを削除',
        'open_in_new_tab': '新しいタブで開く',
    },
};

// 全域翻譯函式
function t(key) {
    const langSetting = getLanguage();
    const lang = TRANSLATIONS[langSetting] || TRANSLATIONS['en'];
    return lang[key] || key;
}

// 處理媒體連結
function processMediaLink(app, linkText) {
    // 處理 Obsidian 內部連結 ![[file]]
    const internalMatch = linkText.match(/!\[\[(.*?)\]\]/);
    if (internalMatch) {
        const file = app.metadataCache.getFirstLinkpathDest(internalMatch[1], '');
        if (file) {
            return app.vault.getResourcePath(file);
        }
    }

    // 處理標準 Markdown 連結 ![alt](path)
    const markdownMatch = linkText.match(/!\[(.*?)\]\((.*?)\)/);
    if (markdownMatch) {
        const url = markdownMatch[2].split(" ")[0];
        if (url.startsWith('http')) {
            return url;
        } else {
            const file = app.metadataCache.getFirstLinkpathDest(url, '');
            if (!file) {
                const fileByPath = app.vault.getAbstractFileByPath(url);
                if (fileByPath) {
                    return app.vault.getResourcePath(fileByPath);
                }
            } else {
                return app.vault.getResourcePath(file);
            }
        }
    }
    return null;
}

// 尋找筆記中的第一張圖片
async function findFirstImageInNote(app, file) {
    try {
        const content = await app.vault.cachedRead(file);
        const internalMatch = content.match(/(?:!\[\[(.*?\.(?:jpg|jpeg|png|gif|webp))(?:\|.*?)?\]\]|!\[(.*?)\]\(\s*(\S+?(?:\.(?:jpg|jpeg|png|gif|webp)|format=(?:jpg|jpeg|png|gif|webp))[^\s)]*)\s*(?:\s+["'][^"']*["'])?\s*\))/gi);
        if (internalMatch) {
            return processMediaLink(app, internalMatch[0]);;
        } else {    
            return null;
        }
    } catch (error) {
        console.error('Error finding image in note:', error);
        return null;
    }
}

// 定義網格視圖
class GridView extends ItemView {
    constructor(leaf, plugin) {
        super(leaf);
        this.plugin = plugin;
        this.containerEl.addClass('ge-grid-view-container');
        this.sourceMode = ''; // 預設為書籤模式
        this.sourcePath = null; // 用於資料夾模式的路徑
        this.sortType = this.plugin.settings.defaultSortType; // 使用設定中的預設排序模式
        this.searchQuery = ''; // 搜尋關鍵字
        
        // 註冊檔案變更監聽器
        this.registerFileWatcher();
    }

    getViewType() {
        return 'grid-view';
    }

    getIcon() {
        return 'grid';
    }

    getDisplayText() {
        if (this.sourceMode === '') {
            return t('grid_view_title');
        } else if (this.sourceMode === 'bookmarks') {
            return t('bookmarks_mode');
        } else if (this.sourceMode === 'folder') {
            return this.sourcePath;
        } else if (this.sourceMode === 'search') {
            return t('search_results');
        } else if (this.sourceMode === 'backlinks') {
            return t('backlinks_mode');
        } else if (this.sourceMode === 'all-notes') {
            return t('all_notes_mode');
        }
    }

    setSource(mode, path = null) {
        this.sourceMode = mode;
        this.sourcePath = path;
        this.render();
        // 通知 Obsidian 保存視圖狀態
        this.app.workspace.requestSaveLayout();
    }

    async getFiles() {
        if (this.sourceMode === 'folder' && this.sourcePath) {
            // 獲取指定資料夾內的所有 Markdown 檔案
            const folder = this.app.vault.getAbstractFileByPath(this.sourcePath);
            if (folder instanceof TFolder) {
                // 只取得當前資料夾中的 Markdown 檔案，不包含子資料夾
                const files = folder.children.filter(file => file.extension === 'md');
                return this.sortFiles(files);
            }
            return [];
        } else if (this.sourceMode === 'search') {
            // 搜尋模式：使用 Obsidian 的搜尋功能
            const globalSearchPlugin = this.app.internalPlugins.getPluginById('global-search');
            if (globalSearchPlugin?.instance) {
                const searchLeaf = this.app.workspace.getLeavesOfType('search')[0];
                if (searchLeaf && searchLeaf.view && searchLeaf.view.dom) {
                    const resultDomLookup = searchLeaf.view.dom.resultDomLookup;
                    if (resultDomLookup) {
                        const files = Array.from(resultDomLookup.keys())
                            .filter(file => file.extension === 'md');
                        return this.sortFiles(files);
                    }
                }
            }
            return [];
        } else if (this.sourceMode === 'backlinks') {
            // 反向連結模式：找出所有引用當前筆記的檔案
            const activeFile = this.app.workspace.getActiveFile();
            if (!activeFile) {
                return [];
            }

            const backlinks = new Set();
            // 使用 resolvedLinks 來找出反向連結
            const resolvedLinks = this.app.metadataCache.resolvedLinks;
            for (const [sourcePath, links] of Object.entries(resolvedLinks)) {
                if (Object.keys(links).includes(activeFile.path)) {
                    const sourceFile = this.app.vault.getAbstractFileByPath(sourcePath);
                    if (sourceFile && sourceFile.extension === 'md') {
                        backlinks.add(sourceFile);
                    }
                }
            }

            return this.sortFiles(this.ignoredFiles(Array.from(backlinks)));
        } else if(this.sourceMode === 'bookmarks') {
            // 書籤模式
            const bookmarksPlugin = this.app.internalPlugins.plugins.bookmarks;
            if (!bookmarksPlugin?.enabled) {
                return [];
            }

            const bookmarks = bookmarksPlugin.instance.items;
            const bookmarkedFiles = new Set();
            
            const processBookmarkItem = (item) => {
                if (item.type === 'file') {
                    const file = this.app.vault.getAbstractFileByPath(item.path);
                    if (file && file.extension === 'md') {
                        bookmarkedFiles.add(file);
                    }
                } else if (item.type === 'group' && item.items) {
                    item.items.forEach(processBookmarkItem);
                }
            };
            
            bookmarks.forEach(processBookmarkItem);
            return Array.from(bookmarkedFiles);
        } else if (this.sourceMode === 'all-notes') {
            // 所有筆記模式
            const allNotes = this.app.vault.getMarkdownFiles()
            return this.sortFiles(allNotes);
        } else {
            return [];
        }
    }

        //排序檔案
    sortFiles(files) {
        if (this.sortType === 'name-asc') {
            return files.sort((a, b) => a.basename.localeCompare(b.basename));
        } else if (this.sortType === 'name-desc') {
            return files.sort((a, b) => b.basename.localeCompare(a.basename));
        } else if (this.sortType === 'mtime-desc') {
            return files.sort((a, b) => b.stat.mtime - a.stat.mtime);
        } else if (this.sortType === 'mtime-asc') {
            return files.sort((a, b) => a.stat.mtime - b.stat.mtime);
        } else if (this.sortType === 'ctime-desc') {
            return files.sort((a, b) => b.stat.ctime - a.stat.ctime);
        } else if (this.sortType === 'ctime-asc') {
            return files.sort((a, b) => a.stat.ctime - b.stat.ctime);
        } else if (this.sortType === 'random') {
            return files.sort(() => Math.random() - 0.5);
        }
        return files;
    }

    //忽略檔案
    ignoredFiles(files) {
        return files.filter(file => !this.plugin.settings.ignoredFolders.some(folder => file.path.startsWith(`${folder}/`)));
    }

    async render() {
        // 儲存當前捲動位置
        const scrollContainer = this.containerEl.querySelector('.view-content');
        const scrollTop = scrollContainer ? scrollContainer.scrollTop : 0;

        // 清空整個容器
        this.containerEl.empty();

        // 創建頂部按鈕區域
        const headerButtonsDiv = this.containerEl.createDiv('ge-header-buttons');

        // 添加新增筆記按鈕
        if (this.sourceMode === 'folder' && this.searchQuery === '') {
            const newNoteButton = headerButtonsDiv.createEl('button', { attr: { 'aria-label': t('new_note') } });
            newNoteButton.addEventListener('click', async () => {
                // 取得目前時間作為檔名的一部分
                let newFileName = `${t('untitled')}.md`;
                let newFilePath = this.sourcePath === '/' 
                    ? newFileName 
                    : `${this.sourcePath}/${newFileName}`;

                // 檢查檔案是否已存在，如果存在則遞增編號
                let counter = 1;
                while (this.app.vault.getAbstractFileByPath(newFilePath)) {
                    newFileName = `${t('untitled')} ${counter}.md`;
                    newFilePath = this.sourcePath === '/'
                        ? newFileName
                        : `${this.sourcePath}/${newFileName}`;
                    counter++;
                }

                try {
                    // 建立新筆記
                    const newFile = await this.app.vault.create(newFilePath, '');
                    // 開啟新筆記
                    await this.app.workspace.getLeaf().openFile(newFile);
                } catch (error) {
                    console.error('建立新筆記時發生錯誤:', error);
                }
            });
            setIcon(newNoteButton, 'square-pen');
        }

        // 添加回上層按鈕（僅在資料夾模式且不在根目錄時顯示）
        if (this.sourceMode === 'folder' && this.sourcePath !== '/') {
            const upButton = headerButtonsDiv.createEl('button', { attr: { 'aria-label': t('go_up') } });
            upButton.addEventListener('click', () => {
                const parentPath = this.sourcePath.split('/').slice(0, -1).join('/') || '/';
                this.setSource('folder', parentPath);
            });
            setIcon(upButton, 'arrow-up');
        }

        // 添加重新選擇資料夾按鈕
        const reselectButton = headerButtonsDiv.createEl('button', { attr: { 'aria-label': t('reselect_folder') }  });
        reselectButton.addEventListener('click', () => {
            showFolderSelectionModal(this.app, this, this);
        });
        setIcon(reselectButton, "folder");

        // 添加重新整理按鈕
        const refreshButton = headerButtonsDiv.createEl('button', { attr: { 'aria-label': t('refresh') }  });
        refreshButton.addEventListener('click', () => {
            this.render();
        });
        setIcon(refreshButton, 'refresh-ccw');

        // 添加排序按鈕
        if (this.sourceMode !== 'bookmarks') {
            const sortButton = headerButtonsDiv.createEl('button', { attr: { 'aria-label': t('sorting') }  });
            sortButton.addEventListener('click', (evt) => {
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
                            .setChecked(this.sortType === option.value)
                            .onClick(() => {
                                this.sortType = option.value;
                                this.render();
                                // 通知 Obsidian 保存視圖狀態
                                this.app.workspace.requestSaveLayout();
                            });
                    });
                });
                menu.showAtMouseEvent(evt);
            });
            setIcon(sortButton, 'arrow-up-narrow-wide');
        }

        // 添加搜尋按鈕
        const searchButtonContainer = headerButtonsDiv.createDiv('ge-search-button-container');
        
        // 搜尋按鈕
        const searchButton = searchButtonContainer.createEl('button', {
            cls: 'search-button',
            attr: { 'aria-label': t('search') }
        });
        setIcon(searchButton, 'search');
        searchButton.addEventListener('click', () => {
            
            this.showSearchModal();
        });

        // 如果有搜尋關鍵字，顯示搜尋文字和取消按鈕
        if (this.searchQuery) {
            searchButton.style.display = 'none';
            const searchTextContainer = searchButtonContainer.createDiv('ge-search-text-container');

            // 創建取消按鈕
            const clearButton = searchTextContainer.createDiv('ge-clear-button');
            setIcon(clearButton, 'x');
            clearButton.addEventListener('click', (e) => {
                e.stopPropagation();  // 防止觸發搜尋文字的點擊事件
                this.searchQuery = '';
                this.render();
            });

            const searchText = searchTextContainer.createEl('span', { text: this.searchQuery, cls: 'ge-search-text' });
            // 讓搜尋文字可點選
            searchText.style.cursor = 'pointer';
            searchText.addEventListener('click', () => {
                this.showSearchModal(this.searchQuery);
            });
        }

        // 創建內容區域
        const contentEl = this.containerEl.createDiv('view-content');

        // 重新渲染內容
        await this.grid_render();
        this.leaf.updateHeader()

        // 恢復捲動位置
        if (scrollContainer) {
            contentEl.scrollTop = scrollTop;
        }
    }

    async grid_render() {
        const container = this.containerEl.children[1];
        container.empty();
        container.addClass('ge-grid-container');
        container.style.setProperty('--grid-item-width', this.plugin.settings.gridItemWidth + 'px');
        container.style.setProperty('--image-area-width', this.plugin.settings.imageAreaWidth + 'px');
        container.style.setProperty('--image-area-height', this.plugin.settings.imageAreaHeight + 'px');

        // 如果是書籤模式且書籤插件未啟用，顯示提示
        if (this.sourceMode === 'bookmarks' && !this.app.internalPlugins.plugins.bookmarks?.enabled) {
            new Notice(t('bookmarks_plugin_disabled'));
            return;
        }

        // 如果是反向連結模式，但沒有活動中的檔案
        if (this.sourceMode === 'backlinks' && !this.app.workspace.getActiveFile()) {
            new Notice(t('no_backlinks'));
            return;
        }

        // 如果是資料夾模式，先顯示所有子資料夾
        if (this.sourceMode === 'folder' && this.searchQuery === '') {
            const currentFolder = this.app.vault.getAbstractFileByPath(this.sourcePath || '/');
            if (currentFolder instanceof TFolder) {
                // 只取得當前資料夾中的 Markdown 檔案，不包含子資料夾
                const subfolders = currentFolder.children
                    .filter(child => {
                        if (!(child instanceof TFolder)) return false;
                        // 檢查資料夾是否在忽略清單中
                        return !this.plugin.settings.ignoredFolders.some(
                            ignoredPath => child.path === ignoredPath || child.path.startsWith(ignoredPath + '/')
                        );
                    })
                    .sort((a, b) => a.name.localeCompare(b.name));

                for (const folder of subfolders) {
                    const folderEl = container.createDiv('ge-grid-item ge-folder-item');
                    
                    const contentArea = folderEl.createDiv('ge-content-area');
                    const titleEl = contentArea.createEl('h3', { text: `📁 ${folder.name}` });
                    
                    // 點擊時進入子資料夾
                    folderEl.addEventListener('click', () => {
                        this.setSource('folder', folder.path);
                    });
                }
            }
        }

        let files = [];
        if (this.searchQuery) {
            // 取得 vault 中所有的 Markdown 檔案
            const allMarkdownFiles = this.app.vault.getMarkdownFiles();
            // 根據搜尋關鍵字進行過濾（不分大小寫）
            const lowerCaseSearchQuery = this.searchQuery.toLowerCase();
            // 使用 Promise.all 來非同步地讀取所有檔案內容
            await Promise.all(
                allMarkdownFiles.map(async file => {
                    const fileName = file.name.toLowerCase();
                    const content = (await this.app.vault.cachedRead(file)).toLowerCase();
                    if (fileName.includes(lowerCaseSearchQuery) || content.includes(lowerCaseSearchQuery)) {
                        files.push(file);
                    }
                })
            );
            // 根據設定的排序方式排序檔案
            files = this.sortFiles(files);
        } else {
            // 獲取檔案列表並根據搜尋關鍵字過濾
            files = await this.getFiles();
        }

        //忽略檔案
        files = this.ignoredFiles(files)

        // 創建 Intersection Observer
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(async entry => {
                if (entry.isIntersecting) {
                    const noteEl = entry.target;
                    const file = noteEl.file;
                    
                    // 載入預覽內容
                    const contentArea = noteEl.querySelector('.ge-content-area');
                    if (!contentArea.hasAttribute('data-loaded')) {
                        const content = await this.app.vault.cachedRead(file);
                        const frontMatterInfo = getFrontMatterInfo(content);
                        const contentWithoutFrontmatter = content.substring(frontMatterInfo.contentStart);
                        const contentWithoutMediaLinks = contentWithoutFrontmatter.replace(/^`{3}[\s\S]*?`{3}|<!--[\s\S]*?-->|(!?\[([^\]]*)\]\(([^)]+)\))|!?\[\[([^\]]+)\]\]/g, '');
                        // 只取前100個字符作為預覽
                        const preview = contentWithoutMediaLinks.slice(0, 100) + (contentWithoutMediaLinks.length > 100 ? '...' : '');
                        
                        // 創建預覽內容
                        const contentEl = contentArea.createEl('p', { text: preview.trim() });
                        contentArea.setAttribute('data-loaded', 'true');
                    }
                    
                    // 載入圖片
                    const imageArea = noteEl.querySelector('.ge-image-area');
                    if (!imageArea.hasAttribute('data-loaded')) {
                        const imageUrl = await findFirstImageInNote(this.app, file);
                        if (imageUrl) {
                            const img = imageArea.createEl('img');
                            img.src = imageUrl;
                            imageArea.setAttribute('data-loaded', 'true');
                        } else {
                            // 如果沒有圖片，移除圖片區域
                            imageArea.remove();
                        }
                    }
                    
                    // 一旦載入完成，就不需要再觀察這個元素
                    observer.unobserve(noteEl);
                }
            });
        }, {
            root: container,
            rootMargin: '50px', // 預先載入視窗外 50px 的內容
            threshold: 0.1
        });
        
        // 顯示筆記
        for (const file of files) {
            const noteEl = container.createDiv('ge-grid-item');
            noteEl.file = file; // 儲存檔案引用以供後續使用
            
            // 創建左側內容區，但先只放標題
            const contentArea = noteEl.createDiv('ge-content-area');
            
            // 創建標題（立即載入）
            const titleEl = contentArea.createEl('h3', { text: file.basename });
            
            // 創建圖片區域，但先不載入圖片
            const imageArea = noteEl.createDiv('ge-image-area');
            
            // 開始觀察這個筆記元素
            observer.observe(noteEl);
            
            // 點擊時開啟筆記
            noteEl.addEventListener('click', (event) => {
                if (event.ctrlKey) {
                    this.app.workspace.getLeaf(true).openFile(file);
                } else {
                    this.app.workspace.getLeaf().openFile(file);
                }
            });
            
            // 添加右鍵選單
            noteEl.addEventListener('contextmenu', (event) => {
                event.preventDefault();
                const menu = new Menu();
                
                this.app.workspace.trigger("file-menu", menu, file);

                // 新增在新分頁開啟選項
                menu.addItem((item) => {
                    item
                        .setTitle(t('open_in_new_tab'))
                        .setIcon('external-link')
                        .onClick(() => {
                            this.app.workspace.getLeaf(true).openFile(file);
                        });
                });

                // 刪除選項
                menu.addItem((item) => {
                    item
                        .setTitle(t('delete_note'))
                        .setIcon('trash')
                        .onClick(async () => {
                            await this.app.fileManager.trashFile(file);
                        });
                });
                menu.showAtMouseEvent(event);
            });
        }

        if (this.plugin.statusBarItem) {
            this.plugin.statusBarItem.setText(`${files.length} ${t('notes')}`);
        }
    }

    // 顯示搜尋 modal
    showSearchModal(defaultQuery = '') {
        class SearchModal extends Modal {
            constructor(app, gridView, defaultQuery) {
                super(app);
                this.gridView = gridView;
                this.defaultQuery = defaultQuery;
            }

            onOpen() {
                const { contentEl } = this;
                contentEl.empty();
                contentEl.createEl('h2', { text: t('search') });

                // 創建搜尋輸入框容器
                const searchContainer = contentEl.createDiv('ge-search-container');

                // 創建搜尋輸入框
                const searchInput = searchContainer.createEl('input', {
                    type: 'text',
                    value: this.defaultQuery,
                    placeholder: t('search_placeholder')
                });

                // 創建清空按鈕
                const clearButton = searchContainer.createDiv('ge-search-clear-button');
                clearButton.style.display = this.defaultQuery ? 'flex' : 'none';
                setIcon(clearButton, 'x');

                // 監聽輸入框變化來控制清空按鈕的顯示
                searchInput.addEventListener('input', () => {
                    clearButton.style.display = searchInput.value ? 'flex' : 'none';
                });

                // 清空按鈕點擊事件
                clearButton.addEventListener('click', () => {
                    searchInput.value = '';
                    clearButton.style.display = 'none';
                    searchInput.focus();
                });

                // 創建按鈕容器
                const buttonContainer = contentEl.createDiv('ge-button-container');

                // 創建搜尋按鈕
                const searchButton = buttonContainer.createEl('button', {
                    text: t('search')
                });

                // 創建取消按鈕
                const cancelButton = buttonContainer.createEl('button', {
                    text: t('cancel')
                });

                // 綁定搜尋事件
                const performSearch = () => {
                    this.gridView.searchQuery = searchInput.value;
                    this.gridView.render();
                    // 通知 Obsidian 保存視圖狀態
                    this.gridView.app.workspace.requestSaveLayout();
                    this.close();
                };

                searchButton.addEventListener('click', performSearch);
                searchInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        performSearch();
                    }
                });

                cancelButton.addEventListener('click', () => {
                    this.close();
                });

                // 自動聚焦到搜尋輸入框，並將游標移到最後
                searchInput.focus();
                searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
            }

            onClose() {
                const { contentEl } = this;
                contentEl.empty();
            }
        }

        new SearchModal(this.app, this, defaultQuery).open();
    }

    // 保存視圖狀態
    getState() {
        return {
            type: 'grid-view',
            state: {
                sourceMode: this.sourceMode,
                sourcePath: this.sourcePath,
                sortType: this.sortType,
                searchQuery: this.searchQuery
            }
        };
    }

    // 讀取視圖狀態
    setState(state) {
        if (state.state) {
            this.sourceMode = state.state.sourceMode || '';
            this.sourcePath = state.state.sourcePath || null;
            this.sortType = state.state.sortType || 'mtime-desc';
            this.searchQuery = state.state.searchQuery || '';
            this.render();
        }
    }

    // 註冊檔案監聽器
    registerFileWatcher() {
        ['create', 'delete'].forEach(eventName => {
            this.registerEvent(
                this.app.vault.on(eventName, (file) => {
                    if (file instanceof TFile && file.extension === 'md') {
                        if (this.sourceMode === 'folder' && this.sourcePath && this.searchQuery === '') {
                            const fileDirPath = file.path.split('/').slice(0, -1).join('/') || '/';
                            if (fileDirPath === this.sourcePath) {
                                this.render();
                            } 
                        } else {
                            this.render();
                        }
                    }
                })
            );
        });

        //更名及檔案移動
        this.registerEvent(
            this.app.vault.on('rename', (file, oldPath) => {
                if (file instanceof TFile && file.extension === 'md') {
                    if (this.sourceMode === 'folder' && this.sourcePath && this.searchQuery === '') {
                        const fileDirPath = file.path.split('/').slice(0, -1).join('/') || '/';
                        const oldDirPath = oldPath.split('/').slice(0, -1).join('/') || '/';
                        if (fileDirPath === this.sourcePath || oldDirPath === this.sourcePath) {
                            this.render();
                        } 
                    } else {
                        this.render();
                    }
                }
            })
        );

        // 處理書籤變更
        this.registerEvent(
            this.app.internalPlugins.plugins.bookmarks.instance.on('changed', () => {
                if (this.sourceMode === 'bookmarks') {
                    this.render();
                }
            })
        );
    }
}

// 預設設定
const DEFAULT_SETTINGS = {
    ignoredFolders: [],
    defaultSortType: 'mtime-desc', // 預設排序模式：修改時間倒序
    gridItemWidth: 300, // 網格項目寬度，預設 300
    imageAreaWidth: 100, // 圖片區域寬度，預設 100
    imageAreaHeight: 100 // 圖片區域高度，預設 100
};

// 設定頁面類別
class GridExplorerSettingTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();

        // 等到有不同分類的設定再使用
        //containerEl.createEl('h2', { text: t('grid_view_settings') });

        // 忽略的資料夾設定
        new Setting(containerEl)
            .setName(t('ignored_folders'))
            .setDesc(t('ignored_folders_desc'))
            .addTextArea(text => text
                .setPlaceholder(t('ignored_folders_placeholder'))
                .setValue(this.plugin.settings.ignoredFolders.join('\n'))
                .onChange(async (value) => {
                    // 將文字區域的內容轉換為陣列，並過濾掉空行
                    this.plugin.settings.ignoredFolders = value
                        .split('\n')
                        .map(folder => folder.trim())
                        .filter(folder => folder.length > 0);
                    await this.plugin.saveSettings();
                }).inputEl.rows = 8);

        // 預設排序模式設定
        new Setting(containerEl)
            .setName(t('default_sort_type'))
            .setDesc(t('default_sort_type_desc'))
            .addDropdown(dropdown => dropdown
                .addOption('name-asc', t('sort_name_asc'))
                .addOption('name-desc', t('sort_name_desc'))
                .addOption('mtime-desc', t('sort_mtime_desc'))
                .addOption('mtime-asc', t('sort_mtime_asc'))
                .addOption('ctime-desc', t('sort_ctime_desc'))
                .addOption('ctime-asc', t('sort_ctime_asc'))
                .addOption('random', t('sort_random'))
                .setValue(this.plugin.settings.defaultSortType)
                .onChange(async (value) => {
                    this.plugin.settings.defaultSortType = value;
                    await this.plugin.saveSettings();
                }));

        // 網格項目寬度設定
        new Setting(containerEl)
            .setName(t('grid_item_width'))
            .setDesc(t('grid_item_width_desc'))
            .addSlider(slider => slider
                .setLimits(200, 600, 50)
                .setValue(this.plugin.settings.gridItemWidth)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.gridItemWidth = value;
                    await this.plugin.saveSettings();
                }));

        // 圖片區域寬度設定
        new Setting(containerEl)
            .setName(t('image_area_width'))
            .setDesc(t('image_area_width_desc'))
            .addSlider(slider => slider
                .setLimits(50, 300, 10)
                .setValue(this.plugin.settings.imageAreaWidth)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.imageAreaWidth = value;
                    await this.plugin.saveSettings();
                }));

        // 圖片區域高度設定
        new Setting(containerEl)
            .setName(t('image_area_height'))
            .setDesc(t('image_area_height_desc'))
            .addSlider(slider => slider
                .setLimits(50, 300, 10)
                .setValue(this.plugin.settings.imageAreaHeight)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.imageAreaHeight = value;
                    await this.plugin.saveSettings();
                }));
    }
}

// 顯示資料夾選擇 modal
async function showFolderSelectionModal(app, plugin, activeView = null) {
    class FolderSelectionModal extends Modal {
        constructor(app, plugin, activeView) {
            super(app);
            this.plugin = plugin;
            this.activeView = activeView;
        }

        onOpen() {
            const { contentEl } = this;
            contentEl.empty();
            contentEl.createEl('h2', { text: t('select_folders') });

            // 建立書籤選項
            const bookmarksPlugin = this.app.internalPlugins.plugins.bookmarks;
            if (bookmarksPlugin?.enabled) {
                const bookmarkOption = contentEl.createEl('div', {
                    cls: 'ge-grid-view-folder-option',
                    text: `📑 ${t('bookmarks_mode')}`
                });

                bookmarkOption.addEventListener('click', () => {
                    if (this.activeView) {
                        this.activeView.setSource('bookmarks');
                    } else {
                        this.plugin.activateView('bookmarks');
                    }
                    this.close();
                });
            }

            // 建立搜尋結果選項
            const searchLeaf = this.app.workspace.getLeavesOfType('search')[0];
            if (searchLeaf) {
                const searchView = searchLeaf.view;
                const searchInput = searchView.searchComponent ? searchView.searchComponent.inputEl : null;
                if(searchInput) {
                    if (searchInput.value.trim().length > 0) {
                        const searchOption = contentEl.createEl('div', {
                            cls: 'ge-grid-view-folder-option',
                            text: `🔍 ${t('search_results')}: ${searchInput.value}`
                        });

                        searchOption.addEventListener('click', () => {
                            if (this.activeView) {
                                this.activeView.setSource('search');
                            } else {
                                this.plugin.activateView('search');
                            }
                            this.close();
                        });
                    }
                }
            }

            // 建立反向連結選項
            const activeFile = this.app.workspace.getActiveFile();
            if (activeFile) {
                const activeFileName = activeFile ? `: ${activeFile.basename}` : '';
                const backlinksOption = contentEl.createEl('div', {
                    cls: 'ge-grid-view-folder-option',
                    text: `🔗 ${t('backlinks_mode')}${activeFileName}`
                });

                backlinksOption.addEventListener('click', () => {
                    if (this.activeView) {
                        this.activeView.setSource('backlinks');
                    } else {
                        this.plugin.activateView('backlinks');
                    }
                    this.close();
                });
            }

            
            // 建立所有筆記選項
            const allNotesOption = contentEl.createEl('div', {
                cls: 'ge-grid-view-folder-option',
                text: `📔 ${t('all_notes_mode')}`
            });

            allNotesOption.addEventListener('click', () => {
                if (this.activeView) {
                    this.activeView.setSource('all-notes');
                } else {
                    this.plugin.activateView('all-notes');
                }
                this.close();
            });

            // 建立根目錄選項
            const rootFolderOption = contentEl.createEl('div', {
                cls: 'ge-grid-view-folder-option',
                text: `📁 /`
            });

            rootFolderOption.addEventListener('click', () => {
                if (this.activeView) {
                    this.activeView.setSource('folder', '/');
                } else {
                    this.plugin.activateView('folder', '/');
                }
                this.close();
            });

            // 取得所有資料夾（排除被忽略的資料夾）
            const folders = app.vault.getAllFolders()
                .filter(folder => {
                    // 檢查資料夾是否在忽略清單中
                    return !this.plugin.settings.ignoredFolders.some(
                        ignoredPath => folder.path === ignoredPath || folder.path.startsWith(ignoredPath + '/')
                    );
                })
                .sort((a, b) => a.path.localeCompare(b.path));
                
            // 建立資料夾選項
            folders.forEach(folder => {
                const folderOption = contentEl.createEl('div', {
                    cls: 'ge-grid-view-folder-option',
                    text: `📁 ${folder.path || '/'}`
                });

                folderOption.addEventListener('click', () => {
                    if (this.activeView) {
                        this.activeView.setSource('folder', folder.path);
                    } else {
                        this.plugin.activateView('folder', folder.path);
                    }
                    this.close();
                });
            });
        }

        onClose() {
            const { contentEl } = this;
            contentEl.empty();
        }
    }

    new FolderSelectionModal(app, plugin, activeView).open();
}

// 主插件類別
module.exports = class GridExplorerPlugin extends Plugin {
    async onload() {
        // 載入設定
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

        // 註冊視圖類型
        this.registerView(
            'grid-view',
            (leaf) => new GridView(leaf, this)
        );

        // 添加命令以開啟網格視圖選擇 modal
        this.addCommand({
            id: 'open-grid-view',
            name: t('open_grid_view'),
            callback: () => {
                showFolderSelectionModal(this.app, this);
            }
        });

        this.addRibbonIcon('grid', t('open_grid_view'), () => {
            showFolderSelectionModal(this.app, this);
        });

        // 註冊設定頁面
        this.addSettingTab(new GridExplorerSettingTab(this.app, this));

        // 新增狀態列元件
        this.statusBarItem = this.addStatusBarItem();

        // 註冊資料夾的右鍵選單
        this.registerEvent(
            this.app.workspace.on('file-menu', (menu, file) => {
                if (file instanceof TFolder) {
                    menu.addItem((item) => {
                        item
                        .setTitle(t('open_in_grid_view'))
                        .setIcon('grid')
                        .onClick(() => {
                            this.activateView('folder', file.path);
                        });
                    });
                }
            })
        );
    }

    // 保存設定
    async saveSettings() {
        await this.saveData(this.settings);
    }

    async onunload() {
    }

    async activateView(mode = 'bookmarks', path = null) {
        const { workspace } = this.app;

        let leaf = null;
        const leaves = workspace.getLeavesOfType('grid-view');

        // 在新分頁中開啟
        leaf = workspace.getLeaf('tab');
        leaf.setViewState({ type: 'grid-view', active: true });

        // 設定資料來源
        if (leaf.view instanceof GridView) {
            leaf.view.setSource(mode, path);
        }

        // 確保視圖是活躍的
        workspace.revealLeaf(leaf);
    }
}