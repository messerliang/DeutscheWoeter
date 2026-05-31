const choose_curriculum = document.getElementById('curriculum');
const choose_book = document.getElementById('book');
const curriculum_field = document.getElementById('curriculum-field');
const choose_word_count = document.getElementById('word-count');
const auto_play_toggle = document.getElementById('auto-play');
const start_button = document.getElementById('start-button');
const practice_area = document.getElementById('practice-area');
const session_label = document.getElementById('session-label');
const session_stats = document.getElementById('session-stats');
const progress_text = document.getElementById('progress-text');
const word_type_badge = document.getElementById('word-type-badge');

const word_chinese = document.getElementById('word_chinese');
const word_example = document.getElementById('word_example');

const span_hint_singular = document.getElementById('hint_sigular');
const input_gender = document.getElementById('input_gender');
const div_check_gender_result = document.getElementById('check_gender_result');
const input_answer_word = document.getElementById('answer_word');
const div_check_answer_word = document.getElementById('check_answer_result');
const span_hint_plural = document.getElementById('hint_plural');
const div_plural_gender = document.getElementById('plural_gender');
const input_answer_plural = document.getElementById('answer_plural');
const div_check_plural = document.getElementById('check_plural_result');

const check_button = document.getElementById('check_button');
const div_progress_bar = document.getElementById('div_progress_bar');
const root = document.documentElement;

const audio_correct = new Audio('ring/correct.mp3');
const audio_wrong = new Audio('ring/wrong.mp3');
const audio_finished = new Audio('ring/finished.mp3');

const clear_stats_button = document.getElementById('clear-stats-button');
const stat_total = document.getElementById('stat-total');
const stat_correct = document.getElementById('stat-correct');
const stat_wrong = document.getElementById('stat-wrong');
const stat_rate = document.getElementById('stat-rate');
const stat_meta = document.getElementById('stat-meta');
const hard_words_list = document.getElementById('hard-words-list');

const STATS_KEY = 'spellingStats';

const WoeterAudioPath = 'WoeterAudio/';
const SHARED_AUDIO_DIR = WoeterAudioPath + 'shared/';

const STATE = { ANSWER: 0, CHECK: 1 };
let current_state = STATE.ANSWER;
let session_active = false;

const TYPE = {
    nom: '名词', inf: '动词', adj: '形容词', adv: '副词',
    trennV: '可分动词', trenV: '可分动词', pron: '代词',
    konj: '连词', prap: '介词', präp: '介词', inter: '感叹词',
};

function migrateLegacySettings() {
    const cur = localStorage.getItem('curriculum');
    if (cur === 'schritte') {
        localStorage.setItem('curriculum', 'xinkebiao');
    }
    localStorage.removeItem('unit');
    localStorage.removeItem('scope');

    if (cur) return;

    const oldBook = localStorage.getItem('book');
    if (!oldBook?.startsWith('Buch')) return;

    const bookNum = oldBook.replace('Buch', '');
    localStorage.setItem('curriculum', 'xinkebiao');
    localStorage.setItem('book', 'B' + bookNum);
}

migrateLegacySettings();

let Curriculum = localStorage.getItem('curriculum') || CURRICULA[0].id;
let Book = localStorage.getItem('book') || CURRICULA[0].books[0].id;
let WordCount = localStorage.getItem('wordCount') || '10';
let AutoPlayAudio = localStorage.getItem('autoPlayAudio') !== 'false';

let test_words = [];
let current_word = {};
let current_idx = 0;
let WORDS_NUM = 0;
let lastFocusedInput = input_answer_word;
let sessionStats = { correct: 0, wrong: 0 };

function getDefaultStats() {
    return {
        totalAttempts: 0,
        totalCorrect: 0,
        totalWrong: 0,
        sessionsCompleted: 0,
        words: {},
    };
}

function loadStats() {
    try {
        const raw = localStorage.getItem(STATS_KEY);
        if (!raw) return getDefaultStats();
        const parsed = JSON.parse(raw);
        return { ...getDefaultStats(), ...parsed, words: parsed.words || {} };
    } catch {
        return getDefaultStats();
    }
}

function saveStats(stats) {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

function wordStatsKey(word) {
    return `${word._curriculum}|${word._book}|${word.type}|${word.word}`;
}

function recordAttempt(word, correct) {
    const stats = loadStats();
    stats.totalAttempts += 1;
    if (correct) {
        stats.totalCorrect += 1;
        sessionStats.correct += 1;
    } else {
        stats.totalWrong += 1;
        sessionStats.wrong += 1;
    }

    const key = wordStatsKey(word);
    if (!stats.words[key]) {
        stats.words[key] = {
            unit: getBookDisplayLabel(word._curriculum || Curriculum, word._book || Book),
            word: word.word,
            chinese: word.chinese || '',
            type: word.type,
            attempts: 0,
            correct: 0,
            wrong: 0,
        };
    }
    stats.words[key].attempts += 1;
    if (correct) stats.words[key].correct += 1;
    else stats.words[key].wrong += 1;

    saveStats(stats);
    renderStatsUI();
}

function renderStatsUI() {
    const stats = loadStats();
    const { totalAttempts, totalCorrect, totalWrong, sessionsCompleted, words } = stats;

    stat_total.textContent = totalAttempts;
    stat_correct.textContent = totalCorrect;
    stat_wrong.textContent = totalWrong;
    stat_rate.textContent = totalAttempts > 0
        ? `${Math.round((totalCorrect / totalAttempts) * 100)}%`
        : '—';

    const uniqueWords = Object.keys(words).length;
    stat_meta.textContent = `完成轮次 ${sessionsCompleted} · 累计练习 ${uniqueWords} 个单词`;

    const hardWords = Object.values(words)
        .filter(w => w.wrong > 0)
        .sort((a, b) => b.wrong - a.wrong || b.attempts - a.attempts)
        .slice(0, 15);

    if (hardWords.length === 0) {
        hard_words_list.innerHTML = '<li class="hard-words-empty">暂无错误记录</li>';
        return;
    }

    hard_words_list.innerHTML = hardWords.map(item => `
        <li>
            <div class="hard-word-main">
                <span class="hard-word-de">${escapeHtml(item.word)}</span>
                <span class="hard-word-cn">${escapeHtml(item.chinese)} · ${item.unit}</span>
            </div>
            <span class="hard-word-counts">
                错 <span class="wrong-count">${item.wrong}</span> / ${item.attempts}
            </span>
        </li>
    `).join('');
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function escapeRegex(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getExampleHighlightPatterns(word) {
    const patterns = [];
    const w = word.word?.trim();
    if (!w) return patterns;

    if (word.type === 'nom' && hasArticleGender(word.gender)) {
        patterns.push(`${word.gender} ${w}`);
    }
    patterns.push(w);
    if (w.includes('/')) {
        patterns.push(w.replace(/\//g, ''));
    }
    return [...new Set(patterns)].sort((a, b) => b.length - a.length);
}

function resetExampleDisplay(exampleText = '') {
    word_example.textContent = exampleText;
    word_example.classList.remove('example-revealed', 'example-correct', 'example-wrong');
}

function renderExampleHighlight(correct) {
    const example = current_word.example || '';
    if (!example) {
        resetExampleDisplay('');
        return;
    }

    let html = escapeHtml(example);
    for (const pattern of getExampleHighlightPatterns(current_word)) {
        const re = new RegExp(`(${escapeRegex(pattern)})`, 'gi');
        html = html.replace(re, '<mark class="example-word-highlight">$1</mark>');
    }

    word_example.innerHTML = html;
    word_example.classList.add('example-revealed');
    word_example.classList.toggle('example-correct', correct);
    word_example.classList.toggle('example-wrong', !correct);
}

function clearStatsHistory() {
    if (!confirm('确定清空所有练习记录？此操作不可恢复。')) return;
    localStorage.removeItem(STATS_KEY);
    sessionStats = { correct: 0, wrong: 0 };
    renderStatsUI();
    updateSessionStats();
}

function getAllWordsFromBook(curriculumId, bookId) {
    const words = [];
    for (const source of getBookSources(curriculumId, bookId)) {
        const arr = WORD_SOURCES[source.sourceKey];
        if (!arr) continue;
        words.push(...arr.filter(isValidWord).map(w => normalizeWord(w, curriculumId, bookId, source.sourceKey)));
    }
    return words;
}

function buildWordPool() {
    return getAllWordsFromBook(Curriculum, Book);
}

function shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function pickRandomWords(pool, count) {
    const shuffled = shuffleArray(pool);
    if (count === 'all' || count >= shuffled.length) {
        return shuffled;
    }
    return shuffled.slice(0, count);
}

function hasArticleGender(gender) {
    return gender && gender !== 'none' && gender !== 'nan';
}

function needsGenderInput(word) {
    return word.type === 'nom' && hasArticleGender(word.gender);
}

function isValidWord(word) {
    return word.word && word.word !== 'nan' && word.type !== 'nan';
}

function normalizeWord(word, curriculumId, bookId, sourceKey) {
    const normalized = {
        ...word,
        _curriculum: curriculumId,
        _book: bookId,
        _sourceKey: sourceKey,
    };
    if (normalized.type === 'nom' && normalized.word && !normalized.gender) {
        const match = normalized.word.match(/^(der|die|das)\s+(.+)$/i);
        if (match) {
            normalized.gender = match[1].toLowerCase();
            normalized.word = match[2];
        }
    }
    return normalized;
}

function get_test_words() {
    const pool = buildWordPool();
    const count = WordCount === 'all' ? pool.length : parseInt(WordCount, 10);
    test_words = pickRandomWords(pool, count);

    WORDS_NUM = test_words.length;
    test_words.forEach((word, i) => {
        word.index = i;
        word.test_num = 1;
    });

    root.style.setProperty('--progress-bar-value', '0%');
    progress_text.textContent = '0%';
    updateSessionStats();
}

function updateSessionStats() {
    const done = WORDS_NUM - test_words.length;
    if (!session_active) {
        session_stats.textContent = '';
        return;
    }
    const parts = [`${done} / ${WORDS_NUM}`];
    if (sessionStats.correct > 0 || sessionStats.wrong > 0) {
        parts.push(`对 ${sessionStats.correct} · 错 ${sessionStats.wrong}`);
    }
    session_stats.textContent = parts.join(' · ');
}

function updateSessionLabel() {
    if (!session_active) {
        session_label.textContent = '准备开始';
        return;
    }
    session_label.textContent = getBookDisplayLabel(Curriculum, Book);
}

function updateCurriculumUI() {
    curriculum_field.style.display = CURRICULA.length > 1 ? 'flex' : 'none';
}

function update_curriculum_html() {
    let html = '';
    for (const curriculum of CURRICULA) {
        html += `<option value="${curriculum.id}">${curriculum.name}</option>`;
    }
    choose_curriculum.innerHTML = html;

    if (!findCurriculum(Curriculum)) {
        Curriculum = CURRICULA[0].id;
    }
}

function update_book_html() {
    const curriculum = findCurriculum(Curriculum);
    let book_html = '';
    for (const book of curriculum.books) {
        if (book.sources.length > 0) {
            book_html += `<option value="${book.id}">${book.label}</option>`;
        }
    }
    choose_book.innerHTML = book_html;

    if (!findBook(Curriculum, Book)) {
        Book = curriculum.books.find(b => b.sources.length > 0)?.id || curriculum.books[0].id;
    }
}

function startSession() {
    session_active = true;
    sessionStats = { correct: 0, wrong: 0 };
    practice_area.classList.remove('is-idle');
    current_state = STATE.ANSWER;
    check_button.textContent = '检查';
    clear();
    get_test_words();

    if (test_words.length === 0) {
        session_active = false;
        practice_area.classList.add('is-idle');
        alert('当前选择的教材没有可用单词，请换一个册。');
        return;
    }

    updateSessionLabel();
    set_word();
}

function set_word() {
    const remaining = test_words.length;
    if (remaining === 0) {
        session_active = false;
        practice_area.classList.add('is-idle');
        audio_finished.play();

        const stats = loadStats();
        stats.sessionsCompleted += 1;
        saveStats(stats);
        renderStatsUI();

        session_label.textContent = '练习完成！';
        word_chinese.textContent = '全部答对了，真棒！';
        word_type_badge.textContent = '';
        word_example.textContent = '';
        if (confirm('本轮练习已完成，再来一组？')) {
            startSession();
        }
        return;
    }

    current_idx = Math.floor(Math.random() * remaining);
    current_word = test_words[current_idx];

    word_type_badge.textContent = TYPE[current_word.type] || current_word.type;
    word_chinese.textContent = current_word.chinese;
    resetExampleDisplay(current_word.example || '');

    div_check_gender_result.style.display = 'none';
    div_check_answer_word.style.display = 'none';
    div_check_plural.style.display = 'none';
    input_answer_word.style.display = 'inline-block';

    if (TYPE[current_word.type] !== '名词' && current_word.type !== 'nom') {
        input_answer_word.focus();
        lastFocusedInput = input_answer_word;

        input_gender.style.display = 'none';
        div_plural_gender.style.display = 'none';
        input_answer_plural.disabled = true;
        input_answer_plural.style.display = 'none';
        span_hint_singular.style.display = 'none';
        span_hint_plural.style.display = 'none';
        document.getElementById('plural-row').style.display = 'none';
    } else {
        document.getElementById('plural-row').style.display = 'flex';
        div_plural_gender.style.display = 'inline-block';
        input_answer_plural.disabled = false;
        input_answer_plural.style.display = 'inline-block';
        span_hint_singular.style.display = 'inline-block';
        span_hint_plural.style.display = 'inline-block';

        if (needsGenderInput(current_word)) {
            input_gender.style.display = 'inline-block';
            div_check_gender_result.style.display = 'none';
            input_gender.focus();
            lastFocusedInput = input_gender;
        } else {
            input_gender.style.display = 'none';
            div_check_gender_result.style.display = 'none';
            input_answer_word.focus();
            lastFocusedInput = input_answer_word;
        }

        if (current_word.plural === 'o.Pl') {
            input_answer_plural.style.display = 'none';
            div_plural_gender.textContent = 'o.Pl';
        } else {
            input_answer_plural.style.display = 'inline-block';
            div_plural_gender.textContent = 'die';
        }
    }

    updateSessionStats();
    if (AutoPlayAudio) play();
}

function getAudioBasename(word) {
    let name = '';
    if (word.type === 'nom' && hasArticleGender(word.gender)) {
        name = word.gender + '_' + word.word;
    } else {
        name = word.word;
    }
    return name.replace(/\//g, '');
}

function play() {
    const basename = getAudioBasename(current_word);
    const audio = new Audio(SHARED_AUDIO_DIR + basename + '.wav');
    audio.play().catch(() => {});
}

function aue_simplify(str) {
    return str
        .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')
        .replace(/Ä/g, 'Ae').replace(/Ö/g, 'Oe').replace(/Ü/g, 'Ue')
        .replace(/ß/g, 'ss');
}

function normAnswer(str) {
    return aue_simplify(str.trim()).toLowerCase();
}

function answersMatch(user, ...refs) {
    const normalized = normAnswer(user);
    return refs.some(ref => normalized === normAnswer(ref));
}

function renderResult(container, correct, userVal, refVal) {
    container.style.display = 'inline-flex';
    if (correct) {
        container.innerHTML = `<p class="correct">${refVal}</p>`;
    } else {
        container.innerHTML = `<p class="correct">${refVal}</p><p class="wrong">${userVal}</p>`;
    }
}

function check_word() {
    current_state = STATE.CHECK;

    const ans_gender = input_gender.value.trim();
    const ans_w = input_answer_word.value.trim();
    let ans_p = input_answer_plural.value.trim();
    let flag = true;

    if (current_word.type === 'nom') {
        let ref_plural = 'o.Pl';
        if (current_word.plural === 'o.Pl') {
            ans_p = 'o.Pl';
        } else {
            ref_plural = current_word.plural;
        }

        const ref_gender = current_word.gender;
        const ref_word = current_word.word;
        const skipGender = !needsGenderInput(current_word);

        const gender_check = skipGender || answersMatch(ans_gender, ref_gender);
        const singular_check = answersMatch(ans_w, ref_word);
        const plural_check = answersMatch(ans_p, ref_plural);
        flag = gender_check && singular_check && plural_check;

        if (skipGender) {
            div_check_gender_result.style.display = 'none';
        } else {
            input_gender.style.display = 'none';
            renderResult(div_check_gender_result, gender_check, ans_gender, ref_gender);
        }

        input_answer_word.style.display = 'none';
        renderResult(div_check_answer_word, singular_check, ans_w, ref_word);

        if (current_word.plural !== 'o.Pl') {
            input_answer_plural.style.display = 'none';
            renderResult(div_check_plural, plural_check, ans_p, ref_plural);
        }
    } else {
        const ref_word = current_word.word.trim();

        if (current_word.type === 'trennV' || current_word.type === 'trenV') {
            const ref_word_nohash = ref_word.split('/').join('');
            flag = answersMatch(ans_w, ref_word, ref_word_nohash);
        } else {
            flag = answersMatch(ans_w, ref_word);
        }

        input_answer_word.style.display = 'none';
        renderResult(div_check_answer_word, flag, ans_w, ref_word);
    }

    if (flag) {
        audio_correct.play();
        test_words[current_idx] = test_words[test_words.length - 1];
        test_words.pop();
    } else {
        audio_wrong.play();
    }

    recordAttempt(current_word, flag);
    renderExampleHighlight(flag);

    const pv = WORDS_NUM > 0 ? ((WORDS_NUM - test_words.length) / WORDS_NUM) * 100 : 0;
    const pv_str = pv.toFixed(0) + '%';
    root.style.setProperty('--progress-bar-value', pv_str);
    progress_text.textContent = pv_str;
    updateSessionStats();
}

function clear() {
    input_answer_word.value = '';
    input_answer_plural.value = '';
    input_gender.value = '';
    word_chinese.textContent = '';
    resetExampleDisplay('');
    word_type_badge.textContent = '';
}

function start_next_word() {
    current_state = STATE.ANSWER;
    check_button.textContent = '检查';
    clear();
    set_word();
}

function showCheckResult() {
    if (!session_active || current_state !== STATE.ANSWER) return;
    check_button.textContent = '下一题';
    check_word();
    if (!AutoPlayAudio) play();
    requestAnimationFrame(() => check_button.focus());
}

function goNextWord() {
    if (!session_active || current_state !== STATE.CHECK) return;
    start_next_word();
}

function shouldJumpToPlural() {
    return current_word.type === 'nom'
        && current_word.plural !== 'o.Pl'
        && input_answer_word.value.trim() !== '';
}

function handleAnswerEnter(e) {
    if (!session_active || e.code !== 'Enter' || current_state !== STATE.ANSWER) return;
    if (e.target.closest('.settings-panel')) return;

    if (e.target === input_gender) {
        if (input_gender.value.trim() === '') return;
        e.preventDefault();
        input_answer_word.focus();
        return;
    }

    if (e.target === input_answer_word) {
        if (input_answer_word.value.trim() === '') return;
        if (shouldJumpToPlural()) {
            e.preventDefault();
            input_answer_plural.focus();
            return;
        }
    }

    if (e.target === input_answer_plural && input_answer_plural.value.trim() === '') {
        return;
    }

    if (e.target === input_answer_word || e.target === input_answer_plural) {
        e.preventDefault();
        showCheckResult();
    }
}

function handleCheckEnter(e) {
    if (!session_active || e.code !== 'Enter' || current_state !== STATE.CHECK) return;
    if (e.target.closest('.settings-panel')) return;
    e.preventDefault();
    goNextWord();
}

function insertUmlaut(char) {
    const input = lastFocusedInput;
    if (!input || input.disabled || input.style.display === 'none') return;

    const start = input.selectionStart;
    const end = input.selectionEnd;
    const val = input.value;
    input.value = val.slice(0, start) + char + val.slice(end);
    input.selectionStart = input.selectionEnd = start + char.length;
    input.focus();
}

input_gender.addEventListener('focus', () => { lastFocusedInput = input_gender; });
input_answer_word.addEventListener('focus', () => { lastFocusedInput = input_answer_word; });
input_answer_plural.addEventListener('focus', () => { lastFocusedInput = input_answer_plural; });

input_gender.addEventListener('input', () => {
    if (input_gender.value.length >= 3) {
        input_answer_word.focus();
    }
});

input_gender.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        input_gender.value = input_gender.value.trim();
        if (input_gender.value !== '') input_answer_word.focus();
    }
});

input_answer_word.addEventListener('keydown', (e) => {
    if (e.code === 'Backspace' && input_answer_word.value.trim() === '') {
        input_gender.focus();
    }
});

input_answer_plural.addEventListener('keydown', (e) => {
    if (e.code === 'Backspace' && input_answer_plural.value.trim() === '') {
        input_answer_word.focus();
    }
});

check_button.addEventListener('click', () => {
    if (current_state === STATE.ANSWER) showCheckResult();
    else goNextWord();
});

document.addEventListener('keydown', handleAnswerEnter);
document.addEventListener('keydown', handleCheckEnter, true);

document.querySelectorAll('.umlauts_button').forEach(btn => {
    btn.addEventListener('click', () => insertUmlaut(btn.dataset.char));
});

choose_curriculum.addEventListener('change', (e) => {
    Curriculum = e.target.value;
    localStorage.setItem('curriculum', Curriculum);
    update_book_html();
    localStorage.setItem('book', Book);
    choose_book.value = Book;
});

choose_book.addEventListener('change', (e) => {
    Book = e.target.value;
    localStorage.setItem('book', Book);
});

choose_word_count.addEventListener('change', (e) => {
    WordCount = e.target.value;
    localStorage.setItem('wordCount', WordCount);
});

auto_play_toggle.addEventListener('change', (e) => {
    AutoPlayAudio = e.target.checked;
    localStorage.setItem('autoPlayAudio', AutoPlayAudio);
});

start_button.addEventListener('click', startSession);
clear_stats_button.addEventListener('click', clearStatsHistory);

update_curriculum_html();
updateCurriculumUI();
update_book_html();
renderStatsUI();

choose_curriculum.value = Curriculum;
choose_book.value = Book;
choose_word_count.value = WordCount;
auto_play_toggle.checked = AutoPlayAudio;

practice_area.classList.add('is-idle');
word_chinese.textContent = '选择设置后点击「开始练习」';
