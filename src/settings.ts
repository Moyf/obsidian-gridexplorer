import { App, PluginSettingTab, Setting } from 'obsidian';
import GridExplorerPlugin from '../main';
import { t } from './translations';

export interface GallerySettings {
    ignoredFolders: string[];
    defaultSortType: string;
    gridItemWidth: number;
    imageAreaWidth: number;
    imageAreaHeight: number;
}

// 預設設定
export const DEFAULT_SETTINGS: GallerySettings = {
    ignoredFolders: [],
    defaultSortType: 'mtime-desc', // 預設排序模式：修改時間倒序
    gridItemWidth: 300, // 網格項目寬度，預設 300
    imageAreaWidth: 100, // 圖片區域寬度，預設 100
    imageAreaHeight: 100 // 圖片區域高度，預設 100
};

// 設定頁面類別
export class GridExplorerSettingTab extends PluginSettingTab {
    plugin: GridExplorerPlugin;

    constructor(app: App, plugin: GridExplorerPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();

        // 預設排序模式設定
        new Setting(containerEl)
            .setName(t('default_sort_type'))
            .setDesc(t('default_sort_type_desc'))
            .addDropdown(dropdown => {
                dropdown
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
                    });
            });

        // 網格項目寬度設定
        new Setting(containerEl)
            .setName(t('grid_item_width'))
            .setDesc(t('grid_item_width_desc'))
            .addSlider(slider => {
                slider
                    .setLimits(200, 600, 50)
                    .setValue(this.plugin.settings.gridItemWidth)
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        this.plugin.settings.gridItemWidth = value;
                        await this.plugin.saveSettings();
                    });
            });

        // 圖片區域寬度設定
        new Setting(containerEl)
            .setName(t('image_area_width'))
            .setDesc(t('image_area_width_desc'))
            .addSlider(slider => {
                slider
                    .setLimits(50, 300, 10)
                    .setValue(this.plugin.settings.imageAreaWidth)
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        this.plugin.settings.imageAreaWidth = value;
                        await this.plugin.saveSettings();
                    });
            });

        // 圖片區域高度設定
        new Setting(containerEl)
            .setName(t('image_area_height'))
            .setDesc(t('image_area_height_desc'))
            .addSlider(slider => {
                slider
                    .setLimits(50, 300, 10)
                    .setValue(this.plugin.settings.imageAreaHeight)
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        this.plugin.settings.imageAreaHeight = value;
                        await this.plugin.saveSettings();
                    });
            });
        
        // 忽略的資料夾設定
        const ignoredFoldersContainer = containerEl.createDiv('ignored-folders-container');
        
        new Setting(containerEl)
            .setName(t('ignored_folders'))
            .setDesc(t('ignored_folders_desc'))
            .setHeading();
        
        // 新增資料夾選擇器
        new Setting(ignoredFoldersContainer)
            .setName(t('add_ignored_folder'))
            .addDropdown(dropdown => {
                // 獲取所有資料夾
                const folders = this.app.vault.getAllFolders()
                    .filter(folder => folder.path !== '/') // 排除根目錄
                    .sort((a, b) => a.path.localeCompare(b.path));
                
                // 新增空選項作為預設值
                dropdown.addOption('', t('select_folders'));
                
                // 新增所有資料夾作為選項
                folders.forEach(folder => {
                    // 只顯示尚未被忽略的資料夾
                    if (!this.plugin.settings.ignoredFolders.includes(folder.path)) {
                        dropdown.addOption(folder.path, folder.path);
                    }
                });
                
                dropdown.onChange(async (value) => {
                    if (value) {
                        // 新增到忽略列表
                        this.plugin.settings.ignoredFolders.push(value);
                        await this.plugin.saveSettings();
                        
                        // 重新渲染列表
                        this.renderIgnoredFoldersList(ignoredFoldersList);
                        
                        // 重設下拉選單
                        dropdown.setValue('');
                        this.display();
                    }
                });
            });

        // 顯示目前已忽略的資料夾列表
        const ignoredFoldersList = ignoredFoldersContainer.createDiv('ge-ignored-folders-list');
        this.renderIgnoredFoldersList(ignoredFoldersList);
        
        containerEl.appendChild(ignoredFoldersContainer);
    }

    // 渲染已忽略的資料夾列表
    renderIgnoredFoldersList(containerEl: HTMLElement) {
        containerEl.empty();
        
        if (this.plugin.settings.ignoredFolders.length === 0) {
            containerEl.createEl('p', { text: t('no_ignored_folders') });
            return;
        }
        
        const list = containerEl.createEl('ul', { cls: 'ge-ignored-folders-list' });
        
        this.plugin.settings.ignoredFolders.forEach(folder => {
            const item = list.createEl('li', { cls: 'ge-ignored-folder-item' });
            
            item.createSpan({ text: folder, cls: 'ge-ignored-folder-path' });
            
            const removeButton = item.createEl('button', { 
                cls: 'ge-ignored-folder-remove',
                text: t('remove')
            });
            
            removeButton.addEventListener('click', async () => {
                // 從忽略列表中移除
                this.plugin.settings.ignoredFolders = this.plugin.settings.ignoredFolders
                    .filter(f => f !== folder);
                await this.plugin.saveSettings();
                
                // 重新渲染列表
                this.renderIgnoredFoldersList(containerEl);
                this.display();
            });
        });
    }
}