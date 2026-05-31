/**
 * 自动注入全部词库脚本，并注册到 globalThis。
 */
(function () {
    const loaded = new Set();
    for (const source of getAllSources()) {
        if (loaded.has(source.file)) continue;
        loaded.add(source.file);
        document.write('<script src="Woerter/' + source.file + '"><\/script>');
        document.write(
            '<script>globalThis["' + source.sourceKey + '"]=' + source.sourceKey + ';<\/script>'
        );
    }
})();
