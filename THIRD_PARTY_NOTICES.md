# 第三方说明

## PBZ-Editor

存档容器、密钥定位、IoStore、Pak、本地化数据与名称批次的格式参考并改写自：
https://github.com/qry6868/PBZ-Editor

MIT License

Copyright (c) 2026 PBZ Editor contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## ooz 与 ooz-wasm

[ooz](https://github.com/powzix/ooz) 是 Oodle 兼容解压器，按 GPL-3.0-or-later 分发。

原生程序静态编译 [ooz-wasm 上游的 C++ 源码](https://github.com/SnosMe/ooz-wasm/tree/ebed82851988add824e092dc4db320c8fa39aaca/lib)，版本为 `ebed82851988add824e092dc4db320c8fa39aaca`。完整源码和用于 MinGW 的兼容改动在 [native/vendor/ooz](native/vendor/ooz)，许可证见 [GPL-3.0](native/vendor/ooz/LICENSE)。分发原生二进制时需提供对应源码并遵守 GPL-3.0-or-later。

开发验证使用 `ooz-wasm` 2.0.0，版本由 `package-lock.json` 固定。其许可证随 npm 包提供。
