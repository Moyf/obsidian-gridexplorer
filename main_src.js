const { Plugin, ItemView, TFolder, Setting, Menu, setIcon } = require('obsidian');

// 語系檔案
const TRANSLATIONS = {
    'zh-TW': {
        // 通知訊息
        'BOOKMARKS_PLUGIN_DISABLED': '請先啟用書籤插件',

        // 按鈕和標籤
        'SORTING': '排序方式',
        'REFRESH': '重新整理',
        'RESELECT_FOLDER': '重新選擇位置',
        'GO_UP': '回上層資料夾',
        'NO_BACKLINKS': '沒有反向連結',

        // 視圖標題
        'GRID_VIEW_TITLE': '網格視圖',
        'BOOKMARKS_MODE': '書籤',
        'FOLDER_MODE': '資料夾',
        'SEARCH_RESULTS': '搜尋結果',
        'BACKLINKS_MODE': '反向連結',

        // 排序選項
        'SORT_NAME_ASC': '名稱 (A → Z)',
        'SORT_NAME_DESC': '名稱 (Z → A)',
        'SORT_MTIME_DESC': '修改時間 (新 → 舊)',
        'SORT_MTIME_ASC': '修改時間 (舊 → 新)',
        'SORT_CTIME_DESC': '建立時間 (新 → 舊)',
        'SORT_CTIME_ASC': '建立時間 (舊 → 新)',
        'SORT_RANDOM': '隨機排序',

        // 設定
        'GRID_VIEW_SETTINGS': '網格視圖設定',
        'IGNORED_FOLDERS': '忽略的資料夾',
        'IGNORED_FOLDERS_DESC': '在這裡設定不要出現在資料夾選擇器中的資料夾（每行一個資料夾路徑）',
        'IGNORED_FOLDERS_PLACEHOLDER': '範例：\n.obsidian\nTemplates',
        'DEFAULT_SORT_TYPE': '預設排序模式',
        'DEFAULT_SORT_TYPE_DESC': '設定開啟網格視圖時的預設排序方式',
        'GRID_ITEM_WIDTH': '網格項目寬度',
        'GRID_ITEM_WIDTH_DESC': '設定網格項目的寬度',
        'IMAGE_AREA_WIDTH': '圖片區域寬度',
        'IMAGE_AREA_WIDTH_DESC': '設定圖片預覽區域的寬度',
        'IMAGE_AREA_HEIGHT': '圖片區域高度',
        'IMAGE_AREA_HEIGHT_DESC': '設定圖片預覽區域的高度',

        // 選擇資料夾對話框
        'SELECT_FOLDERS': '選擇資料夾',
        'OPEN_GRID_VIEW': '開啟網格視圖',
        'OPEN_IN_GRID_VIEW': '在網格視圖中開啟',
    },
    'en': {
        // Notifications
        'BOOKMARKS_PLUGIN_DISABLED': 'Please enable the Bookmarks plugin first',

        // Buttons and Labels
        'SORTING': 'Sort by',
        'REFRESH': 'Refresh',
        'RESELECT_FOLDER': 'Reselect Folder',
        'GO_UP': 'Go Up',
        'NO_BACKLINKS': 'No Backlinks',

        // View Titles
        'GRID_VIEW_TITLE': 'Grid View',
        'BOOKMARKS_MODE': 'Bookmarks',
        'FOLDER_MODE': 'Folder',
        'SEARCH_RESULTS': 'Search Results',
        'BACKLINKS_MODE': 'Backlinks',

        // Sort Options
        'SORT_NAME_ASC': 'Name (A → Z)',
        'SORT_NAME_DESC': 'Name (Z → A)',
        'SORT_MTIME_DESC': 'Modified Time (New → Old)',
        'SORT_MTIME_ASC': 'Modified Time (Old → New)',
        'SORT_CTIME_DESC': 'Created Time (New → Old)',
        'SORT_CTIME_ASC': 'Created Time (Old → New)',
        'SORT_RANDOM': 'Random',

        // Settings
        'GRID_VIEW_SETTINGS': 'Grid View Settings',
        'IGNORED_FOLDERS': 'Ignored Folders',
        'IGNORED_FOLDERS_DESC': 'Set folders to be excluded from the folder selector (one path per line)',
        'IGNORED_FOLDERS_PLACEHOLDER': 'Example:\n.obsidian\nTemplates',
        'DEFAULT_SORT_TYPE': 'Default Sort Type',
        'DEFAULT_SORT_TYPE_DESC': 'Set the default sorting method when opening Grid View',
        'GRID_ITEM_WIDTH': 'Grid Item Width',
        'GRID_ITEM_WIDTH_DESC': 'Set the width of grid items',
        'IMAGE_AREA_WIDTH': 'Image Area Width',
        'IMAGE_AREA_WIDTH_DESC': 'Set the width of the image preview area',
        'IMAGE_AREA_HEIGHT': 'Image Area Height',
        'IMAGE_AREA_HEIGHT_DESC': 'Set the height of the image preview area',

        // Folder Selection Dialog
        'SELECT_FOLDERS': 'Select Folder',
        'OPEN_GRID_VIEW': 'Open Grid View',
        'OPEN_IN_GRID_VIEW': 'Open in Grid View',
    },
    'zh': {
        // 通知信息
        'BOOKMARKS_PLUGIN_DISABLED': '请先启用书签插件',

        // 按钮和标签
        'SORTING': '排序方式',
        'REFRESH': '重新整理',
        'RESELECT_FOLDER': '重新选择位置',
        'GO_UP': '回上层文件夹',
        'NO_BACKLINKS': '没有反向链接',

        // 视图标题
        'GRID_VIEW_TITLE': '网格视图',
        'BOOKMARKS_MODE': '书签',
        'FOLDER_MODE': '文件夹',
        'SEARCH_RESULTS': '搜索结果',
        'BACKLINKS_MODE': '反向链接',

        // 排序选项
        'SORT_NAME_ASC': '名称 (A → Z)',
        'SORT_NAME_DESC': '名称 (Z → A)',
        'SORT_MTIME_DESC': '修改时间 (新 → 旧)',
        'SORT_MTIME_ASC': '修改时间 (旧 → 新)',
        'SORT_CTIME_DESC': '建立时间 (新 → 旧)',
        'SORT_CTIME_ASC': '建立时间 (旧 → 新)',
        'SORT_RANDOM': '随机排序',

        // 设置
        'GRID_VIEW_SETTINGS': '网格视图设置',
        'IGNORED_FOLDERS': '忽略的文件夹',
        'IGNORED_FOLDERS_DESC': '在這裡设置不要出现在文件夹选择器中的文件夹（每行一个文件夹路径）',
        'IGNORED_FOLDERS_PLACEHOLDER': '範例：\n.obsidian\nTemplates',
        'DEFAULT_SORT_TYPE': '預设排序模式',
        'DEFAULT_SORT_TYPE_DESC': '设置开启网格视图时的預设排序方式',
        'GRID_ITEM_WIDTH': '网格项目宽度',
        'GRID_ITEM_WIDTH_DESC': '设置网格项目的宽度',
        'IMAGE_AREA_WIDTH': '圖片區域寬度',
        'IMAGE_AREA_WIDTH_DESC': '设置圖片預覽區域的寬度',
        'IMAGE_AREA_HEIGHT': '圖片區域高度',
        'IMAGE_AREA_HEIGHT_DESC': '设置圖片預覽區域的高度',

        // 选择资料夹对话框
        'SELECT_FOLDERS': '选择文件夹',
        'OPEN_GRID_VIEW': '开启网格视图',
        'OPEN_IN_GRID_VIEW': '在网格视图中开启',
    },
    'ja': {
        // 通知メッジ
        'BOOKMARKS_PLUGIN_DISABLED': 'ブックマークプラグインを有効にしてください',

        // ボタンとラベル
        'SORTING': 'ソート',
        'REFRESH': 'リフレッシュ',
        'RESELECT_FOLDER': 'フォルダを再選択',
        'GO_UP': '上へ',
        'NO_BACKLINKS': 'バックリンクはありません',

        // ビュータイトル
        'GRID_VIEW_TITLE': 'グリッドビュー',
        'BOOKMARKS_MODE': 'ブックマーク',
        'FOLDER_MODE': 'フォルダ',
        'SEARCH_RESULTS': '検索結果',
        'BACKLINKS_MODE': 'バックリンク',

        // ソートオプション
        'SORT_NAME_ASC': '名前 (A → Z)',
        'SORT_NAME_DESC': '名前 (Z → A)',
        'SORT_MTIME_DESC': '変更時間 (新 → 旧)',
        'SORT_MTIME_ASC': '変更時間 (旧 → 新)',
        'SORT_CTIME_DESC': '作成時間 (新 → 旧)',
        'SORT_CTIME_ASC': '作成時間 (旧 → 新)',
        'SORT_RANDOM': 'ランダム',

        // 設定
        'GRID_VIEW_SETTINGS': 'グリッドビューセッティング',
        'IGNORED_FOLDERS': '無視するフォルダ',
        'IGNORED_FOLDERS_DESC': 'フォルダ選択器から除外するフォルダを設定します (1 行に 1 つのフォルダパス)',
        'IGNORED_FOLDERS_PLACEHOLDER': '例：\n.obsidian\nTemplates',
        'DEFAULT_SORT_TYPE': 'デフォルトのソートタイプ',
        'DEFAULT_SORT_TYPE_DESC': 'グリッドビューを開くときのデフォルトのソート方法を設定します',
        'GRID_ITEM_WIDTH': 'グリッドアイテムの幅',
        'GRID_ITEM_WIDTH_DESC': 'グリッドアイテムの幅を設定します',
        'IMAGE_AREA_WIDTH': '画像エリア幅',
        'IMAGE_AREA_WIDTH_DESC': '画像プレビュー領域の幅を設定します',
        'IMAGE_AREA_HEIGHT': '画像エリア高さ',
        'IMAGE_AREA_HEIGHT_DESC': '画像プレビュー領域の高さを設定します',

        // フォルダ選択ダイアログ
        'SELECT_FOLDERS': 'フォルダを選択',
        'OPEN_GRID_VIEW': 'グリッドビューを開く',
        'OPEN_IN_GRID_VIEW': 'グリッドビューで開く',
    },
};

// 全域翻譯函式
function t(key) {
    const langSetting = window.localStorage.getItem('language');
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
        const url = markdownMatch[2];
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
        const content = await app.vault.read(file);
        let firstImage = null;
        let firstImagePosition = Infinity;
        
        // 檢查 ![[image.jpg]] 格式
        const internalMatch = content.match(/!\[\[(.*?\.(?:jpg|jpeg|png|gif|webp))\]\]/i);
        if (internalMatch) {
            firstImage = internalMatch[0];
            firstImagePosition = content.indexOf(internalMatch[0]);
        }
        
        // 檢查 ![alt](path) 格式，支援一般路徑和帶 format 參數的 URL
        const markdownMatch = content.match(/!\[.*?\]\((.*?(?:\.(?:jpg|jpeg|png|gif|webp)|format=(?:jpg|jpeg|png|gif|webp)).*?)\)/i);
        if (markdownMatch) {
            const markdownPosition = content.indexOf(markdownMatch[0]);
            if (markdownPosition < firstImagePosition) {
                firstImage = markdownMatch[0];
                firstImagePosition = markdownPosition;
            }
        }
        
        if (firstImage) {
            return processMediaLink(app, firstImage);
        }
        
        return null;
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
        this.containerEl.addClass('grid-view-container');
        this.sourceMode = ''; // 預設為書籤模式
        this.sourcePath = null; // 用於資料夾模式的路徑
        this.sortType = this.plugin.settings.defaultSortType; // 使用設定中的預設排序模式
    }

    getViewType() {
        return 'grid-view';
    }

    getIcon() {
        return 'grid';
    }

    getDisplayText() {
        if (this.sourceMode === '') {
            return t('GRID_VIEW_TITLE');
        } else if (this.sourceMode === 'bookmarks') {
            return t('BOOKMARKS_MODE');
        } else if (this.sourceMode === 'folder') {
            return this.sourcePath;
        } else if (this.sourceMode === 'search') {
            return t('SEARCH_RESULTS');
        } else if (this.sourceMode === 'backlinks') {
            return t('BACKLINKS_MODE');
        }
    }

    async getFiles() {
        if (this.sourceMode === 'folder' && this.sourcePath) {
            // 獲取指定資料夾內的所有 Markdown 檔案
            const folder = this.app.vault.getAbstractFileByPath(this.sourcePath);
            if (folder instanceof TFolder) {
                // 只取得當前資料夾中的 Markdown 檔案，不包含子資料夾
                const files = folder.children
                    .filter(file => file.extension === 'md')
                    .sort((a, b) => {
                        if (this.sortType === 'name-asc') {
                            return a.basename.localeCompare(b.basename);
                        } else if (this.sortType === 'name-desc') {
                            return b.basename.localeCompare(a.basename);
                        } else if (this.sortType === 'mtime-desc') {
                            return b.stat.mtime - a.stat.mtime;
                        } else if (this.sortType === 'mtime-asc') {
                            return a.stat.mtime - b.stat.mtime;
                        } else if (this.sortType === 'ctime-desc') {
                            return b.stat.ctime - a.stat.ctime;
                        } else if (this.sortType === 'ctime-asc') {
                            return a.stat.ctime - b.stat.ctime;
                        } else if (this.sortType === 'random') {
                            return Math.random() - 0.5;
                        }
                    });
                return files;
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
                        return Array.from(resultDomLookup.keys())
                            .filter(file => file.extension === 'md')
                            .sort((a, b) => {
                                if (this.sortType === 'name-asc') {
                                    return a.basename.localeCompare(b.basename);
                                } else if (this.sortType === 'name-desc') {
                                    return b.basename.localeCompare(a.basename);
                                } else if (this.sortType === 'mtime-desc') {
                                    return b.stat.mtime - a.stat.mtime;
                                } else if (this.sortType === 'mtime-asc') {
                                    return a.stat.mtime - b.stat.mtime;
                                } else if (this.sortType === 'ctime-desc') {
                                    return b.stat.ctime - a.stat.ctime;
                                } else if (this.sortType === 'ctime-asc') {
                                    return a.stat.ctime - b.stat.ctime;
                                } else if (this.sortType === 'random') {
                                    return Math.random() - 0.5;
                                }
                            });
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

            return Array.from(backlinks).sort((a, b) => {
                if (this.sortType === 'name-asc') {
                    return a.basename.localeCompare(b.basename);
                } else if (this.sortType === 'name-desc') {
                    return b.basename.localeCompare(a.basename);
                } else if (this.sortType === 'mtime-desc') {
                    return b.stat.mtime - a.stat.mtime;
                } else if (this.sortType === 'mtime-asc') {
                    return a.stat.mtime - b.stat.mtime;
                } else if (this.sortType === 'ctime-desc') {
                    return b.stat.ctime - a.stat.ctime;
                } else if (this.sortType === 'ctime-asc') {
                    return a.stat.ctime - b.stat.ctime;
                } else if (this.sortType === 'random') {
                    return Math.random() - 0.5;
                }
            });
        } else {
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
        }
    }

    setSource(mode, path = null) {
        this.sourceMode = mode;
        this.sourcePath = path;
        this.render();
    }

    async render() {
        // 儲存當前捲動位置
        const scrollContainer = this.containerEl.querySelector('.view-content');
        const scrollTop = scrollContainer ? scrollContainer.scrollTop : 0;

        // 清空整個容器
        this.containerEl.empty();

        // 創建頂部按鈕區域
        const headerButtonsDiv = this.containerEl.createDiv('header-buttons');

        // 添加回上層按鈕（僅在資料夾模式且不在根目錄時顯示）
        if (this.sourceMode === 'folder' && this.sourcePath !== '/') {
            const upButton = headerButtonsDiv.createEl('button', { attr: { 'aria-label': t('GO_UP') } });
            upButton.addEventListener('click', () => {
                const parentPath = this.sourcePath.split('/').slice(0, -1).join('/') || '/';
                this.setSource('folder', parentPath);
            });
            setIcon(upButton, 'arrow-up');
        }
        
        // 添加重新整理按鈕
        const refreshButton = headerButtonsDiv.createEl('button', { attr: { 'aria-label': t('REFRESH') }  });
        refreshButton.addEventListener('click', () => {
            this.render();
        });
        setIcon(refreshButton, 'refresh-ccw');

        // 添加重新選擇資料夾按鈕
        const reselectButton = headerButtonsDiv.createEl('button', { attr: { 'aria-label': t('RESELECT_FOLDER') }  });
        reselectButton.addEventListener('click', () => {
            showFolderSelectionModal(this.app, this.plugin, this);
        });
        setIcon(reselectButton, "folder");

        // 添加排序按鈕
        if (this.sourceMode !== 'bookmarks') {
            const sortButton = headerButtonsDiv.createEl('button', { attr: { 'aria-label': t('SORTING') }  });
            sortButton.addEventListener('click', (evt) => {
                const menu = new Menu();
                const sortOptions = [
                    { value: 'name-asc', label: t('SORT_NAME_ASC'), icon: 'a-arrow-up' },
                    { value: 'name-desc', label: t('SORT_NAME_DESC'), icon: 'a-arrow-down' },
                    { value: 'mtime-desc', label: t('SORT_MTIME_DESC'), icon: 'clock' },
                    { value: 'mtime-asc', label: t('SORT_MTIME_ASC'), icon: 'clock' },
                    { value: 'ctime-desc', label: t('SORT_CTIME_DESC'), icon: 'calendar' },
                    { value: 'ctime-asc', label: t('SORT_CTIME_ASC'), icon: 'calendar' },
                    { value: 'random', label: t('SORT_RANDOM'), icon: 'dice' },
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
                            });
                    });
                });
                menu.showAtMouseEvent(evt);
            });
            setIcon(sortButton, 'arrow-down-up');
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
        container.addClass('grid-container');
        container.style.setProperty('--grid-item-width', this.plugin.settings.gridItemWidth + 'px');
        container.style.setProperty('--image-area-width', this.plugin.settings.imageAreaWidth + 'px');
        container.style.setProperty('--image-area-height', this.plugin.settings.imageAreaHeight + 'px');

        // 如果是書籤模式且書籤插件未啟用，顯示提示
        if (this.sourceMode === 'bookmarks' && !this.app.internalPlugins.plugins.bookmarks?.enabled) {
            new Notice(t(t('BOOKMARKS_PLUGIN_DISABLED')));
            return;
        }

        // 如果是反向連結模式，但沒有活動中的檔案
        if (this.sourceMode === 'backlinks' && !this.app.workspace.getActiveFile()) {
            new Notice(t(t(t('NO_BACKLINKS'))));
            return;
        }

        // 如果是資料夾模式，先顯示所有子資料夾
        if (this.sourceMode === 'folder') {
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
                    const folderEl = container.createDiv('grid-item folder-item');
                    
                    const contentArea = folderEl.createDiv('content-area');
                    const titleEl = contentArea.createEl('h3');
                    titleEl.textContent = `📁 ${folder.name}`;
                    
                    // 點擊時進入子資料夾
                    folderEl.addEventListener('click', () => {
                        this.setSource('folder', folder.path);
                    });
                }
            }
        }

        // 獲取檔案列表
        const files = await this.getFiles();

        // 創建 Intersection Observer
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(async entry => {
                if (entry.isIntersecting) {
                    const noteEl = entry.target;
                    const file = noteEl.file;
                    
                    // 載入預覽內容
                    const contentArea = noteEl.querySelector('.content-area');
                    if (!contentArea.hasAttribute('data-loaded')) {
                        const content = await this.app.vault.cachedRead(file);
                        // 移除 frontmatter 區域，並移除內部連結和圖片連結
                        const contentWithoutFrontmatter = content.replace(/^---\n[\s\S]*?\n---\n|`{3}[\s\S]*?`{3}|<!--[\s\S]*?-->|(!?\[([^\]]*)\]\(([^)]+)\))|!?\[\[([^\]]+)\]\]/g, '')
                            .replace('年齡：`=date(today) - date(this.birthday)`','');
                        // 只取前100個字符作為預覽
                        const preview = contentWithoutFrontmatter.slice(0, 100) + (contentWithoutFrontmatter.length > 100 ? '...' : '');
                        
                        // 創建預覽內容
                        const contentEl = contentArea.createEl('p', { text: preview });
                        contentArea.setAttribute('data-loaded', 'true');
                    }
                    
                    // 載入圖片
                    const imageArea = noteEl.querySelector('.image-area');
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
            const noteEl = container.createDiv('grid-item');
            noteEl.file = file; // 儲存檔案引用以供後續使用
            
            // 創建左側內容區，但先只放標題
            const contentArea = noteEl.createDiv('content-area');
            
            // 創建標題（立即載入）
            const titleEl = contentArea.createEl('h3', { text: file.basename });
            
            // 創建圖片區域，但先不載入圖片
            const imageArea = noteEl.createDiv('image-area');
            
            // 開始觀察這個筆記元素
            observer.observe(noteEl);
            
            // 點擊時開啟筆記
            noteEl.addEventListener('click', () => {
                this.app.workspace.getLeaf().openFile(file);
            });
        }
    }

    // 保存視圖狀態
    getState() {
        return {
            type: 'grid-view',
            state: {
                sourceMode: this.sourceMode,
                sourcePath: this.sourcePath,
                sortType: this.sortType
            }
        };
    }

    // 讀取視圖狀態
    setState(state) {
        if (state.state) {
            this.sourceMode = state.state.sourceMode || '';
            this.sourcePath = state.state.sourcePath || null;
            this.sortType = state.state.sortType || 'mtime-desc';
            this.render();
        }
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
class GridExplorerSettingTab extends require('obsidian').PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: t('GRID_VIEW_SETTINGS') });

        // 忽略的資料夾設定
        new Setting(containerEl)
            .setName(t('IGNORED_FOLDERS'))
            .setDesc(t('IGNORED_FOLDERS_DESC'))
            .addTextArea(text => text
                .setPlaceholder(t('IGNORED_FOLDERS_PLACEHOLDER'))
                .setValue(this.plugin.settings.ignoredFolders.join('\n'))
                .onChange(async (value) => {
                    // 將文字區域的內容轉換為陣列，並過濾掉空行
                    this.plugin.settings.ignoredFolders = value
                        .split('\n')
                        .map(folder => folder.trim())
                        .filter(folder => folder.length > 0);
                    await this.plugin.saveSettings();
                }));

        // 預設排序模式設定
        new Setting(containerEl)
            .setName(t('DEFAULT_SORT_TYPE'))
            .setDesc(t('DEFAULT_SORT_TYPE_DESC'))
            .addDropdown(dropdown => dropdown
                .addOption('name-asc', t('SORT_NAME_ASC'))
                .addOption('name-desc', t('SORT_NAME_DESC'))
                .addOption('mtime-desc', t('SORT_MTIME_DESC'))
                .addOption('mtime-asc', t('SORT_MTIME_ASC'))
                .addOption('ctime-desc', t('SORT_CTIME_DESC'))
                .addOption('ctime-asc', t('SORT_CTIME_ASC'))
                .addOption('random', t('SORT_RANDOM'))
                .setValue(this.plugin.settings.defaultSortType)
                .onChange(async (value) => {
                    this.plugin.settings.defaultSortType = value;
                    await this.plugin.saveSettings();
                }));

        // 網格項目寬度設定
        new Setting(containerEl)
            .setName(t('GRID_ITEM_WIDTH'))
            .setDesc(t('GRID_ITEM_WIDTH_DESC'))
            .addSlider(slider => slider
                .setLimits(200, 500, 50)
                .setValue(this.plugin.settings.gridItemWidth)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.gridItemWidth = value;
                    await this.plugin.saveSettings();
                }));

        // 圖片區域寬度設定
        new Setting(containerEl)
            .setName(t('IMAGE_AREA_WIDTH'))
            .setDesc(t('IMAGE_AREA_WIDTH_DESC'))
            .addSlider(slider => slider
                .setLimits(50, 200, 10)
                .setValue(this.plugin.settings.imageAreaWidth)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.imageAreaWidth = value;
                    await this.plugin.saveSettings();
                }));

        // 圖片區域高度設定
        new Setting(containerEl)
            .setName(t('IMAGE_AREA_HEIGHT'))
            .setDesc(t('IMAGE_AREA_HEIGHT_DESC'))
            .addSlider(slider => slider
                .setLimits(50, 200, 10)
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
    const { Modal, TFolder } = require('obsidian');

    class FolderSelectionModal extends Modal {
        constructor(app, plugin, activeView) {
            super(app);
            this.plugin = plugin;
            this.activeView = activeView;
        }

        onOpen() {
            const { contentEl } = this;
            contentEl.empty();
            contentEl.createEl('h2', { text: t('SELECT_FOLDERS') });

            // 建立書籤選項
            const bookmarksPlugin = this.app.internalPlugins.plugins.bookmarks;
            if (bookmarksPlugin?.enabled) {
                const bookmarkOption = contentEl.createEl('div', {
                    cls: 'grid-view-folder-option',
                    text: `📑 ${t('BOOKMARKS_MODE')}`
                });
                bookmarkOption.style.cursor = 'pointer';
                bookmarkOption.style.padding = '8px';
                bookmarkOption.style.marginBottom = '8px';
                bookmarkOption.style.border = '1px solid var(--background-modifier-border)';
                bookmarkOption.style.borderRadius = '4px';

                bookmarkOption.addEventListener('click', () => {
                    if (this.activeView) {
                        this.activeView.setSource('bookmarks');
                    } else {
                        this.plugin.activateView('bookmarks');
                    }
                    this.close();
                });

                bookmarkOption.addEventListener('mouseenter', () => {
                    bookmarkOption.style.backgroundColor = 'var(--background-modifier-hover)';
                });

                bookmarkOption.addEventListener('mouseleave', () => {
                    bookmarkOption.style.backgroundColor = '';
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
                            cls: 'grid-view-folder-option',
                            text: `🔍 ${t('SEARCH_RESULTS')}: ${searchInput.value}`
                        });
                        searchOption.style.cursor = 'pointer';
                        searchOption.style.padding = '8px';
                        searchOption.style.marginBottom = '8px';
                        searchOption.style.border = '1px solid var(--background-modifier-border)';
                        searchOption.style.borderRadius = '4px';

                        searchOption.addEventListener('click', () => {
                            if (this.activeView) {
                                this.activeView.setSource('search');
                            } else {
                                this.plugin.activateView('search');
                            }
                            this.close();
                        });

                        searchOption.addEventListener('mouseenter', () => {
                            searchOption.style.backgroundColor = 'var(--background-modifier-hover)';
                        });

                        searchOption.addEventListener('mouseleave', () => {
                            searchOption.style.backgroundColor = '';
                        });
                    }
                }
            }

            // 建立反向連結選項
            const activeFile = this.app.workspace.getActiveFile();
            if (activeFile) {
                const activeFileName = activeFile ? `: ${activeFile.basename}` : '';
                const backlinksOption = contentEl.createEl('div', {
                    cls: 'grid-view-folder-option',
                    text: `🔗 ${t('BACKLINKS_MODE')}${activeFileName}`
                });
                backlinksOption.style.cursor = 'pointer';
                backlinksOption.style.padding = '8px';
                backlinksOption.style.marginBottom = '8px';
                backlinksOption.style.border = '1px solid var(--background-modifier-border)';
                backlinksOption.style.borderRadius = '4px';

                backlinksOption.addEventListener('click', () => {
                    if (this.activeView) {
                        this.activeView.setSource('backlinks');
                    } else {
                        this.plugin.activateView('backlinks');
                    }
                    this.close();
                });

                backlinksOption.addEventListener('mouseenter', () => {
                    backlinksOption.style.backgroundColor = 'var(--background-modifier-hover)';
                });

                backlinksOption.addEventListener('mouseleave', () => {
                    backlinksOption.style.backgroundColor = '';
                });
            }

            // 取得所有資料夾（排除被忽略的資料夾）
            const folders = app.vault.getAllLoadedFiles()
                .filter(file => {
                    if (!(file instanceof TFolder)) return false;
                    // 檢查資料夾是否在忽略清單中
                    return !this.plugin.settings.ignoredFolders.some(
                        ignoredPath => file.path === ignoredPath || file.path.startsWith(ignoredPath + '/')
                    );
                })
                .sort((a, b) => a.path.localeCompare(b.path));

            // 建立資料夾選項
            folders.forEach(folder => {
                const folderOption = contentEl.createEl('div', {
                    cls: 'grid-view-folder-option',
                    text: `📁 ${folder.path || '/'}`
                });
                folderOption.style.cursor = 'pointer';
                folderOption.style.padding = '8px';
                folderOption.style.marginBottom = '8px';
                folderOption.style.border = '1px solid var(--background-modifier-border)';
                folderOption.style.borderRadius = '4px';

                folderOption.addEventListener('click', () => {
                    if (this.activeView) {
                        this.activeView.setSource('folder', folder.path);
                    } else {
                        this.plugin.activateView('folder', folder.path);
                    }
                    this.close();
                });

                folderOption.addEventListener('mouseenter', () => {
                    folderOption.style.backgroundColor = 'var(--background-modifier-hover)';
                });

                folderOption.addEventListener('mouseleave', () => {
                    folderOption.style.backgroundColor = '';
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
            name: t('OPEN_GRID_VIEW'),
            callback: () => {
                showFolderSelectionModal(this.app, this);
            }
        });

        this.addRibbonIcon('grid', t('OPEN_GRID_VIEW'), () => {
            showFolderSelectionModal(this.app, this);
        });

        // 註冊設定頁面
        this.addSettingTab(new GridExplorerSettingTab(this.app, this));

        // 註冊資料夾的右鍵選單
        this.registerEvent(
            this.app.workspace.on('file-menu', (menu, file) => {
                if (file instanceof TFolder) {
                    menu.addItem((item) => {
                        item
                        .setTitle(t('OPEN_IN_GRID_VIEW'))
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
        this.app.workspace.detachLeavesOfType('grid-view');
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