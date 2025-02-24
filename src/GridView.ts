import { App, WorkspaceLeaf, ItemView, Modal, TFolder, TFile, Menu, Notice, Setting} from 'obsidian';
import { setIcon, getFrontMatterInfo } from 'obsidian';
import GridExplorerPlugin from '../main';
import { showFolderSelectionModal } from './FolderSelectionModal';
import { findFirstImageInNote } from './mediaUtils';
import { t } from './translations';

// 定義網格視圖
export class GridView extends ItemView {
    plugin: GridExplorerPlugin;
    sourceMode: string;
    sourcePath: string;
    sortType: string;
    searchQuery: string;

    constructor(leaf: WorkspaceLeaf, plugin: GridExplorerPlugin) {
        super(leaf);
        this.plugin = plugin;
        this.containerEl.addClass('ge-grid-view-container');
        this.sourceMode = ''; // 預設為書籤模式
        this.sourcePath = ''; // 用於資料夾模式的路徑
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
        } else {
            return '';
        }
    }

    setSource(mode: string, path = '') {
        this.sourceMode = mode;
        this.sourcePath = path;
        this.render();
        // 通知 Obsidian 保存視圖狀態
        this.app.workspace.requestSaveLayout();
    }

    async getFiles(): Promise<TFile[]> {
        if (this.sourceMode === 'folder' && this.sourcePath) {
            // 獲取指定資料夾內的所有 Markdown 檔案
            const folder = this.app.vault.getAbstractFileByPath(this.sourcePath);
            if (folder instanceof TFolder) {
                // 只取得當前資料夾中的 Markdown 檔案，不包含子資料夾
                const files = folder.children.filter((file): file is TFile => file instanceof TFile && file.extension === 'md');
                return this.sortFiles(files);
            }
            return [];
        } else if (this.sourceMode === 'search') {
            // 搜尋模式：使用 Obsidian 的搜尋功能
            const globalSearchPlugin = (this.app as any).internalPlugins.getPluginById('global-search');
            if (globalSearchPlugin?.instance) {
                const searchLeaf = (this.app as any).workspace.getLeavesOfType('search')[0];
                if (searchLeaf && searchLeaf.view && searchLeaf.view.dom) {
                    const resultDomLookup = searchLeaf.view.dom.resultDomLookup;
                    if (resultDomLookup) {
                        const files = Array.from(resultDomLookup.keys())
                        .filter((file): file is TFile => file instanceof TFile && file.extension === 'md');
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
                    const sourceFile = this.app.vault.getAbstractFileByPath(sourcePath) as TFile;
                    if (sourceFile && sourceFile.extension === 'md') {
                        backlinks.add(sourceFile);
                    }
                }
            }

            return this.sortFiles(this.ignoredFiles(Array.from(backlinks) as TFile[]));
        } else if(this.sourceMode === 'bookmarks') {
            // 書籤模式
            const bookmarksPlugin = (this.app as any).internalPlugins.plugins.bookmarks;
            if (!bookmarksPlugin?.enabled) {
                return [];
            }

            const bookmarks = bookmarksPlugin.instance.items;
            const bookmarkedFiles = new Set();
            
            const processBookmarkItem = (item: any) => {
                if (item.type === 'file') {
                    const file = this.app.vault.getAbstractFileByPath(item.path);
                    if (file instanceof TFile && file.extension === 'md') {
                        bookmarkedFiles.add(file);
                    }
                } else if (item.type === 'group' && item.items) {
                    item.items.forEach(processBookmarkItem);
                }
            };
            
            bookmarks.forEach(processBookmarkItem);
            return Array.from(bookmarkedFiles) as TFile[];
        } else if (this.sourceMode === 'all-notes') {
            // 所有筆記模式
            const allNotes = this.app.vault.getMarkdownFiles()
            return this.sortFiles(allNotes);
        } else {
            return [];
        }
    }

        //排序檔案
    sortFiles(files: TFile[]) {
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
        } else {
            return files;
        }
    }

    //忽略檔案
    ignoredFiles(files: TFile[]) {
        return files.filter(file => 
            !this.plugin.settings.ignoredFolders.some((folder => 
                file.path.startsWith(`${folder}/`)
            )
        ));
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
            showFolderSelectionModal(this.app, this.plugin, this);
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
        (this.leaf as any).updateHeader();

        // 恢復捲動位置
        if (scrollContainer) {
            contentEl.scrollTop = scrollTop;
        }
    }

    async grid_render() {
        const container = this.containerEl.children[1] as HTMLElement;
        container.empty();
        container.addClass('ge-grid-container');
        container.style.setProperty('--grid-item-width', this.plugin.settings.gridItemWidth + 'px');
        container.style.setProperty('--image-area-width', this.plugin.settings.imageAreaWidth + 'px');
        container.style.setProperty('--image-area-height', this.plugin.settings.imageAreaHeight + 'px');

        // 如果是書籤模式且書籤插件未啟用，顯示提示
        if (this.sourceMode === 'bookmarks' && !(this.app as any).internalPlugins.plugins.bookmarks?.enabled) {
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
                    const titleEl = contentArea.createEl('span', { text: `📁 ${folder.name}` });
                    
                    // 點擊時進入子資料夾
                    folderEl.addEventListener('click', () => {
                        this.setSource('folder', folder.path);
                    });
                }
            }
        }

        let files: TFile[] = [];
        if (this.searchQuery) {
            // 顯示搜尋中的提示
            const loadingDiv = container.createDiv('ge-loading-indicator');
            loadingDiv.setText(t('searching'));
            
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
            
            // 移除搜尋中的提示
            loadingDiv.remove();
        } else {
            // 獲取檔案列表並根據搜尋關鍵字過濾
            files = await this.getFiles();
        }

        //忽略檔案
        files = this.ignoredFiles(files)

        // 如果沒有檔案，顯示提示訊息
        if (files.length === 0) {
            const noFilesDiv = container.createDiv('ge-no-files');
            noFilesDiv.setText(t('no_files'));
            if (this.plugin.statusBarItem) {
                this.plugin.statusBarItem.setText('');
            }
            return;
        }

        // 創建 Intersection Observer
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(async entry => {
                if (entry.isIntersecting) {
                    const noteEl = entry.target as HTMLElement; 
                    const filePath = noteEl.dataset.filePath;
                    if (!filePath) return;

                    const file = this.app.vault.getAbstractFileByPath(filePath);
                    if (!(file instanceof TFile)) return;

                    // 載入預覽內容
                    const contentArea = noteEl.querySelector('.ge-content-area') as Element;
                    if (!contentArea.hasAttribute('data-loaded')) {
                        const content = await this.app.vault.cachedRead(file);
                        const frontMatterInfo = getFrontMatterInfo(content);
                        const contentWithoutFrontmatter = content.substring(frontMatterInfo.contentStart);
                        const contentWithoutMediaLinks = contentWithoutFrontmatter.replace(/`{3}[\s\S]*?`{3}|<!--[\s\S]*?-->|(!?\[([^\]]*)\]\(([^)]+)\))|!?\[\[([^\]]+)\]\]/g, '');
                        // 只取前100個字符作為預覽
                        const preview = contentWithoutMediaLinks.slice(0, 100) + (contentWithoutMediaLinks.length > 100 ? '...' : '');
                        
                        // 創建預覽內容
                        const contentEl = contentArea.createEl('p', { text: preview.trim() });
                        contentArea.setAttribute('data-loaded', 'true');
                    }
                    
                    // 載入圖片
                    const imageArea = noteEl.querySelector('.ge-image-area');
                    if (imageArea && !imageArea.hasAttribute('data-loaded')) {
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
            noteEl.dataset.filePath = file.path;
            
            // 創建左側內容區，但先只放標題
            const contentArea = noteEl.createDiv('ge-content-area');
            
            // 創建標題（立即載入）
            const titleEl = contentArea.createEl('span', { text: file.basename });
            
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
            gridView: GridView;
            defaultQuery: string;
            constructor(app: App, gridView: GridView, defaultQuery: string) {
                super(app);
                this.gridView = gridView;
                this.defaultQuery = defaultQuery;
            }

            onOpen() {
                const { contentEl } = this;
                contentEl.empty();
                new Setting(contentEl).setName(t('search')).setHeading();

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
    async setState(state: any): Promise<void> {  
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
        this.registerEvent(
            this.app.vault.on('create', (file) => {
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

        this.registerEvent(
            this.app.vault.on('delete', (file) => {
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
            (this.app as any).internalPlugins.plugins.bookmarks.instance.on('changed', () => {
                if (this.sourceMode === 'bookmarks') {
                    this.render();
                }
            })
        );
    }
}