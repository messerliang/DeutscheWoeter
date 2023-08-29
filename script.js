const choose_book = document.getElementById('book');                /* 选择课本 */
const choose_unit = document.getElementById('unit');                /* 选择单元 */
const word_chinese = document.getElementById("word_chinese");       /* 显示中文翻译 */
const word_example = document.getElementById("word_example");       /* 显示例句*/    
const answer_word = document.getElementById("answer_word");         /* 单词回答 */
const answer_plural = document.getElementById("answer_plural");     /* 复数回答 */
const answer_origin = document.getElementById("origin")             /* 显示参考答案 */
const check_button = document.getElementById("check_button")        /* 点击检查输入答案的按钮 */

const icon_right = document.getElementById("right");                /* 正确图标 */
const icon_wrong = document.getElementById("wrong");                 /* 错误图标 */
const check_result = document.getElementById("check_result");
const btn_continue = document.getElementById("continue");
const audio_correct_path = 'sound/correct.mp3';
const audio_wrong_path = 'sound/wrong.mp3';
const audio_finished_path = 'sound/finished.mp3';

const audio_correct = new Audio(audio_correct_path)
const audio_wrong = new Audio(audio_wrong_path)
const audio_finished = new Audio(audio_wrong_path)



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

answer_word.focus();

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

answer_word.addEventListener("keyup",e=>{
    if(e.code != "Enter" || "" === answer_word.value)return;
    
    // 如果是名词，则需要继续输入名词复数
    if(current_word.type === 'nom' && current_word.plural != 'o.Pl'){
        answer_plural.focus();
        return;
    }
    // 如果不是名词，就直接去检查单词拼写
    check_word();
});


/* 鼠标移动到相应区域则 focus */
answer_word.onmouseover = function(event){
    answer_word.focus();
}

/* 复数回答区域输入回车进行单词检测 */
answer_plural.addEventListener("keyup",e=>{
    if(e.code != "Enter")return;
    check_word();
})

/* 按钮点击，则继续进行 */
btn_continue.addEventListener("click",e=>{
    start_next_word();
    answer_word.focus();
})

btn_continue.addEventListener("keyup",e=>{
    if(e.code != "Enter")return;
    start_next_word();
    answer_word.focus();
})

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
    if(TYPE[current_word.type] != '名'){
        answer_plural.disabled = true;
        answer_plural.style.visibility="hidden";
    }
    else{
        answer_plural.disabled = false;
        answer_plural.style.visibility="visible";
        if(current_word.plural == 'o.Pl'){
            answer_plural.value = 'o.Pl';
            answer_plural.disabled = true;
        }
        
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
    message.text = current_word.example;
    speechSynthesis.speak(message);    
}

// 对回答结果进行检测
function check_word(){
    let ans_w = answer_word.value;
    let ans_p = answer_plural.value;
    let flag = false;
    flag = (ans_w === current_word.word)
    if(current_word.type === 'nom' && current_word.plural != 'o.Pl'){
         flag = flag && (ans_p === current_word.plural);
    }

    check_result.style.visibility="visible";
    btn_continue.style.visibility="visible";
    answer_origin.style.visibility="visible";

    if(flag){ // correct
        icon_right.style.visibility="visible";
        icon_wrong.style.visibility="hidden";
        audio_correct.play();
        
        // if(current_word.test_num == 1){// 表示当前单词已经 test 完毕，从数组中移除
        //     test_words[current_word.index] = test_words[test_words.length - 1];
        //     test_words.splice(test_words.length-1, 1);
        // }else{// 单词的 test 次数还没有达到要求，还需进行测试，也就是还保留在测试数组中
        //     current_word.test_num--;
        //     test_words[current_word.index] = current_word;
        // }*

    }else{
        icon_right.style.visibility="hidden";
        icon_wrong.style.visibility="visible";
        audio_wrong.play();

        // // 回答错误则测试次数加一，最大测试次数是3
        // current_word.test_num ++;
        // current_word.test_num = current_word.test_num > 3?3:current_word.test_num;
        // test_words[current_word.index] = current_word;
    }
    test_words[current_idx] = test_words[test_words.length-1]
    test_words.pop()
    let ansstr = current_word.word;
    if(current_word.type === 'nom'){
        ansstr = ansstr + "&nbsp;;&nbsp;" + current_word.plural ;
    }
    ansstr = ansstr + "<br>" + current_word.chinese;
    answer_origin.innerHTML = ansstr;
    // console.log(test_words.length);
    console.log(test_words);
    setTimeout(btn_continue.focus(),500);
}

/* 清除之前的回答 */
function clear(){
    answer_word.value = '';
    answer_plural.value = '';

    word_chinese.value = "";
    word_example.value = "";

    check_result.style.visibility   ="hidden";
    icon_right.style.visibility     ="hidden";
    icon_wrong.style.visibility     ="hidden";
    btn_continue.style.visibility   ="hidden";
    answer_origin.style.visibility  ="hidden";
    
}
/**回车、或者是点击 continue 按钮，开始下一个单词 */
function start_next_word(){
    
    clear();
    set_word();
    console.log("next word");
}