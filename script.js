const choose_book = document.getElementById('book');                 answer_plural           /* 选择课本 */
const choose_unit = document.getElementById('unit');                            /* 选择单元 */
const word_chinese = document.getElementById("word_chinese");                   /* 显示中文翻译 */
const word_example = document.getElementById("word_example");                   /* 显示例句*/    

const span_hint_singular = document.getElementById("hint_sigular")              /* 单数提示词 */
const input_gender = document.getElementById("input_gender");                   /* 输入的词性 */
const div_check_gender_result = document.getElementById("check_gender_result")  /* 输入词性的检测结果 */
const input_answer_word = document.getElementById("answer_word");                     /* 单词回答 */
const div_check_answer_word = document.getElementById("check_answer_result")    /* 单词的检查结果 */
const span_hint_plural = document.getElementById("hint_plural")                 /* 复数提示词 */
const div_plural_gender = document.getElementById("plural_gender");             /* 复数对应的 die */
const input_answer_plural = document.getElementById("answer_plural");                 /* 复数回答 */
const div_check_plural = document.getElementById("check_plural_result");        /* 复数回答检查 */

const check_button = document.getElementById("check_button")                    /* 点击检查输入答案的按钮 */

const div_progress_bar = document.getElementById("div_progress_bar");           // 进度条盒子

const root = document.documentElement;                                          // 根元素



const audio_correct_path = 'ring/correct.mp3';
const audio_wrong_path = 'ring/wrong.mp3';
const audio_finished_path = 'ring/finished.mp3';

const audio_correct = new Audio(audio_correct_path)
const audio_wrong = new Audio(audio_wrong_path)
const audio_finished = new Audio(audio_wrong_path)


const STATE = {
    ANSWER: 0,
    CHECK:1,
}
let current_state = STATE.ANSWER; // 当前是在作答阶段还是在检测阶段

// 简写词性对应的中文含义
const TYPE = {  nom:"名",
                inf:'动',
                adj:'形',
                adv:'副',
                trennV:'可分动词', 
                trenV:'可分动词',
                pron:'代',
                konj:'连',
                prap:'介',
                präp:'介',
                inter:'插'
            };
// 书本字典的定义
const BUCH_DICT = {
    "Buch1":"B1",
    "Buch2":"B2",
    "Buch3":"B3"
}
// 单元字典的定义
const EINHEIT_DICT = {
    "Einheit1":"E1",
    "Einheit2":"E2",
    "Einheit3":"E3",
    "Einheit4":"E4",
    "Einheit5":"E5",
    "Einheit6":"E6",
    "Einheit7":"E7",
    "Einheit8":"E8",
    "Einheit9":"E9",
    "Einheit10":"E10",
}


input_answer_word.focus();

// 读取之前选择的 book
let Book = localStorage.getItem('book') !== null
? localStorage.getItem('book')
: 'Buch1';

// 读取之前选择的 einheit
let Unit = localStorage.getItem('unit') !== null
? localStorage.getItem('unit')
: 'Einheit1';
Unit = BUCH_EINHEIT[Book].includes(Unit)?Unit:"Einheit1";

let test_words = [];    // 当前练习的单词数组
let current_word = {};  // 从练习的单词数组中选择的单词对象
let current_idx = 0;    // 选中的第几个单词
let WORDS_NUM = 1;      // 总共练习的单词的数量




// 以上是单元和课本的选择
update_book_html()
update_unit_html()
get_test_words();
set_word();

// 在完成上面的元素布置后，将当前的选择单元切换为之前的记录

choose_book.value = Book;
choose_unit.value = Unit;


// 每次重新选择 book 时，都刷新数据
choose_book.addEventListener('change', e=>{
    Book = e.target.value;
    localStorage.setItem('book', Book);
    
    update_unit_html();
    choose_unit.value = Unit;
    clear();
    get_test_words();
    set_word();
});

// 每次重新选择单元时，也刷新数据
choose_unit.addEventListener('change',e=>{
    Unit = e.target.value;
    localStorage.setItem('unit',Unit);
    console.log(Unit);
    clear();
    get_test_words();
    set_word();
});

// 根据当前所具有的 book，更新 book 选项栏
function update_book_html(){
    let book_html = "";

    for(let b in BUCH_EINHEIT){
        if(BUCH_EINHEIT[b].length === 0){
            continue;
        }else{
            book_html = book_html +'<option value="'+b + '">'+ b + '</option>';
        }
    }
    choose_book.innerHTML = book_html;

    // 如果当前的 Buch 没有包含任何单元，那么从所有的 Buch 中，选择一个包含有单元的 Buch
    if(BUCH_EINHEIT[Book].length === 0){
        for(let b in BUCH_EINHEIT){
            if(BUCH_EINHEIT[b].length != 0){
                Book = b;
                break;
            }
        }
    }
}
// 更新单元对应的 html
function update_unit_html(){
    let unit_html = "";
    for(let e in BUCH_EINHEIT[Book]){
        let einheit = BUCH_EINHEIT[Book][e];
        unit_html = unit_html + '<option value="'+ einheit + '">'+ einheit + '</option>\n';
    }
    choose_unit.innerHTML = unit_html;
    Unit = BUCH_EINHEIT[Book].indexOf(Unit)?Unit:BUCH_EINHEIT[Book][0];// 在更换 Buch 时，有可能另一个 buch 还没有完成那个单元的记录，就更换为一个当前存在的单元进行替换
}

// 输入框之间的跳转
input_gender.addEventListener("keydown", function(e){ // 单数词性的跳转
    if(e.code === "Space" ){ // 空格，跳转到
        e.preventDefault();
        input_gender.value = input_gender.value.trim();
        if("" != input_gender.value)
            input_answer_word.focus();
        return;
    }
    else if(e.code === "Enter" && "" != input_gender.value.trim()){
        input_answer_word.focus();
    }else if(3 <= input_gender.value.length && e.code != "Backspace"){
        input_answer_word.focus();
    };
});

input_answer_word.addEventListener("keydown",e=>{
    if("" === input_answer_word.value.trim()){
        input_answer_word.value = input_answer_word.value.trim();
        if(e.code === "Backspace"){
            input_gender.focus();
        }
        return;
    }
    else{
        if(!(e.code === "Enter") || "" === input_answer_word.value.trim()){
            return;
        }
        // 如果是名词，则需要继续输入名词复数
        if(current_word.type === 'nom' && current_word.plural != 'o.Pl'){
            input_answer_plural.focus();
            input_answer_plural.value = input_answer_plural.value.trim();
            return;
        }
        
        check_button.focus()
    }
});

/* 复数回答区域输入回车进行单词检测 */
input_answer_plural.addEventListener("keydown",e=>{
    if("" === input_answer_plural.value.trim()){
        if(e.code === "Backspace")
            input_answer_word.focus();
        return;
    }else{
        if(e.code != "Enter")return;

        check_button.focus();
        console.log(current_state);
    }
    
})

// 检测按钮
check_button.addEventListener("click", e=>{
    if(STATE.ANSWER === current_state){
        check_button.innerText = "continue";
        check_word();
    }else{
        check_button.innerText = "check";
        start_next_word();
    }
});


// 根据选项选择
function get_test_words(){
    switch(Book){
        case 'Buch1':
            switch(Unit){
                case 'Einheit1': test_words = typeof(B1E1)==undefined?[]:[...B1E1];break;
                case 'Einheit2': test_words = typeof(B1E2)==undefined?[]:[...B1E2];break;
                case 'Einheit3': test_words = typeof(B1E3)==undefined?[]:[...B1E3];break;
                case 'Einheit4': test_words = typeof(B1E4)==undefined?[]:[...B1E4];break;
                case 'Einheit5': test_words = typeof(B1E5)==undefined?[]:[...B1E5];break;
                case 'Einheit6': test_words = typeof(B1E6)==undefined?[]:[...B1E6];break;
                case 'Einheit7': test_words = typeof(B1E7)==undefined?[]:[...B1E7];break;
                case 'Einheit8': test_words = typeof(B1E8)==undefined?[]:[...B1E8];break;
                case 'Einheit9': test_words = typeof(B1E9)==undefined?[]:[...B1E9];break;
                case 'Einheit10': test_words = typeof(B1E10)==undefined?[]:[...B1E10];break;
            }
            break;
        case 'Buch2':
            switch(Unit){
                case 'Einheit1': test_words = typeof(B1E1)==undefined?[]:[...B2E1];break;
                case 'Einheit2': test_words = typeof(B1E2)==undefined?[]:[...B2E2];break;
                case 'Einheit3': test_words = typeof(B1E3)==undefined?[]:[...B2E3];break;
                case 'Einheit4': test_words = typeof(B1E4)==undefined?[]:[...B2E4];break;
                case 'Einheit5': test_words = typeof(B1E5)==undefined?[]:[...B2E5];break;
                case 'Einheit6': test_words = typeof(B1E6)==undefined?[]:[...B2E6];break;
                case 'Einheit7': test_words = typeof(B1E7)==undefined?[]:[...B2E7];break;
                case 'Einheit8': test_words = typeof(B1E8)==undefined?[]:[...B2E8];break;
                case 'Einheit9': test_words = typeof(B1E9)==undefined?[]:[...B2E9];break;
                case 'Einheit10': test_words = typeof(B1E9)==undefined?[]:[...B2E10];break;
            }
            break;
        case 'Buch3':
            switch(Unit){
                case 'Einheit1': test_words = typeof(B1E1)==undefined?[]:[...B3E1];break;
                case 'Einheit2': test_words = typeof(B1E2)==undefined?[]:[...B3E2];break;
                case 'Einheit3': test_words = typeof(B1E3)==undefined?[]:[...B3E3];break;
                case 'Einheit4': test_words = typeof(B1E4)==undefined?[]:[...B3E4];break;
                case 'Einheit5': test_words = typeof(B1E5)==undefined?[]:[...B3E5];break;
                case 'Einheit6': test_words = typeof(B1E6)==undefined?[]:[...B3E6];break;
                case 'Einheit7': test_words = typeof(B1E7)==undefined?[]:[...B3E7];break;
                case 'Einheit8': test_words = typeof(B1E8)==undefined?[]:[...B3E8];break;
                case 'Einheit9': test_words = typeof(B1E9)==undefined?[]:[...B3E9];break;
                case 'Einheit10': test_words = typeof(B1E9)==undefined?[]:[...B3E10];break;
            }
            break;
    }

    // 为每个单词添加测试次数
    WORDS_NUM = test_words.length;
    for(let i=0; i<test_words.length; i++){
        test_words[i].index = i;
        test_words[i].test_num = 1;
    }
    // 清零进度条
    root.style.setProperty('--progress-bar-value', "0%");
}

// 随机选取一个单词
function set_word(){
    let number_of_rest_words = test_words.length;
    if(0 == number_of_rest_words){
        
        userconfirm = confirm(Book + " " + Unit + " is finished, again?")
        if(userconfirm){
            get_test_words();
        }else{
            clear();
            return;
        }
        
    }
    current_idx = Math.floor(Math.random()*number_of_rest_words);

    // word的格式 ： 
    // {chinese:"傍晚",type:"nom", gender:"der", word:"Abend", plural:"Abende", example:"Guten Abend", }
    current_word = test_words[current_idx];
    console.log(current_word);
    
    word_chinese.innerText = '[' +TYPE[current_word.type] + '] ' + current_word.chinese;
    word_example.innerText = current_word.example;

    // 检测结果设为不可见
    div_check_gender_result.style.display = "none";
    div_check_answer_word.style.display = "none";
    div_check_plural.style.display = "none";
    input_answer_word.style.display = "inline-block";

    // 非名词，只需要回答对应的单词即可
    if(TYPE[current_word.type] != '名'){
        input_answer_word.focus();

        input_gender.style.display = "none";
        div_plural_gender.style.display = "none";

        input_answer_plural.disabled = true;
        input_answer_plural.style.display="none";
        span_hint_singular.style.display = "none";
        span_hint_plural.style.display="none";
        
    }
    // 名词则需要考虑词性、单复数等问题
    else{
        if(current_word.type === 'none') // 专有名词吴冠词属性
        {
            div_check_gender_result.innerText = "none";
            div_check_gender_result.style.display = "inline-block";
            input_answer_word.focus();

        }else{
            input_gender.style.display = "inline-block";
            input_gender.focus();
        }
        
        
        div_plural_gender.style.display = "inline-block";

        input_answer_plural.disabled = false;
        input_answer_plural.style.visibility="visible";
        input_answer_plural.style.display = "inline-block";

        span_hint_singular.style.display = "inline-block";
        span_hint_plural.style.display="inline-block";
        if(current_word.plural === 'o.Pl'){
            input_answer_plural.style.display = "none";
            div_plural_gender.innerText = 'o.Pl';
        }else{
            input_answer_plural.style.display = "inline-block";
            div_plural_gender.innerText = "die";
        }   
    }
    
    play();
}

//  根据本地音频文件的路径，来进行音频的播放
function play(){
    // 下面是阅读单词
    let message = new SpeechSynthesisUtterance();
    message.voice = speechSynthesis.getVoices().filter(function(voice) {
        return voice.lang == 'de-DE';
    })[1];
    message.lang = 'de-DE'
    // 阅读单词
    message.text = current_word.word;
    speechSynthesis.speak(message);
    // 阅读例句
    // message.text = current_word.example;
    // speechSynthesis.speak(message);    
}

// 把 ä, ö, ü, ß 用 ae, oe, ue, ss 代替
function aue_simplify(str){
    // 正则表达式
    let regex1 = new RegExp('ä', 'g');
    let regex2 = new RegExp('ö', 'g');
    let regex3 = new RegExp('ü', 'g');
    let regex4 = new RegExp('Ä', 'g');
    let regex5 = new RegExp('Ö', 'g');
    let regex6 = new RegExp('Ü', 'g');
    let regex7 = new RegExp('ß', 'g');

    let ans = str.replace(regex1, 'ae');
    ans = ans.replace(regex2, 'oe');
    ans = ans.replace(regex3, 'ue');
    ans = ans.replace(regex4, 'Ae');
    ans = ans.replace(regex5, 'Oe');
    ans = ans.replace(regex6, 'Ue');
    ans = ans.replace(regex7, 'ss');

    return ans;
}

// 对回答结果进行检测
function check_word(){
    current_state = STATE.CHECK;
    
    let ans_gender = input_gender.value     // 输入的词性
    let ans_w = input_answer_word.value;          // 输入的单词
    let ans_p = input_answer_plural.value;        // 如果是负数的话，还要输入负数形式
    let flag = true;

    if(current_word.type === 'nom'){
        // && 
        let ref_plural = "o.Pl";
        let ref_plural_sim = "";
        if(current_word.plural === 'o.Pl'){
            ans_p = "o.Pl";
        }else{
            ref_plural = current_word.plural;
            ref_plural_sim = aue_simplify(ref_plural); // ä, ö, ü, ß 简化后的复数词
        }
        let ref_gender = current_word.gender;//ref_ans[0];
        let ref_word = current_word.word;
        let ref_word_sim = aue_simplify(ref_word);  // ä, ö, ü, ß 简化后的单数词
        let gender_check = (ans_gender === ref_gender);
        let singular_check = (ans_w === ref_word || ans_w === ref_word_sim);
        let plural_check = (ans_p === ref_plural || ans_p === ref_plural_sim) ;

        flag = gender_check && singular_check && plural_check;
        // 名词情况下检查词性是否正确
        input_gender.style.display = "none";
        div_check_gender_result.style.display = "inline-block";
        if(gender_check){
            div_check_gender_result.innerHTML = "<p style=\"color:#2bb91b; \"> " + ans_gender +" </p>" ;
        }else{
            div_check_gender_result.innerHTML = 
            "<p style=\"color:#2bb91b; \">" + ref_gender +"</p>" +
            "<p style=\"color:#ff5132;text-decoration: line-through;\"> " + ans_gender +" </p>" ;
        }

        // 检查名词单数
        input_answer_word.style.display = "none";
        div_check_answer_word.style.display = "inline-block";
        if(singular_check){
            div_check_answer_word.innerHTML = "<p style=\"color:#2bb91b; \"> " + ref_word +" </p>" ;
        }else{
            div_check_answer_word.innerHTML = "<p style=\"color:#2bb91b; \">" + ref_word +"</p>" +
            "<p style=\"color:#ff5132;text-decoration: line-through;\"> " + ans_w +" </p>" ;
        }

        // 检查名词复数的拼写
        if(current_word.plural != 'o.Pl'){
            input_answer_plural.style.display = "none";
            div_check_plural.style.display = "inline-block";
            console.log(ans_p, ref_plural_sim);
            if(plural_check){
                div_check_plural.innerHTML = "<p style=\"color:#2bb91b; \"> " + ref_plural +" </p>" ;
            }else{
                div_check_plural.innerHTML = "<p style=\"color:#2bb91b; \">" + ref_plural +"</p>" +
                "<p style=\"color:#ff5132;text-decoration: line-through;\"> " + ans_p +" </p>" ;
            }
        }
        
    }
    else{ // 非名词的判断，只需要进行单个词的判断即可
        let ref_word = current_word.word.trim();
        let ref_word_sim = aue_simplify(ref_word);  // ä, ö, ü, ß 简化后的单数词

        if(current_word.type === 'trennV' || current_word.type === 'trenV'){ // 可分动词的话，不管有无反斜线都算对
            let ref_word_nohash = ref_word.split("/").join('');
            let ref_word_nohash_sim = aue_simplify(ref_word_nohash);

            flag = (ans_w === ref_word) || (ans_w === ref_word_nohash) || (ans_w === ref_word_nohash_sim);
        }else{
            console.log(ans_w, ref_word_sim);
            flag = (ans_w === ref_word || ans_w === ref_word_sim);
        }

        input_answer_word.style.display = "none";
        div_check_answer_word.style.display = "inline-block";

        if(!flag){
            div_check_answer_word.innerHTML = "<p style=\"color:#2bb91b; \">" + ref_word +"</p>" +
            "<p style=\"color:#ff5132;text-decoration: line-through;\"> " + ans_w +" </p>" ;
        }else{
            div_check_answer_word.innerHTML = "<p style=\"color:#2bb91b; \"> " + ref_word +" </p>" ;
        }
    }



    // 根据最后的正误结果显示对应的图表以及音效
    if(flag){ // correct
        // icon_right.style.visibility="visible";
        // icon_wrong.style.visibility="hidden";
        
        audio_correct.play();
        
        test_words[current_idx] = test_words[test_words.length-1];
        test_words.pop();

    }else{
        // icon_right.style.visibility="hidden";
        // icon_wrong.style.visibility="visible";
        audio_wrong.play();

    }

    let pv = (1.0 - test_words.length / WORDS_NUM)*100;
    let pv_str = pv.toFixed(2) + "%";
    root.style.setProperty('--progress-bar-value', pv_str);
    // console.log(test_words);
    let tmp = aue_simplify(ans_w);
    console.log(test_words.length, WORDS_NUM, pv_str, tmp);
    
    // setTimeout(btn_continue.focus(),500);
}

/* 清除之前的回答 */
function clear(){
    input_answer_word.value = '';


    input_answer_plural.value = '';
    input_answer_plural.style.color = "white";

    input_gender.value = '';

    word_chinese.value = "";
    word_example.value = "";


    
}
/**回车、或者是点击 continue 按钮，开始下一个单词 */
function start_next_word(){
    current_state = STATE.ANSWER;
    clear();
    set_word();
}