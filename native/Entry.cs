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
                        "warnings", resources.Warnings.ToArray());
                    summary["checks"] = accounts.Select(a => a.Slots.Select(slot => CheckSlot(resources, a, slot)).ToArray()).ToArray();
                    var first = new Progress(resources, accounts[0], accounts[0].Preferred);
                    var collections = new Collections(first);
                    using (var window = new Window())
                    {
                        window.ShowData(first, collections, new QuestNavigation(first, collections));
                        summary["pages"] = window.CheckPages();
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
            return Data.Make("slot", slot, "stage", p.Rank,
                "gates", p.Gates.Select(g => new object[] { g.S("id"), g.Flag("available"), g.Flag("passed"),
                    g.Rows("items").Select(i => new object[] { i.Flag("available"), i.Flag("satisfied"), i.S("state") }).ToArray() }).ToArray(),
                "regions", c.Regions.Select(r => new object[] { r.S("id"), r.N("done"), r.N("total"),
                    r.Rows("points").Select(pt => new[] { pt.S("key"), pt.S("name"), pt.S("state"), pt.Get("access").S("state") }).ToArray() }).ToArray(),
                "collectibles", c.Items.Select(i => new[] { i.S("key"), i.S("state"), i.Get("access").S("state") }).ToArray(),
                "achievements", p.Achievements.Select(a => new object[] { a.S("id"), a.S("state"), a.Get("progress").Get("value") }).ToArray(),
                "treasures", p.Treasures.Select(t => new object[] { t.S("branch"), t.Flag("handedIn"), t.Flag("collected") }).ToArray(),
                "quests", n.Quests.Select(q => new object[] { q.S("id"), q.S("state"), q.S("riskLevel"),
                    q.Rows("targets").Select(t => new[] { t.S("mapId"), t.S("person"), t.Get("access").S("state") }).ToArray() }).ToArray());
        }
    }
}
