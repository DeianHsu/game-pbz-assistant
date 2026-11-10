using System;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Windows.Forms;
using Row = System.Collections.Generic.Dictionary<string, object>;

namespace PBZ.Native
{
    [ComVisible(true)]
    [ClassInterface(ClassInterfaceType.AutoDispatch)]
    public sealed class Entry
    {
        public int Run()
        {
            string[] args = Environment.GetCommandLineArgs();
            bool diagnose = args.Length == 3 && args[1] == "--diagnose";
            try
            {
                Application.EnableVisualStyles();
                Application.SetCompatibleTextRenderingDefault(false);
                if (diagnose)
                {
                    string game = GameDiscovery.FindGame();
                    var accounts = GameDiscovery.FindSaves(game).Select(save => SaveReader.Read(game, save)).ToArray();
                    var resources = new Catalog(game);
                    var summary = Data.Make("accounts", accounts.Length, "slots", accounts.Sum(a => a.Slots.Length),
                        "quests", resources.Quests.Count, "items", resources.Items.Count, "maps", resources.Maps.Length,
                        "points", resources.Maps.Sum(m => m.Rows("points").Length), "achievements", resources.Achievements.Length,
                        "scenePickups", resources.ScenePickups.Length,
                        "warnings", resources.Warnings.ToArray());
                    summary["checks"] = accounts.Select(a => a.Slots.Select(slot => CheckSlot(resources, a, slot)).ToArray()).ToArray();
                    var first = new Progress(resources, accounts[0], accounts[0].Preferred);
                    var collections = new Collections(first);
                    using (var window = new Window())
                    {
                        window.ShowData(first, collections, new QuestNavigation(first, collections));
                        summary["pages"] = window.CheckPages();
                        summary["filteredPages"] = Data.Make("slot", accounts[0].Preferred, "tempering", window.CheckPageFilter(2, 4),
                            "questArchive", window.CheckPageFilter(3, 6));
                    }
                    File.WriteAllText(args[2], Data.Serializer().Serialize(summary));
                    return 0;
                }
                Application.Run(new Window());
                return 0;
            }
            catch (Exception error)
            {
                if (diagnose) File.WriteAllText(args[2], Data.Serializer().Serialize(Data.Make("error", error.ToString())));
                else MessageBox.Show(error.Message, "影之刃零 · 行前检查", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return 1;
            }
        }
        static Row CheckSlot(Catalog catalog, Account account, string slot)
        {
            var p = new Progress(catalog, account, slot);
            var c = new Collections(p);
            var n = new QuestNavigation(p, c);
            return Data.Make("slot", slot, "stage", p.Rank, "cycle", p.Cycle,
                "baiXueStep", new[] { p.BaiXueStep.S("id"), p.BaiXueStep.S("title"), p.BaiXueStep.S("bell") },
                "gates", p.Gates.Select(g => new object[] { g.S("id"), g.Flag("available"), g.Flag("passed"),
                    g.Rows("items").Select(i => new object[] { i.Flag("available"), i.Flag("satisfied"), i.S("state") }).ToArray() }).ToArray(),
                "questFailures", p.QuestFailures.Values.Select(q => new[] { q.S("id"), q.S("state"), q.Get("failure").S("reason"), q.Get("failure").S("evidence") }).ToArray(),
                "regions", c.Regions.Select(r => new object[] { r.S("id"), r.N("done"), r.N("total"),
                    r.Rows("points").Select(pt => new[] { pt.S("key"), pt.S("name"), pt.S("state"), pt.Get("access").S("state") }).ToArray() }).ToArray(),
                "collectibles", c.Items.Where(i => i.Get("pickupCategories") == null)
                    .Select(i => new[] { i.S("key"), i.S("state"), i.Get("access").S("state") }).ToArray(),
                "tempering", c.Items.Where(i => i.Get("temper") != null).Select(i =>
                {
                    var temper = i.Get("temper");
                    return new object[] { i.S("key"), temper.S("state"), temper.S("material"), temper.S("form"), temper.Strings("regionIds"), temper.S("bell"), temper.Strings("steps") };
                }).ToArray(),
                "pickupPoints", c.Items.Where(i => i.Get("pickupCategories") != null)
                    .Select(i =>
                    {
                        var layers = i.Get("layers") as SceneLayers.Layer[];
                        return new object[] { i.S("actor"), i.S("state"), i.Strings("pickupCategories"), i.Strings("regionIds"),
                            i.S("bell"), i.S("pickupType"), i.S("moneyText"), i.S("materialsText"), i.S("lootRow"),
                            i.Get("access").S("state"), i.Get("access").S("reason"), i.Flag("available"), i.Get("flow").S("id"),
                            layers == null ? null : layers.Select(layer => layer.Name).ToArray() };
                    }).ToArray(),
                "achievements", p.Achievements.Select(a => new object[] { a.S("id"), a.S("state"), a.Get("progress").Get("value") }).ToArray(),
                "achievementPlans", new AchievementPlan(p, c, n).Rows.Select(a => new object[] { a.S("id"), a.S("availability"), a.S("availabilityLabel"),
                    a.S("availabilityReason"), a.Strings("steps"), a.Strings("notes"), ObjectiveChecks(a) }).ToArray(),
                "questObjectives", n.Quests.Where(q => q.Rows("objectives").Length > 0).Select(q => new object[] { q.S("id"), ObjectiveChecks(q) }).ToArray(),
                "treasures", p.Treasures.Select(t => new object[] { t.S("branch"), t.Flag("handedIn"), t.Flag("collected") }).ToArray(),
                "questOffers", n.Quests.Where(q => q.Flag("canAccept")).Select(q =>
                {
                    Row target = q.Rows("targets").Single();
                    return new[] { q.S("id"), q.S("stateLabel"), target.S("area"), target.S("person"), target.S("place"), target.S("bell"), target.S("next") };
                }).ToArray(),
                "quests", n.Quests.Select(q => new object[] { q.S("id"), q.S("state"), q.S("riskLevel"),
                    q.Rows("targets").Select(t => new[] { t.S("mapId"), t.S("person"), t.Get("access").S("state") }).ToArray(),
                    q.S("stateLabel"), q.S("catalogNote") }).ToArray());
        }
        static object[][] ObjectiveChecks(Row row)
        {
            return row.Rows("objectives").Select(o => new[] { o.Get("name"), o.Get("value") }).ToArray();
        }
    }
}
