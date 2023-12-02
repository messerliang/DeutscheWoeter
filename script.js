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

const icon_right = document.getElementById("right");                            /* 正确图标 */
const icon_wrong = document.getElementById("wrong");                            /* 错误图标 */
const check_result = document.getElementById("check_result");
const btn_continue = document.getElementById("continue");
const audio_correct_path = 'sound/correct.mp3';
const audio_wrong_path = 'sound/wrong.mp3';
const audio_finished_path = 'sound/finished.mp3';

const audio_correct = new Audio(audio_correct_path)
const audio_wrong = new Audio(audio_wrong_path)
const audio_finished = new Audio(audio_wrong_path)


const STATE = {
    ANSWER: 0,
    CHECK:1,
}
let current_state = STATE.ANSWER; // 当前是在作答阶段还是在检测阶段

const TYPE = {  nom:"名",
                inf:'动',
                adj:'形',
                adv:'副',
                trennV:'可分动词', trenV:'可分动词',
                pron:'代',
                konj:'连',
                prap:'介',
                präp:'介'
            };

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

let test_words = [];
let current_word = {};
let current_idx = 0;




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
    }else if(3 <= input_gender.value.length){
        input_answer_word.focus();
    };
});

input_answer_word.addEventListener("keydown",e=>{
    if("" === input_answer_word.value.trim()){
        if(e.code === "Backspace"){
            input_gender.focus();
        }
        return;
    }
    else{
        if(e.code != "Enter" || "" === input_answer_word.value)
            return;

        // 如果是名词，则需要继续输入名词复数
        if(current_word.type === 'nom' && current_word.plural != 'o.Pl'){
            input_answer_plural.focus();
            return;
        }
        // 如果不是名词，就直接去检查单词拼写
        if(STATE.ANSWER === current_state)
            check_word();
        else{
            start_next_word();
        }
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
        if( STATE.ANSWER === current_state )
        {
            check_word();
        }else{
            start_next_word();
        }
        console.log(current_state);
    }
    
})

/* 按钮点击，则继续进行 */
btn_continue.addEventListener("click",e=>{
    console.log("trigger click");
    start_next_word();
    
})

/* 鼠标移动到相应区域则 focus */
input_gender.onmousemove = function(event){
    input_gender.focus();
}
input_answer_word.onmouseover = function(event){
    input_answer_word.focus();
}
input_answer_plural.onmousemove = function(event){
    input_answer_plural.focus();
}



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
    for(let i=0; i<test_words.length; i++){
        test_words[i].index = i;
        test_words[i].test_num = 1;
    }
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

    // word的格式 ： {chinese:"富于想象的",type:"adj",word:"phantasievoll",example:"Die Amerikaner sind phantasievoll"},
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
        input_answer_plural.style.visibility="hidden";
        span_hint_singular.style.display = "none";
        span_hint_plural.style.display="none";
        
    }
    // 名词则需要考虑词性、单复数等问题
    else{
        input_gender.style.display = "inline-block";
        
        div_plural_gender.style.display = "inline-block";

        input_answer_plural.disabled = false;
        input_answer_plural.style.visibility="visible";
        input_answer_plural.style.display = "inline-block";

        span_hint_singular.style.display = "inline-block";
        span_hint_plural.style.display="inline-block";
        if(current_word.plural == 'o.Pl'){
            input_answer_plural.value = 'o.Pl';
            input_answer_plural.disabled = true;
            div_plural_gender.style.visibility = "hidden";
        }

        input_gender.focus();
        
    }
    
    play();
}

//  使用系统自带的语音播放音频
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

// 对回答结果进行检测
function check_word(){
    current_state = STATE.CHECK;
    
    let ans_gender = input_gender.value     // 输入的词性
    let ans_w = input_answer_word.value;          // 输入的单词
    let ans_p = input_answer_plural.value;        // 如果是负数的话，还要输入负数形式
    let flag = true;

    if(current_word.type === 'nom'){
        // && 
        let ref_plural = "o.pl";
        if(current_word.plural === 'o.Pl'){
            ans_p = "o.Pl";
        }else{
            ref_plural = current_word.plural.split(" ")[1];
        }
        let ref_ans = current_word.word.split(" ");
        let ref_gender = ref_ans[0];
        let ref_word = ref_ans[1];
        flag = (ans_gender === ref_gender && ans_w === ref_word && ans_p === ref_plural);
        // 名词情况下检查词性是否正确
        input_gender.style.display = "none";
        div_check_gender_result.style.display = "inline-block";
        if(ans_gender != ref_gender){
            
            div_check_gender_result.innerHTML = 
            "<p style=\"color:#2bb91b; \">" + ref_gender +"</p>" +
            "<p style=\"color:#ff5132;text-decoration: line-through;\"> " + ans_gender +" </p>" ;
        }else{
            div_check_gender_result.innerHTML = "<p style=\"color:#2bb91b; \"> " + ans_gender +" </p>" ;
        }

        // 检查名词单数
        input_answer_word.style.display = "none";
        div_check_answer_word.style.display = "inline-block";
        if(ans_w != ref_word){
            div_check_answer_word.innerHTML = "<p style=\"color:#2bb91b; \">" + ref_word +"</p>" +
            "<p style=\"color:#ff5132;text-decoration: line-through;\"> " + ans_w +" </p>" ;
        }else{
            div_check_answer_word.innerHTML = "<p style=\"color:#2bb91b; \"> " + ans_w +" </p>" ;
        }

        // 检查名词复数的拼写
        input_answer_plural.style.display = "none";
        div_check_plural.style.display = "inline-block";
        if(ans_p != ref_plural){
            div_check_plural.innerHTML = "<p style=\"color:#2bb91b; \">" + ref_plural +"</p>" +
            "<p style=\"color:#ff5132;text-decoration: line-through;\"> " + ans_p +" </p>" ;
        }else{
            div_check_plural.innerHTML = "<p style=\"color:#2bb91b; \"> " + ans_p +" </p>" ;
        }
    }

    check_result.style.visibility="visible";
    btn_continue.style.visibility="visible";


    // 根据最后的正误结果显示对应的图表以及音效
    if(flag){ // correct
        icon_right.style.visibility="visible";
        icon_wrong.style.visibility="hidden";
        // input_answer_word.style.color = "#2bb91b";
        // input_answer_word.style.fontWeight="bold";
        // input_answer_plural.style.color = "#2bb91b";
        // input_answer_plural.style.fontWeight="bold";
        audio_correct.play();
        
        test_words[current_idx] = test_words[test_words.length-1];
        test_words.pop();

    }else{
        icon_right.style.visibility="hidden";
        icon_wrong.style.visibility="visible";
        audio_wrong.play();

    }

    let ansstr = current_word.word;
    if(current_word.type === 'nom'){
        ansstr = ansstr + "&nbsp;;&nbsp;" + current_word.plural ;
    }
    ansstr = ansstr + "<br>" + current_word.chinese;

    console.log(test_words);
    word_chinese.focus();
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

    check_result.style.visibility   ="hidden";
    icon_right.style.visibility     ="hidden";
    icon_wrong.style.visibility     ="hidden";
    btn_continue.style.visibility   ="hidden";
    
}
/**回车、或者是点击 continue 按钮，开始下一个单词 */
function start_next_word(){
    current_state = STATE.ANSWER;
    clear();
    set_word();
}