/**
 * 从 globalThis 构建 WORD_SOURCES 注册表（按词库文件 key）。
 */
const WORD_SOURCES = (function () {
    const sources = {};
    const seen = new Set();
    for (const source of getAllSources()) {
        if (seen.has(source.sourceKey)) continue;
        seen.add(source.sourceKey);
        const data = globalThis[source.sourceKey];
        if (Array.isArray(data)) {
            sources[source.sourceKey] = data;
        } else {
            console.warn('[DeutscheWoeter] 词库未加载:', source.sourceKey, source.file);
        }
    }
    return sources;
})();
