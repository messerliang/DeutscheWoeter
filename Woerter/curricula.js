/**
 * 教材配置 — 按「教材系列 + 册」组织，不再按单元划分。
 *
 * 每册的 sources 列出该册包含的词库 JS 文件（可多个文件合并为一册）。
 * 音频统一放在 WoeterAudio/shared/，按单词共享。
 *
 * 新增教材示例：
 *   {
 *     id: 'menschen',
 *     name: 'Menschen',
 *     books: [
 *       { id: 'A1', label: 'A1', sources: [{ sourceKey: 'menschen_A1', file: 'menschen_A1.js' }] },
 *     ],
 *   },
 */

const CURRICULA = [
    {
        id: 'xinkebiao',
        name: '新课标德语',
        books: [
            { id: 'B1', label: '第一册', sources: buildSources('B1', 10) },
            { id: 'B2', label: '第二册', sources: buildSources('B2', 10) },
            { id: 'B3', label: '第三册', sources: buildSources('B3', 5) },
        ],
    },
    {
        id: 'goethe',
        name: '歌德学院 Deutsch online',
        books: [
            {
                id: 'A1',
                label: 'A1',
                sources: [{ sourceKey: 'goethe_A1', file: 'goethe_A1.js' }],
            },
        ],
    },
];

function buildSources(bookId, count) {
    const sources = [];
    for (let i = 1; i <= count; i++) {
        const sourceKey = `${bookId}E${i}`;
        sources.push({ sourceKey, file: `${sourceKey}.js` });
    }
    return sources;
}

function findCurriculum(curriculumId) {
    return CURRICULA.find(c => c.id === curriculumId);
}

function findBook(curriculumId, bookId) {
    return findCurriculum(curriculumId)?.books.find(b => b.id === bookId);
}

function getBookSources(curriculumId, bookId) {
    return findBook(curriculumId, bookId)?.sources || [];
}

function getAllSources() {
    const list = [];
    for (const curriculum of CURRICULA) {
        for (const book of curriculum.books) {
            for (const source of book.sources) {
                list.push(source);
            }
        }
    }
    return list;
}

function getBookDisplayLabel(curriculumId, bookId) {
    const curriculum = findCurriculum(curriculumId);
    const book = findBook(curriculumId, bookId);
    if (!curriculum || !book) return '';
    return `${curriculum.name} · ${book.label}`;
}
