const choose_book = document.getElementById('book');
const choose_unit = document.getElementById('unit');
const choose_scope = document.getElementById('scope');
const choose_word_count = document.getElementById('word-count');
const start_button = document.getElementById('start-button');
const unit_field = document.getElementById('unit-field');
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

const WoeterAudioPath = 'WoeterAudio/';

const STATE = { ANSWER: 0, CHECK: 1 };
let current_state = STATE.ANSWER;
let session_active = false;

const TYPE = {
    nom: '名词', inf: '动词', adj: '形容词', adv: '副词',
    trennV: '可分动词', trenV: '可分动词', pron: '代词',
    konj: '连词', prap: '介词', präp: '介词', inter: '感叹词',
};

const BUCH_DICT = { Buch1: 'B1', Buch2: 'B2', Buch3: 'B3' };
const EINHEIT_DICT = {
    Einheit1: 'E1', Einheit2: 'E2', Einheit3: 'E3', Einheit4: 'E4',
    Einheit5: 'E5', Einheit6: 'E6', Einheit7: 'E7', Einheit8: 'E8',
    Einheit9: 'E9', Einheit10: 'E10',
};

const WORD_SOURCES = {
    B1E1, B1E2, B1E3, B1E4, B1E5, B1E6, B1E7, B1E8, B1E9, B1E10,
    B2E1, B2E2, B2E3, B2E4, B2E5, B2E6, B2E7, B2E8, B2E9, B2E10,
    B3E1, B3E2, B3E3, B3E4, B3E5,
};

let Book = localStorage.getItem('book') || 'Buch1';
let Unit = localStorage.getItem('unit') || 'Einheit1';
let Scope = localStorage.getItem('scope') || 'unit';
let WordCount = localStorage.getItem('wordCount') || '10';

Unit = BUCH_EINHEIT[Book].includes(Unit) ? Unit : 'Einheit1';

let test_words = [];
let current_word = {};
let current_idx = 0;
let WORDS_NUM = 0;
let lastFocusedInput = input_answer_word;

function getSourceKey(book, unit) {
    return BUCH_DICT[book] + EINHEIT_DICT[unit];
}

function getWordsFromUnit(book, unit) {
    const key = getSourceKey(book, unit);
    const source = WORD_SOURCES[key];
    return source ? [...source] : [];
}

function getAllWordsFromBook(book) {
    const words = [];
    for (const unit of BUCH_EINHEIT[book]) {
        words.push(...getWordsFromUnit(book, unit));
    }
    return words;
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

function normalizeWord(word, book, unit) {
    const normalized = { ...word, _book: book, _unit: unit };
    if (normalized.type === 'nom' && normalized.word && !normalized.gender) {
        const match = normalized.word.match(/^(der|die|das)\s+(.+)$/i);
        if (match) {
            normalized.gender = match[1].toLowerCase();
            normalized.word = match[2];
        }
    }
    return normalized;
}

function buildWordPool() {
    let pool = [];
    if (Scope === 'book') {
        for (const unit of BUCH_EINHEIT[Book]) {
            pool.push(...getWordsFromUnit(Book, unit).map(w => normalizeWord(w, Book, unit)));
        }
    } else {
        pool = getWordsFromUnit(Book, Unit).map(w => normalizeWord(w, Book, Unit));
    }
    return pool;
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
    session_stats.textContent = `${done} / ${WORDS_NUM}`;
}

function updateSessionLabel() {
    if (!session_active) {
        session_label.textContent = '准备开始';
        return;
    }
    const scopeText = Scope === 'book' ? `${Book} 全书随机` : `${Book} · ${Unit}`;
    session_label.textContent = scopeText;
}

function updateScopeUI() {
    unit_field.style.display = Scope === 'book' ? 'none' : 'flex';
}

function update_book_html() {
    let book_html = '';
    for (const b in BUCH_EINHEIT) {
        if (BUCH_EINHEIT[b].length > 0) {
            book_html += `<option value="${b}">${b}</option>`;
        }
    }
    choose_book.innerHTML = book_html;

    if (BUCH_EINHEIT[Book].length === 0) {
        for (const b in BUCH_EINHEIT) {
            if (BUCH_EINHEIT[b].length !== 0) {
                Book = b;
                break;
            }
        }
    }
}

function update_unit_html() {
    let unit_html = '';
    for (const einheit of BUCH_EINHEIT[Book]) {
        unit_html += `<option value="${einheit}">${einheit}</option>\n`;
    }
    choose_unit.innerHTML = unit_html;
    if (!BUCH_EINHEIT[Book].includes(Unit)) {
        Unit = BUCH_EINHEIT[Book][0];
    }
}

function startSession() {
    session_active = true;
    practice_area.classList.remove('is-idle');
    current_state = STATE.ANSWER;
    check_button.textContent = '检查';
    clear();
    get_test_words();

    if (test_words.length === 0) {
        session_active = false;
        practice_area.classList.add('is-idle');
        alert('当前选择范围内没有可用单词，请换一个单元或教材。');
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
    word_example.textContent = current_word.example || '';

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
        input_gender.style.display = 'inline-block';
        div_plural_gender.style.display = 'inline-block';
        input_answer_plural.disabled = false;
        input_answer_plural.style.display = 'inline-block';
        span_hint_singular.style.display = 'inline-block';
        span_hint_plural.style.display = 'inline-block';

        if (current_word.type === 'none') {
            div_check_gender_result.textContent = 'none';
            div_check_gender_result.style.display = 'inline-block';
            input_answer_word.focus();
            lastFocusedInput = input_answer_word;
        } else {
            input_gender.focus();
            lastFocusedInput = input_gender;
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
    play();
}

function play() {
    const wordBook = current_word._book || Book;
    const wordUnit = current_word._unit || Unit;
    const wavDir = WoeterAudioPath + BUCH_DICT[wordBook] + EINHEIT_DICT[wordUnit] + '/';

    let wordName = '';
    if (current_word.type === 'nom' && current_word.gender) {
        wordName = current_word.gender + '_' + current_word.word;
    } else {
        wordName = current_word.word;
    }
    wordName = wordName.replace(/\//g, '');

    const audio = new Audio(wavDir + wordName + '.wav');
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

        const gender_check = answersMatch(ans_gender, ref_gender);
        const singular_check = answersMatch(ans_w, ref_word);
        const plural_check = answersMatch(ans_p, ref_plural);
        flag = gender_check && singular_check && plural_check;

        input_gender.style.display = 'none';
        renderResult(div_check_gender_result, gender_check, ans_gender, ref_gender);

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
    word_example.textContent = '';
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

choose_book.addEventListener('change', (e) => {
    Book = e.target.value;
    localStorage.setItem('book', Book);
    update_unit_html();
    choose_unit.value = Unit;
});

choose_unit.addEventListener('change', (e) => {
    Unit = e.target.value;
    localStorage.setItem('unit', Unit);
});

choose_scope.addEventListener('change', (e) => {
    Scope = e.target.value;
    localStorage.setItem('scope', Scope);
    updateScopeUI();
});

choose_word_count.addEventListener('change', (e) => {
    WordCount = e.target.value;
    localStorage.setItem('wordCount', WordCount);
});

start_button.addEventListener('click', startSession);

update_book_html();
update_unit_html();
updateScopeUI();

choose_book.value = Book;
choose_unit.value = Unit;
choose_scope.value = Scope;
choose_word_count.value = WordCount;

practice_area.classList.add('is-idle');
word_chinese.textContent = '选择设置后点击「开始练习」';
