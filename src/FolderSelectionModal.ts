import { App, Modal, Setting } from 'obsidian';
import GridExplorerPlugin from '../main';
import { GridView } from './GridView';
import { t } from './translations';

// 顯示資料夾選擇 modal
export function showFolderSelectionModal(app: App, plugin: GridExplorerPlugin, activeView?: GridView) {
    new FolderSelectionModal(app, plugin, activeView).open();
}

export class FolderSelectionModal extends Modal {
    plugin: GridExplorerPlugin;
    activeView: GridView | undefined;
    constructor(app: App, plugin: GridExplorerPlugin, activeView?: GridView) {
        super(app);
        this.plugin = plugin;
        this.activeView = activeView;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        new Setting(contentEl).setName(t('select_folders')).setHeading();

        // 建立書籤選項
        const bookmarksPlugin = (this.app as any).internalPlugins.plugins.bookmarks;
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
        const searchLeaf = (this.app as any).workspace.getLeavesOfType('search')[0];
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
        const folders = this.app.vault.getAllFolders()
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
