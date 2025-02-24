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
    }
}