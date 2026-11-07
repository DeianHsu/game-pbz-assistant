using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;
using System.Windows.Forms;
using Row = System.Collections.Generic.Dictionary<string, object>;

namespace PBZ.Native
{
    internal sealed class Window : Form
    {
        static readonly string[] Pages = { "行前检查", "地图收集", "全收集品", "任务路线", "成就", "小张珍宝", "资料来源" };
        static readonly Color Background = Color.FromArgb(22, 29, 37);
        static readonly Color Ink = Color.FromArgb(30, 40, 48);
        static readonly Color Muted = Color.FromArgb(82, 99, 108);
        static readonly Color Danger = Color.FromArgb(163, 51, 41);
        static readonly Row Status = Data.Make("done", "已收集", "missing", "未收集", "unknown", "待核实");
        static readonly StringComparer ColumnTextOrder = StringComparer.Create(CultureInfo.GetCultureInfo("zh-CN"), true);
        static readonly int[] CollectionWidths = { 165, 100, 196, 94, 108, 145, 134 };
        readonly ComboBox account = Combo(150), slot = Combo(260);
        readonly ComboBox region = Combo(178), category = Combo(144), filter = Combo(156);
        readonly TextBox search = new TextBox { Width = 184 };
        readonly ListBox nav = new ListBox { Dock = DockStyle.Fill, IntegralHeight = false, BorderStyle = BorderStyle.None, DrawMode = DrawMode.OwnerDrawFixed, ItemHeight = 48 };
        readonly ListView list = new ListView { Dock = DockStyle.Fill, View = View.Details, FullRowSelect = true, HideSelection = false, MultiSelect = false, BorderStyle = BorderStyle.None, UseCompatibleStateImageBehavior = false };
        readonly RichTextBox detail = new RichTextBox { Dock = DockStyle.Fill, ReadOnly = true, DetectUrls = true, BorderStyle = BorderStyle.None, BackColor = Color.White, ForeColor = Ink, ScrollBars = RichTextBoxScrollBars.Vertical };
        readonly Label overview = new Label { Dock = DockStyle.Fill, TextAlign = ContentAlignment.MiddleLeft, ForeColor = Color.White, AutoEllipsis = true };
        readonly Label status = new Label { Dock = DockStyle.Fill, TextAlign = ContentAlignment.MiddleLeft, ForeColor = Muted, AutoEllipsis = true };
        readonly Label title = new Label { Dock = DockStyle.Fill, TextAlign = ContentAlignment.MiddleLeft, ForeColor = Ink };
        readonly Button refresh = new Button { Text = "重新读取存档", AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink, Padding = new Padding(9, 1, 9, 1) };
        readonly SplitContainer split = new SplitContainer { Dock = DockStyle.Fill, Orientation = Orientation.Horizontal, SplitterWidth = 5, BackColor = Color.FromArgb(224, 231, 235) };
        readonly string[] rememberedRegion = new string[Pages.Length], rememberedCategory = new string[Pages.Length], rememberedFilter = new string[Pages.Length], rememberedSearch = new string[Pages.Length];
        readonly int[] sortColumns = Enumerable.Repeat(-1, Pages.Length).ToArray();
        readonly bool[] sortDescending = new bool[Pages.Length];
        Catalog catalog;
        string game;
        string[] files;
        Account[] saves;
        Progress progress;
        Collections collections;
        QuestNavigation navigation;
        Row[] achievementPlans;
        bool updating, busy;
        int page;

        sealed class Choice
        {
            public readonly string Value, Text;
            public Choice(string value, string text) { Value = value; Text = text; }
            public override string ToString() { return Text; }
        }
        sealed class ViewRow
        {
            public string[] Cells;
            public string Text, Group, Gate, Achievement;
            public bool Warning;
            public long? Money;
            public ViewRow(string[] cells, string text, string group = null) { Cells = cells; Text = text; Group = group; }
        }
        static ComboBox Combo(int width) { return new ComboBox { DropDownStyle = ComboBoxStyle.DropDownList, Width = width, IntegralHeight = true, DropDownHeight = 320 }; }
        static string Selected(ComboBox combo) { return combo.SelectedItem == null ? "" : ((Choice)combo.SelectedItem).Value; }
        static void Set(ComboBox combo, IEnumerable<Choice> choices, string chosen)
        {
            var options = choices.ToArray();
            combo.BeginUpdate();
            try
            {
                combo.Items.Clear();
                combo.Items.AddRange(options);
                int index = Array.FindIndex(options, option => option.Value == chosen);
                combo.SelectedIndex = options.Length == 0 ? -1 : Math.Max(0, index);
                combo.Visible = options.Length > 1;
            }
            finally { combo.EndUpdate(); }
        }
        static Choice Option(string value, string text) { return new Choice(value, text); }
        static Choice[] Options(params string[] choices) { return choices.Select((text, index) => Option(index.ToString(), text)).ToArray(); }
        static Label Label(string text, Color color) { return new Label { Text = text, AutoSize = true, ForeColor = color, Margin = new Padding(4, 7, 3, 0) }; }

        public Window()
        {
            Text = "影之刃零 · 行前检查";
            Font = new Font("Microsoft YaHei UI", 10);
            AutoScaleMode = AutoScaleMode.Dpi;
            StartPosition = FormStartPosition.CenterScreen;
            Size = new Size(1200, 850);
            MinimumSize = new Size(850, 590);
            BackColor = Color.FromArgb(242, 245, 247);
            var frame = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 2, RowCount = 1 };
            frame.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 156));
            frame.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
            var sidebar = new TableLayoutPanel { Dock = DockStyle.Fill, BackColor = Background, RowCount = 3, ColumnCount = 1, Margin = new Padding(0) };
            sidebar.RowStyles.Add(new RowStyle(SizeType.Absolute, 88));
            sidebar.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
            sidebar.RowStyles.Add(new RowStyle(SizeType.Absolute, 50));
            var brand = new Label { Text = "影之刃零\r\n行前检查", Dock = DockStyle.Fill, ForeColor = Color.White, TextAlign = ContentAlignment.MiddleCenter,
                Font = new Font(Font.FontFamily, 14, FontStyle.Bold) };
            nav.BackColor = Background;
            nav.ForeColor = Color.White;
            nav.Items.AddRange(Pages);
            nav.DrawItem += DrawNav;
            sidebar.Controls.Add(brand, 0, 0);
            sidebar.Controls.Add(nav, 0, 1);
            sidebar.Controls.Add(new Label { Text = "本机 Steam · 只读", Dock = DockStyle.Fill, ForeColor = Color.LightSteelBlue, TextAlign = ContentAlignment.MiddleCenter }, 0, 2);

            var body = new TableLayoutPanel { Dock = DockStyle.Fill, RowCount = 6, ColumnCount = 1, Margin = new Padding(0), Padding = new Padding(16, 12, 16, 8) };
            foreach (int height in new[] { 43, 40, 55, 41 }) body.RowStyles.Add(new RowStyle(SizeType.Absolute, height));
            body.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
            body.RowStyles.Add(new RowStyle(SizeType.Absolute, 32));
            var savesBar = new FlowLayoutPanel { Dock = DockStyle.Fill, WrapContents = false, AutoScroll = true, Margin = new Padding(0) };
            savesBar.Controls.Add(Label("账号", Ink));
            savesBar.Controls.Add(account);
            savesBar.Controls.Add(Label("槽位", Ink));
            savesBar.Controls.Add(slot);
            savesBar.Controls.Add(refresh);
            var banner = new Panel { Dock = DockStyle.Fill, BackColor = Background, Padding = new Padding(12, 0, 12, 0), Margin = new Padding(0, 0, 0, 4) };
            banner.Controls.Add(overview);
            title.Font = new Font(Font.FontFamily, 18, FontStyle.Bold);
            var filterBar = new FlowLayoutPanel { Dock = DockStyle.Fill, WrapContents = false, AutoScroll = true, Margin = new Padding(0) };
            filterBar.Controls.AddRange(new Control[] { region, category, filter, Label("搜索", Ink), search });
            split.Panel1.Controls.Add(list);
            var detailFrame = new Panel { Dock = DockStyle.Fill, BackColor = Color.White, Padding = new Padding(13, 7, 8, 5) };
            detailFrame.Controls.Add(detail);
            split.Panel2.Controls.Add(detailFrame);
            split.SizeChanged += delegate
            {
                if (split.Height > 300 && split.SplitterDistance < 110)
                    split.SplitterDistance = split.Height * 58 / 100;
            };
            body.Controls.Add(savesBar, 0, 0);
            body.Controls.Add(banner, 0, 1);
            body.Controls.Add(title, 0, 2);
            body.Controls.Add(filterBar, 0, 3);
            body.Controls.Add(split, 0, 4);
            body.Controls.Add(status, 0, 5);
            frame.Controls.Add(sidebar, 0, 0);
            frame.Controls.Add(body, 1, 0);
            Controls.Add(frame);
            nav.SelectedIndexChanged += delegate
            {
                if (nav.SelectedIndex < 0) return;
                page = nav.SelectedIndex;
                Configure();
            };
            account.SelectedIndexChanged += delegate { if (!updating) SelectAccount(); };
            slot.SelectedIndexChanged += async delegate { if (!updating) await Analyze(); };
            region.SelectedIndexChanged += delegate { if (!updating) { rememberedRegion[page] = Selected(region); Populate(); } };
            category.SelectedIndexChanged += delegate { if (!updating) { rememberedCategory[page] = Selected(category); Populate(); } };
            filter.SelectedIndexChanged += delegate { if (!updating) { rememberedFilter[page] = Selected(filter); Populate(); } };
            search.TextChanged += delegate { if (!updating) { rememberedSearch[page] = search.Text; Populate(); } };
            list.SelectedIndexChanged += delegate { ShowDetails(); };
            list.ColumnClick += delegate(object sender, ColumnClickEventArgs e) { SortColumn(e.Column); };
            list.DoubleClick += delegate { FollowSelection(); };
            detail.LinkClicked += delegate(object sender, LinkClickedEventArgs e) { OpenLink(e.LinkText); };
            refresh.Click += async delegate { await Reload(); };
            KeyPreview = true;
            KeyDown += async delegate(object sender, KeyEventArgs e) { if (e.KeyCode == Keys.F5) { e.Handled = true; await Reload(); } };
            nav.SelectedIndex = 0;
            Shown += async delegate { split.SplitterDistance = split.Height * 58 / 100; await Reload(); };
        }

        void DrawNav(object sender, DrawItemEventArgs e)
        {
            if (e.Index < 0) return;
            bool selected = (e.State & DrawItemState.Selected) != 0;
            using (var brush = new SolidBrush(selected ? Color.FromArgb(43, 66, 78) : Background)) e.Graphics.FillRectangle(brush, e.Bounds);
            if (selected) using (var brush = new SolidBrush(Color.FromArgb(122, 211, 188))) e.Graphics.FillRectangle(brush, e.Bounds.Left, e.Bounds.Top, 4, e.Bounds.Height);
            TextRenderer.DrawText(e.Graphics, Pages[e.Index], Font, new Rectangle(e.Bounds.X + 18, e.Bounds.Y, e.Bounds.Width - 18, e.Bounds.Height),
                Color.White, TextFormatFlags.Left | TextFormatFlags.VerticalCenter);
        }
        void SetBusy(bool value, string message)
        {
            busy = value;
            account.Enabled = slot.Enabled = refresh.Enabled = !value;
            if (message != null) status.Text = message;
        }
        async Task Reload()
        {
            if (busy) return;
            SetBusy(true, "正在查找游戏并读取存档…");
            int selected = account.SelectedIndex;
            string previousFile = files != null && selected >= 0 && selected < files.Length ? files[selected] : "";
            string previousSlot = Selected(slot);
            try
            {
                var loaded = await Task.Run(() =>
                {
                    string path = GameDiscovery.FindGame();
                    string[] found = GameDiscovery.FindSaves(path);
                    var metadata = catalog != null && path == game ? catalog : new Catalog(path);
                    return new { Path = path, Files = found, Catalog = metadata, Accounts = found.Select(file => SaveReader.Read(path, file)).ToArray() };
                });
                if (IsDisposed) return;
                game = loaded.Path;
                catalog = loaded.Catalog;
                files = loaded.Files;
                saves = loaded.Accounts;
                updating = true;
                Set(account, files.Select((file, index) => Option(index.ToString(), "本地存档 " + (index + 1))), Array.IndexOf(files, previousFile).ToString());
                account.Visible = true;
                updating = false;
                SetSlots(previousSlot);
                await Analyze(true);
            }
            catch (Exception error) { if (!IsDisposed) SetBusy(false, "读取失败：" + error.Message + "。可按 F5 重试。"); }
        }
        void SetSlots(string preferred)
        {
            if (saves == null || account.SelectedIndex < 0) return;
            Account selected = saves[account.SelectedIndex];
            updating = true;
            Set(slot, selected.Slots.Select(name => Option(name, (name == selected.Preferred ? "继续游戏 · " : "") + name + " · " + selected.Time(name))),
                selected.Slots.Contains(preferred) ? preferred : selected.Preferred);
            slot.Visible = true;
            updating = false;
        }
        async void SelectAccount()
        {
            SetSlots("");
            await Analyze();
        }
        async Task Analyze(bool fromReload = false)
        {
            if ((!fromReload && busy) || saves == null || account.SelectedIndex < 0 || slot.SelectedIndex < 0) return;
            SetBusy(true, "正在核对任务、成就和收集记录…");
            Account selected = saves[account.SelectedIndex];
            string selectedSlot = Selected(slot);
            try
            {
                var data = await Task.Run(() =>
                {
                    var p = new Progress(catalog, selected, selectedSlot);
                    var c = new Collections(p);
                    return new { Progress = p, Collections = c, Navigation = new QuestNavigation(p, c) };
                });
                if (IsDisposed) return;
                ShowData(data.Progress, data.Collections, data.Navigation);
                status.Text = "存档保存于 " + selected.Time(selectedSlot) + "  ·  读取于 " + DateTime.Now.ToString("HH:mm:ss") +
                    (catalog.Warnings.Count == 0 ? "" : "  ·  " + string.Join("  ", catalog.Warnings));
            }
            catch (Exception error) { if (!IsDisposed) status.Text = "分析失败：" + error.Message; }
            finally { if (!IsDisposed) SetBusy(false, null); }
        }
        internal void ShowData(Progress p, Collections c, QuestNavigation n)
        {
            progress = p;
            collections = c;
            navigation = n;
            achievementPlans = new AchievementPlan(p, c, n).Rows;
            string location = c.Regions.FirstOrDefault(r => r.Flag("current")).S("name").Or(p.Location);
            overview.Text = p.StageInfo.S("name") + "  ·  " + location + "  ·  最近铃铛 " + p.Bell.Or("未记录") +
                "  ·  第 " + (p.Cycle < 0 ? "?" : (p.Cycle + 1).ToString()) + " 周目";
            Configure();
        }
        void Configure()
        {
            title.Text = Pages[page];
            updating = true;
            search.Text = rememberedSearch[page] ?? "";
            IEnumerable<Choice> regions = new Choice[0], categories = new Choice[0];
            Choice[] filters;
            string defaultRegion = "";
            switch (page)
            {
                case 0:
                    filters = Options("当前待办", "需现场核对", "关联成就", "全部阶段", "已满足");
                    break;
                case 1:
                    filters = Options("当前可查", "暂不可取", "已收集", "全部点位");
                    if (collections != null)
                    {
                        regions = collections.Regions.Select(r => Option(r.S("id"), r.S("name") + " · " + r.N("done") + "/" + r.N("total")));
                        categories = new[] { Option("", "全部类别") }.Concat(Progress.Guides.Rows("collectionCategories").Select(c => Option(c.S("id"), c.S("name"))));
                        defaultRegion = collections.SelectedMap;
                    }
                    break;
                case 2:
                    filters = Options("当前及已开放地区", "暂不可取", "已收集", "全部目录");
                    if (collections != null)
                    {
                        regions = new[] { Option("", "全部地区") }.Concat(collections.Regions.Select(r => Option(r.S("id"), r.S("name"))));
                        categories = new[] { Option("", "全部类别") }.Concat(collections.Categories.Select(c => Option(c.S("id"), c.S("name") + " · " + c.N("done") + "/" + c.N("total"))));
                    }
                    break;
                case 3:
                    filters = Options("当前目标", "风险优先", "暂不可触发", "已完成", "全部任务");
                    if (navigation != null)
                    {
                        regions = new[] { Option("", "全部地区") }.Concat(navigation.Quests.SelectMany(q => q.Rows("targets"))
                            .GroupBy(t => t.S("mapId")).OrderBy(g => g.Key == "unknown").Select(g => Option(g.Key, g.First().S("mapName"))));
                        categories = new[] { Option("", "全部任务类型"), Option("Main", "主线"), Option("Branch", "迷局"), Option("Simple", "异闻"), Option("Collect", "收集") };
                    }
                    break;
                case 4:
                    filters = Options("前置已满足", "暂不可取", "已解锁", "全部成就");
                    if (progress != null) categories = new[] { Option("", "全部分类") }.Concat(progress.Achievements.Select(a => a.S("category")).Distinct().Select(c => Option(c, c)));
                    break;
                case 5:
                    filters = Options("当前待收集或交付", "已交付", "全部地区");
                    break;
                default: filters = new Choice[0]; break;
            }
            Set(region, regions, rememberedRegion[page] ?? defaultRegion);
            Set(category, categories, rememberedCategory[page] ?? "");
            Set(filter, filters, rememberedFilter[page] ?? "0");
            updating = false;
            Populate();
        }

        static string Lines(params string[] lines) { return string.Join("\r\n", lines.Where(line => !string.IsNullOrWhiteSpace(line))); }
        static string Labelled(string label, string value) { return value == "" ? "" : label + "  " + value; }
        static string Steps(IEnumerable<string> steps) { return Lines(steps.Where(step => step != "").Select((step, i) => (i + 1) + ". " + step).ToArray()); }
        static string Sources(params string[] sources) { return Lines(sources.Where(s => s != "").Distinct().ToArray()); }
        string AchievementNames(Row row)
        {
            return string.Join("、", row.Strings("achievements").Select(id => progress.Achievements.FirstOrDefault(a => a.S("id") == id).S("name").Or(id)));
        }
        IEnumerable<ViewRow> RiskRows(string mode)
        {
            foreach (Row gate in progress.Gates)
            {
                if (mode != "3" && (!gate.Flag("available") || gate.Flag("planning") && !(gate.S("id") == "cleanup" && progress.StageInfo.Flag("finished")))) continue;
                foreach (Row item in gate.Rows("items"))
                {
                    bool done = item.Flag("satisfied");
                    if (mode != "3" && !item.Flag("available") || mode == "4" && !done || mode != "3" && mode != "4" && done) continue;
                    if (mode == "1" && item.S("mode") != "manual" || mode == "2" && item.Strings("achievements").Length == 0) continue;
                    string detailText = Lines(item.S("title"), gate.S("note"), item.S("action"), Labelled("进度", item.S("progress")),
                        Labelled("当前目标", string.Join("、", item.Strings("current"))), Labelled("判断依据", item.S("evidence")),
                        Labelled("关联成就", AchievementNames(item)), item.S("impact"), item.S("riskNote"), item.S("verification"),
                        Lines(item.Rows("riskDetails").Select(d => Lines(d.S("label") + " · " + d.S("text"), Labelled("附近铃铛", d.S("bell")), d.S("route"), d.S("flower"))).ToArray()),
                        Sources(item.S("source"), item.Rows("riskDetails").Length == 0 ? "" : Progress.Guides.Get("sources").Get("chivalry").S("url")));
                    string state = done ? "已满足" : gate.Flag("passed") ? "已跨过，需复核" : item.S("stateLabel");
                    yield return new ViewRow(new[] { item.S("title"), state, item.S("progress"), AchievementNames(item) }, detailText, gate.S("name")) {
                        Warning = !done && (gate.Flag("passed") || item.S("state") == "failed"),
                        Achievement = item.Strings("achievements").FirstOrDefault(), Gate = gate.S("id")
                    };
                }
            }
        }
        IEnumerable<ViewRow> CollectionRows(string mode, bool global)
        {
            string map = Selected(region), kind = Selected(category);
            Row mapRow = collections.Regions.FirstOrDefault(r => r.S("id") == map);
            IEnumerable<Row> rows = global ? collections.Items : mapRow.Rows("points");
            if (global && map != "") rows = rows.Where(r => r.Strings("regionIds").Contains(map));
            var labels = (global ? collections.Categories : Progress.Guides.Rows("collectionCategories")).ToDictionary(r => r.S("id"), r => r.S("name"));
            foreach (Row item in rows)
            {
                if (kind != "" && !Collections.MatchesCategory(item, kind)) continue;
                Row access = item.Get("access").Dict(), guide = item.Get("guide").Dict();
                bool done = item.S("state") == "done", locked = access.S("state") == "locked";
                if (mode == "0" && (done || locked || global && !item.Flag("available"))) continue;
                if (mode == "1" && (done || !locked) || mode == "2" && !done) continue;
                string name = item.S("name"), bell = item.S("bell").Or(guide.S("bell")).Or(item.Rows("nearest").FirstOrDefault().S("name"));
                string place = global ? string.Join("、", item.Strings("regionNames")) : item.S("regionName");
                string group;
                string groupId = kind.Or(item.S("category"));
                if (!labels.TryGetValue(groupId, out group)) group = groupId;
                string money = item.S("moneyText"), materials = item.S("materialsText"), state = Status.S(item.S("state"));
                string detailText = Lines(name, item.S("subtitle"), Labelled("意识尘埃", money), Labelled("武器材料", materials),
                    item.S("description"), Labelled("地区", place), Labelled("附近铃铛", bell),
                    access.S("reason"), Steps(global ? item.Strings("steps") : guide.Strings("steps")),
                    Lines(item.Rows("nearest").Select(b => b.S("name") + " 约 " + b.N("distance") + " 米" + (b.Flag("activated") ? "（已激活）" : "")).ToArray()),
                    Labelled("游戏标识", item.S("id").Or(item.S("key"))), Sources(guide.S("source"), guide.S("mapUrl"), access.S("source")));
                string[] cells = global ? new[] { name, money, materials, state, access.S("label"), bell, place }
                    : new[] { name, state, access.S("label"), bell, place };
                yield return new ViewRow(cells, detailText, group) { Money = item.Get("moneySort") as long? };
            }
        }
        IEnumerable<ViewRow> QuestRows(string mode)
        {
            string map = Selected(region), kind = Selected(category);
            foreach (Row quest in navigation.Quests.OrderBy(q => q.S("riskLevel") == "urgent" ? 0 : q.S("riskLevel") == "warning" ? 1 : 2))
            {
                bool done = quest.S("state") == "done";
                if (kind != "" && quest.S("type") != kind || mode == "3" && !done || mode != "3" && mode != "4" && done) continue;
                var targets = quest.Rows("targets");
                if (targets.Length == 0 && (mode == "3" || mode == "4")) targets = new[] { Data.Make("mapName", done ? "已完成" : "当前无需处理") };
                foreach (Row target in targets)
                {
                    if (map != "" && target.S("mapId") != map) continue;
                    Row access = target.Get("access").Dict();
                    bool blocked = access.S("state") == "locked" || access.S("state") == "unknown";
                    bool risk = quest.S("riskLevel") == "urgent" || quest.S("riskLevel") == "warning";
                    if (mode == "0" && (!quest.Flag("recorded") || blocked) || mode == "1" && !risk || mode == "2" && !blocked) continue;
                    Row[] risks = quest.Rows("risks").Where(r => r.S("level") != "future" || mode == "4").ToArray();
                    string achievement = string.Join("、", Progress.Guides.Get("questAchievements").Strings(quest.S("id")).Select(id =>
                        progress.Achievements.FirstOrDefault(a => a.S("id") == id).S("name").Or(id)));
                    string text = Lines(quest.S("name") + " · " + quest.S("stateLabel"), Labelled("目标", target.S("objective")),
                        Labelled("人物或触发点", target.S("person")), Labelled("附近铃铛", target.S("bell")), target.S("details"),
                        target.S("next"), access.S("reason"), Labelled("关联成就", achievement),
                        Lines(risks.Select(r => Lines("风险 · " + r.S("gateName") + " · " + r.S("title"), r.S("action"), r.S("impact"))).ToArray()),
                        Sources(new[] { target.S("source") }.Concat(risks.Select(r => r.S("source"))).ToArray()));
                    yield return new ViewRow(new[] { quest.S("name"), quest.S("stateLabel"), target.S("person"), access.S("label"), risk ? "需留意" : "" },
                        text, target.S("mapName").Or("目标地区待定位")) { Warning = risk, Gate = risks.FirstOrDefault().S("gateId") };
                }
            }
        }
        IEnumerable<ViewRow> AchievementRows(string mode)
        {
            string kind = Selected(category);
            string state = mode == "1" ? "locked" : mode == "2" ? "done" : mode == "3" ? "" : "ready";
            foreach (Row a in achievementPlans)
            {
                if (state != "" && a.S("availability") != state || kind != "" && a.S("category") != kind) continue;
                Row counter = a.Get("progress") as Row;
                string progressText = counter == null ? "" : (counter.Get("value") == null ? "?" : counter.N("value").ToString()) + "/" + counter.N("target") + " " + counter.S("unit");
                string id = a.S("id");
                var gates = progress.Gates.Where(g => g.Rows("items").Any(i => i.Strings("achievements").Contains(id) || i.S("achievement") == id)).ToArray();
                string text = Lines(a.S("name") + " · " + a.S("availabilityLabel"), Labelled("达成条件", a.S("description")),
                    Labelled("当前判断", a.S("availabilityReason")), Labelled("进度", progressText), counter.S("scope"),
                    Lines(a.Rows("risks").Where(r => r.Flag("available") && !r.Flag("optional") && a.S("state") != "done")
                        .Select(r => "留意：" + r.S("gateName") + " · " + r.S("title")).Distinct().ToArray()),
                    Labelled("完成步骤", string.Join("\r\n", a.Strings("steps").Select((step, index) => (index + 1) + ". " + step))),
                    Lines(a.Strings("notes")), Labelled("相关行前节点", string.Join("、", gates.Select(g => g.S("name")))), a.S("planSource"));
                string group = (mode == "3" ? a.S("availabilityLabel") + " · " : "") + a.S("category");
                yield return new ViewRow(new[] { a.S("name"), a.S("availabilityLabel"), a.S("currentRequirement"), progressText }, text, group) {
                    Warning = a.Flag("warning"),
                    Gate = gates.FirstOrDefault(g => g.Flag("available")).S("id").Or(gates.FirstOrDefault().S("id"))
                };
            }
        }
        IEnumerable<ViewRow> TreasureRows(string mode)
        {
            foreach (Row group in progress.Treasures)
            {
                bool handedIn = group.Flag("handedIn"), complete = group.Flag("collected");
                if (mode == "0" && (handedIn || progress.Rank < progress.TreasureRank(group.S("branch"))) || mode == "1" && !handedIn) continue;
                Row[] items = group.Rows("items");
                string count = items.Count(i => i.Flag("owned")) + "/" + items.Length;
                string state = handedIn ? "已交付" : complete ? "已收齐，待交付" : "尚有缺项";
                string text = Lines(group.S("name") + " · " + state, "本周目 " + count,
                    Lines(items.Select(i => i.S("name") + " · " + (i.Flag("owned") ? "已取得" : i.Flag("known") ? "未取得" : "待核实")).ToArray()),
                    Progress.Guides.Get("sources").Get("treasures").S("url"));
                if (mode == "0" && !complete)
                    foreach (Row item in items.Where(i => !i.Flag("owned")))
                        yield return new ViewRow(new[] { item.S("name"), item.Flag("known") ? "未取得" : "待核实", count }, text, group.S("name"));
                else yield return new ViewRow(new[] { group.S("name"), state, count }, text, group.S("name"));
            }
        }

        void SortColumn(int column)
        {
            sortDescending[page] = sortColumns[page] == column && !sortDescending[page];
            sortColumns[page] = column;
            Populate();
        }

        void Populate()
        {
            string mode = Selected(filter).Or("0"), query = search.Text.Trim();
            var columns = new[] { "名称", "状态" };
            IEnumerable<ViewRow> rows = new ViewRow[0];
            if (progress != null)
            {
                switch (page)
                {
                    case 0: columns = new[] { "待办检查", "状态", "进度", "关联成就" }; rows = RiskRows(mode); break;
                    case 1: columns = new[] { "收集品", "收集状态", "路线状态", "最近铃铛", "地区" }; rows = CollectionRows(mode, false); break;
                    case 2:
                        columns = new[] { "收集品", "意识尘埃", "武器材料", "收集状态", "路线状态", "最近铃铛", "地区" };
                        rows = CollectionRows(mode, true);
                        break;
                    case 3: columns = new[] { "任务", "日志状态", "人物或触发点", "可用情况", "风险" }; rows = QuestRows(mode); break;
                    case 4: columns = new[] { "成就", "可用情况", "达成要求", "进度" }; rows = AchievementRows(mode); break;
                    case 5: columns = new[] { "珍宝或地区", "状态", "进度" }; rows = TreasureRows(mode); break;
                    case 6:
                        columns = new[] { "资料", "来源" };
                        rows = Progress.Guides.Get("sources").Dict().Values.Select(source =>
                            new ViewRow(new[] { source.S("title"), source.S("url") }, Lines(source.S("title"), source.S("url"))));
                        break;
                }
            }
            int sort = sortColumns[page];
            bool descending = sortDescending[page];
            if (sort >= columns.Length) sort = -1;
            if (sort >= 0)
            {
                if (page == 2 && sort == 1)
                    rows = rows.OrderBy(row => !row.Money.HasValue).ThenBy(row => descending ? -row.Money : row.Money);
                else
                {
                    var nonempty = rows.OrderBy(row => string.IsNullOrEmpty(row.Cells[sort]));
                    rows = descending ? nonempty.ThenByDescending(row => row.Cells[sort], ColumnTextOrder)
                        : nonempty.ThenBy(row => row.Cells[sort], ColumnTextOrder);
                }
            }
            list.BeginUpdate();
            try
            {
                list.Items.Clear();
                list.Groups.Clear();
                list.Columns.Clear();
                for (int i = 0; i < columns.Length; i++)
                {
                    int width = page == 2 && progress != null ? CollectionWidths[i]
                        : i == 0 ? 245 : columns[i] == "人物或触发点" || columns[i] == "关联成就" ? 250
                        : columns[i] == "来源" ? 490 : columns[i] == "达成要求" ? 320 : columns[i] == "最近铃铛" ? 168 : 136;
                    list.Columns.Add(columns[i] + (sort == i ? descending ? " ↓" : " ↑" : ""), width);
                }
                var groups = new Dictionary<string, ListViewGroup>();
                foreach (ViewRow row in rows)
                {
                    if (query != "" && !row.Text.Has(query) && !row.Cells.Any(cell => cell.Has(query)) && !(row.Group ?? "").Has(query)) continue;
                    var item = new ListViewItem(row.Cells) { Tag = row, ForeColor = row.Warning ? Danger : Ink };
                    if (sort < 0 && !string.IsNullOrEmpty(row.Group))
                    {
                        ListViewGroup group;
                        if (!groups.TryGetValue(row.Group, out group))
                        {
                            group = new ListViewGroup(row.Group);
                            groups.Add(row.Group, group);
                            list.Groups.Add(group);
                        }
                        item.Group = group;
                    }
                    list.Items.Add(item);
                }
                if (list.Items.Count > 0) list.Items[0].Selected = true;
                string subtitle = "";
                if (page == 1 && collections != null)
                {
                    Row map = collections.Regions.FirstOrDefault(r => r.S("id") == Selected(region));
                    if (map != null) subtitle = map.S("name") + " · " + map.N("done") + "/" + map.N("total") + " 已收集";
                }
                if (page == 2 && collections != null) subtitle = collections.Items.Count(i => i.S("state") == "done") + "/" + collections.Items.Length + " 已收集";
                if (page == 4 && achievementPlans != null) subtitle = achievementPlans.Count(a => a.S("availability") == "done") + "/" + achievementPlans.Length + " 已解锁  ·  " +
                    achievementPlans.Count(a => a.S("availability") == "ready") + " 前置已满足  ·  " + achievementPlans.Count(a => a.S("availability") == "locked") + " 暂不可取";
                title.Text = Pages[page] + (subtitle == "" ? "" : "   /   " + subtitle);
            }
            finally { list.EndUpdate(); }
            ShowDetails();
        }
        void ShowDetails()
        {
            var selected = list.SelectedItems.Count == 0 ? null : list.SelectedItems[0].Tag as ViewRow;
            detail.Text = selected == null ? progress == null ? "正在等待存档数据。可按 F5 重新读取。" : "当前筛选没有条目。" : selected.Text +
                (page == 0 && selected.Achievement != null ? "\r\n\r\n双击列表条目查看关联成就。" :
                    (page == 3 || page == 4) && !string.IsNullOrEmpty(selected.Gate) ? "\r\n\r\n双击列表条目查看关联行前检查。" : "");
        }
        void FollowSelection()
        {
            var item = list.SelectedItems.Count == 0 ? null : list.SelectedItems[0].Tag as ViewRow;
            if (item == null) return;
            if (page == 0 && item.Achievement != null)
            {
                rememberedFilter[4] = "3";
                rememberedCategory[4] = "";
                rememberedSearch[4] = progress.Achievements.FirstOrDefault(a => a.S("id") == item.Achievement).S("name");
                nav.SelectedIndex = 4;
            }
            else if ((page == 3 || page == 4) && !string.IsNullOrEmpty(item.Gate))
            {
                rememberedFilter[0] = "3";
                rememberedSearch[0] = progress.Gates.FirstOrDefault(g => g.S("id") == item.Gate).S("name");
                nav.SelectedIndex = 0;
            }
            else if (page == 6) OpenLink(item.Cells[1]);
        }
        static void OpenLink(string url)
        {
            Uri uri;
            if (!Uri.TryCreate(url, UriKind.Absolute, out uri) || uri.Scheme != "https" && uri.Scheme != "http") return;
            try { Process.Start(new ProcessStartInfo(uri.AbsoluteUri) { UseShellExecute = true }); }
            catch (System.ComponentModel.Win32Exception error) { MessageBox.Show(error.Message, "打开攻略失败"); }
        }

        internal int[] CheckPages()
        {
            var result = new int[Pages.Length];
            for (int i = 0; i < Pages.Length; i++)
            {
                nav.SelectedIndex = i;
                result[i] = list.Items.Count;
            }
            nav.SelectedIndex = 0;
            return result;
        }
    }
}
