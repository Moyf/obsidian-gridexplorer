import { Plugin, TFolder, TFile } from 'obsidian';
import { GridView } from './src/GridView';
import { showFolderSelectionModal } from './src/FolderSelectionModal';
import { GallerySettings, DEFAULT_SETTINGS, GridExplorerSettingTab } from './src/settings';
import { t } from './src/translations';

// 插件類型定義
export default class GridExplorerPlugin extends Plugin {
    settings: GallerySettings;
    statusBarItem: HTMLElement;

    async onload() {
        await this.loadSettings();

        // 註冊視圖類型
        this.registerView(
            'grid-view',
            (leaf) => new GridView(leaf, this)
        );

        // 註冊設定頁面
        this.addSettingTab(new GridExplorerSettingTab(this.app, this));

        // 註冊指令
        this.addCommand({
            id: 'open-grid-view',
            name: t('open_grid_view'),
            callback: () => {
                showFolderSelectionModal(this.app, this);
            }
        });

        // 新增 Ribbon 圖示
        this.addRibbonIcon('grid', t('open_grid_view'), () => {
            showFolderSelectionModal(this.app, this);
        });

        // 註冊狀態列項目
        this.statusBarItem = this.addStatusBarItem();
        this.statusBarItem.onClickEvent(() => {
            this.activateView();
        });

        // 註冊資料夾的右鍵選單
        this.registerEvent(
            this.app.workspace.on('file-menu', (menu, file) => {
                if (file instanceof TFolder || file instanceof TFile) {
                    menu.addItem((item) => {
                        item
                            .setTitle(t('open_in_grid_view'))
                            .setIcon('grid')
                            .onClick(() => {
                                // 如果是文件，使用其父資料夾路徑
                                const folderPath = file instanceof TFile ? file.parent?.path : file.path;
                                this.activateView('folder', folderPath);
                            });
                    });
                }
            })
        );
    }

    async activateView(mode = 'bookmarks', path = '') {
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

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
        
        // 當設定變更時，更新所有開啟的 GridView 實例
        const leaves = this.app.workspace.getLeavesOfType('grid-view');
        leaves.forEach(leaf => {
            if (leaf.view instanceof GridView) {
                // 重新渲染視圖以套用新設定
                leaf.view.render();
            }
        });
    }
}