# agents.md — 本机开发环境全局规则

> 本文件是项目推进过程中撰写计划/方案时的**环境事实基准**。
> 凡涉及下方工具的任务，规划前必须先核对本清单，禁止假设本机不存在或不匹配的版本。

## 1. 操作系统
- Windows 11 专业版（24H2，build 26100，NT 10.0.26100.0）

## 2. 运行时与语言

### Node.js（单一版本）
- node v24.19.0 — `C:\Program Files\nodejs\node.exe`
- npm 11.17.0 / npx 11.17.0（随 node 内置）
- 全局模块根目录：`C:\Users\Administrator\AppData\Roaming\npm\node_modules`

### Python（多版本，`python` 与 `py` 指向不同版本，注意）
| 命令 | 版本 | 路径 |
| --- | --- | --- |
| `python` | 3.11.6 | `C:\Users\Administrator\AppData\Local\Programs\Python\Python311\python.exe` |
| `py`（默认） | 3.12.10 | `C:\Users\Administrator\AppData\Local\Programs\Python\Python312\python.exe` |
| `python3` | 不可用（商店存根） | `C:\Users\Administrator\AppData\Local\Microsoft\WindowsApps\python3.exe`（0 字节） |

- pip：3.12 → pip 25.0.1；3.11 → pip 23.2.1

## 3. Shell
- Windows PowerShell 5.1（PSVersion 5.1.26100.9444，PSEdition Desktop）
- PowerShell 7（`pwsh`）**未安装**

## 4. 版本控制与构建工具
- git 2.55.0.windows.4 — `C:\Program Files\Git\cmd\git.exe`
- bun 1.3.14（以 npm 全局包方式安装，非独立安装）

## 5. 明确未安装（禁止在计划中假设可用）
- Java / JDK / javac
- Go
- Rust / cargo
- conda / miniconda
- .NET SDK / dotnet
- cmake / make / gcc（C/C++ 工具链）
- Ruby
- Node 版本管理器 nvm / fnm

## 6. 依赖关系要点
- `python`(3.11) 与 `py`(3.12) 是两套独立解释器，各自带独立 pip 与 site-packages；写计划时必须明确用哪一个，禁止混用。
- `python3` 命令会触发 Microsoft Store，不可用于脚本或自动化。
- npm/npx 随 node 24 内置；本机无 nvm，无法切换 node 版本。
- 本仓库为纯前端 + 零依赖 Node 项目（`engines: node >= 14`），实际用 node 24 即可；项目内无 `node_modules`、无 Python venv。

## 7. 规则
1. 撰写项目计划时，工具/运行时版本一律以上表为准，不得凭空假设更高/更低版本或未安装的工具。
2. 涉及 Python 时须显式指定解释器（`py -3.11` / `py -3.12` 或写全路径），避免 `python` 与 `py` 混用。
3. 不得假设存在 Java / Go / Rust / conda / .NET 等未安装工具；若方案需要，先与用户确认安装。