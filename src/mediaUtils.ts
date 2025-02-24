import { App, TFile } from 'obsidian';

// 尋找筆記中的第一張圖片
export async function findFirstImageInNote(app: App, file: TFile) {
    try {
        const content = await app.vault.cachedRead(file);
        const internalMatch = content.match(/(?:!\[\[(.*?\.(?:jpg|jpeg|png|gif|webp))(?:\|.*?)?\]\]|!\[(.*?)\]\(\s*(\S+?(?:\.(?:jpg|jpeg|png|gif|webp)|format=(?:jpg|jpeg|png|gif|webp))[^\s)]*)\s*(?:\s+["'][^"']*["'])?\s*\))/gi);
        if (internalMatch) {
            return processMediaLink(app, internalMatch[0]);
        } else {    
            return null;
        }
    } catch (error) {
        console.error('Error finding image in note:', error);
        return null;
    }
}

// 處理媒體連結
function processMediaLink(app: App, linkText: string) {
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
        const url = markdownMatch[2].split(' "')[0];
        if (url.startsWith('http')) {
            return url;
        } else {
            const file = app.metadataCache.getFirstLinkpathDest(url, '');
            if (!file) {
                const fileByPath = app.vault.getAbstractFileByPath(url);
                if (fileByPath instanceof TFile) {
                    return app.vault.getResourcePath(fileByPath);
                }
            } else {
                return app.vault.getResourcePath(file);
            }
        }
    }
    return null;
}


