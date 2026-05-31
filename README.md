# DeutscheWoeter · 德语拼写练习

[在线体验（GitHub Pages）](https://messerliang.github.io/DeutscheWoeter/)

纯静态 HTML / JavaScript 德语拼写练习页：看中文释义，写出对应的德语单词（含名词冠词与复数）。无需构建工具，浏览器直接打开 `index.html` 即可使用。

## 功能

- 按**教材系列 + 册**选择词库，整册随机练习（不再按单元划分）
- 名词需输入冠词、单数、复数；动词、形容词等输入词形即可
- 支持 ä / ö / ü / ß 快捷输入
- 单词发音（TTS 生成的 `.wav`），同一单词跨教材共享音频
- 检查后例句高亮显示目标词
- 练习统计与易错词记录（保存在浏览器 `localStorage`）

## 当前词库

| 教材系列 | 册 | 说明 |
|---------|-----|------|
| 新课标德语 | 第一册 / 第二册 / 第三册 | 手打词库，对应原 B1–B3 全部单元 |
| 歌德学院 Deutsch online | A1 | 由 `docs/A1.pdf` 自动提取，约 2000+ 词 |

词库可能有错漏，欢迎自行修正 `Woerter/` 下的 JS 文件。

## 拼写规则

- **名词**：输入冠词（`der` / `die` / `das`）+ 单数 + 复数；无复数填 `o.Pl`
- **可分动词**：词形中用 `/` 分隔前缀，如 `vor/haben`；也接受连写形式
- **形容词、副词、介词等**：直接输入单词，如 `nach`、`übrigens`
- 大小写不敏感；ä/ö/ü/ß 与 ae/oe/ue/ss 等价
- **Enter**：检查答案 → 再次 **Enter**：下一题

## 项目结构

```
DeutscheWoeter/
├── index.html              # 入口页
├── script.js               # 练习逻辑
├── style.css
├── Woerter/
│   ├── curricula.js        # 教材配置（新增教材改这里）
│   ├── word-loader.js      # 自动加载词库脚本
│   ├── word-registry.js    # 词库注册表
│   ├── B1E1.js … B3E5.js   # 新课标德语词库
│   └── goethe_A1.js        # 歌德 A1 词库
├── WoeterAudio/
│   └── shared/             # 共享发音（网页只读此目录）
├── ring/                   # 对错提示音
├── docs/                   # 参考资料（如 A1.pdf）
└── scripts/
    ├── generate_tts.py     # 批量生成 TTS 音频
    └── extract_a1_pdf.py   # 从 PDF 提取词库
```

## 本地运行

直接用浏览器打开 `index.html`，或通过本地静态服务器访问（推荐，避免部分浏览器对 `file://` 的限制）：

```powershell
# 若已安装 Python
python -m http.server 8080
# 浏览器访问 http://localhost:8080
```

## 生成单词发音

使用 [edge-tts](https://github.com/rany2/edge-tts) 批量生成，输出到 `WoeterAudio/shared/`。

```powershell
pip install -r scripts/requirements.txt

# 预览待生成项
python scripts/generate_tts.py --dry-run

# 生成全部缺失音频（跨词库去重）
python scripts/generate_tts.py

# 仅生成歌德 A1
python scripts/generate_tts.py --unit goethe_A1

# 先试 10 条
python scripts/generate_tts.py --unit goethe_A1 --limit 10
```

网页播放需要 **`.wav`** 格式，请安装 [ffmpeg](https://ffmpeg.org/) 并加入 PATH。未安装时脚本会输出 `.mp3`，页面无法播放。

### 音频命名规则

| 类型 | 文件名示例 |
|------|-----------|
| 带冠词名词 | `der_Abend.wav` |
| 动词 / 形容词等 | `abfahren.wav` |
| 无冠词名词 | `Bayern.wav` |

## 新增教材 / 词库

1. 在 `Woerter/` 下新建词库 JS，格式参考 `B1E1.js`：

```javascript
const my_A1 = [
    { chinese: "你好", type: "inter", gender: "nan", word: "Hallo", plural: "nan", example: "Hallo!" },
    { chinese: "苹果", type: "nom", gender: "der", word: "Apfel", plural: "Äpfel", example: "Der Apfel ist rot." },
];
```

2. 在 `Woerter/curricula.js` 的 `CURRICULA` 中追加配置：

```javascript
{
    id: 'mybook',
    name: '我的教材',
    books: [
        {
            id: 'A1',
            label: 'A1',
            sources: [{ sourceKey: 'my_A1', file: 'my_A1.js' }],
        },
    ],
},
```

`sourceKey` 必须与 JS 里的 `const` 变量名一致。保存后刷新页面即可，无需改 `index.html`。

一册可对应多个词库文件（新课标德语即把 `B1E1.js` … `B1E10.js` 合并为第一册）。

## 从 PDF 提取词库

```powershell
python scripts/extract_a1_pdf.py
```

默认读取 `docs/A1.pdf`，输出 `Woerter/goethe_A1.js`。提取结果建议人工抽查词性、复数与例句。

## 词性 `type` 取值

| type | 含义 |
|------|------|
| `nom` | 名词 |
| `inf` | 动词 |
| `adj` | 形容词 |
| `adv` | 副词 |
| `trennV` / `trenV` | 可分动词 |
| `pron` / `konj` / `prap` / `präp` | 代词 / 连词 / 介词 |
| `inter` | 感叹词 |

非名词条目的 `gender`、`plural` 填 `"nan"`；无冠词名词用 `gender: "none"`。

## 许可与说明

个人学习项目。词库内容版权归原作者 / 出版社所有，请仅作个人学习使用。
