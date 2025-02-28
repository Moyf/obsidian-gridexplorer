import { getLanguage } from 'obsidian';

interface Translations {
    'zh-TW': { [key: string]: string };
    'en': { [key: string]: string }; 
    'zh': { [key: string]: string };
    'ja': { [key: string]: string };
}

type LanguageKey = keyof Translations;

// 全域翻譯函式
export function t(key: string): string {
    const lang = window.localStorage.getItem('language') as LanguageKey;
    //const lang: LanguageKey = getLanguage() as LanguageKey;
    const translations = TRANSLATIONS[lang] || TRANSLATIONS['en'];
    return translations[key] || key;
}

// 語系檔案
export const TRANSLATIONS: Translations = {
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
        'ignored_folders_desc': '在這裡設定要忽略的資料夾',
        'add_ignored_folder': '新增忽略資料夾',
        'no_ignored_folders': '沒有忽略的資料夾。',
        'remove': '移除',
        'default_sort_type': '預設排序模式',
        'default_sort_type_desc': '設定開啟網格視圖時的預設排序模式',
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
        'searching': '搜尋中...',
        'no_files': '沒有找到任何筆記',
        'filter_folders': '篩選資料夾...',
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
        'grid_view_title': 'Grid view',
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
        'ignored_folders_desc': 'Set folders to be ignored.',
        'add_ignored_folder': 'Add ignored folder',
        'no_ignored_folders': 'No ignored folders.',
        'remove': 'Remove',
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
        'open_grid_view': 'Open grid view',
        'open_in_grid_view': 'Open in grid view',
        'delete_note': 'Delete note',
        'open_in_new_tab': 'Open in new tab',
        'searching': 'Searching...',
        'no_files': 'No notes found',
        'filter_folders': 'Filter folders...',
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
        'ignored_folders_desc': '在这里设置要忽略的文件夹',
        'add_ignored_folder': '新增忽略資料夾',
        'no_ignored_folders': '沒有忽略的資料夾。',
        'remove': '移除',
        'default_sort_type': '預設排序模式',
        'default_sort_type_desc': '设置开启网格视图时的預设排序模式',
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
        'open_in_new_tab': '在新标签页打开',
        'searching': '搜索中...',
        'no_files': '没有找到任何笔记',
        'filter_folders': '筛选文件夹...',
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
        'ignored_folders_desc': '無視するフォルダを設定します',
        'add_ignored_folder': '無視するフォルダを追加',
        'no_ignored_folders': '無視するフォルダはありません',
        'remove': '削除',
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
        'searching': '検索中...',
        'no_files': 'ノートが見つかりません',
        'filter_folders': 'フォルダをフィルタリング...',
    },
};