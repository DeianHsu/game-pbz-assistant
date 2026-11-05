using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using Microsoft.Win32;

namespace PBZ.Native
{
    internal static class GameDiscovery
    {
        static IEnumerable<string> Roots()
        {
            var roots = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            AddRegistryPath(roots, Registry.CurrentUser, @"Software\Valve\Steam", "SteamPath");
            AddRegistryPath(roots, Registry.LocalMachine, @"SOFTWARE\WOW6432Node\Valve\Steam", "InstallPath");
            roots.Add(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "Steam"));
            foreach (string root in roots.ToArray())
            {
                string libraries = Path.Combine(root, @"steamapps\libraryfolders.vdf");
                if (!File.Exists(libraries)) continue;
                foreach (Match match in Regex.Matches(File.ReadAllText(libraries), "\"path\"\\s*\"([^\"]+)\""))
                    roots.Add(match.Groups[1].Value.Replace("\\\\", "\\"));
            }
            return roots;
        }

        static void AddRegistryPath(HashSet<string> roots, RegistryKey hive, string path, string value)
        {
            try
            {
                using (RegistryKey key = hive.OpenSubKey(path))
                    if (key != null && key.GetValue(value) is string) roots.Add((string)key.GetValue(value));
            }
            catch (UnauthorizedAccessException) { }
            catch (System.Security.SecurityException) { }
        }

        public static string FindGame()
        {
            foreach (string root in Roots())
            {
                string manifest = Path.Combine(root, @"steamapps\appmanifest_4115450.acf");
                if (!File.Exists(manifest)) continue;
                string contents = File.ReadAllText(manifest);
                Match folder = Regex.Match(contents, "\"installdir\"\\s*\"([^\"]+)\"");
                Match build = Regex.Match(contents, "\"buildid\"\\s*\"([^\"]+)\"");
                if (!folder.Success) continue;
                string game = Path.Combine(root, "steamapps", "common", folder.Groups[1].Value);
                if (!File.Exists(Path.Combine(game, @"platform\steam\PBZ.exe"))) continue;
                if (!build.Success || (build.Groups[1].Value != "26266538" && build.Groups[1].Value != "26367565"))
                    throw new InvalidDataException("游戏版本未经验证，需要先适配存档与任务数据。");
                return game;
            }
            throw new DirectoryNotFoundException("没有找到 Steam 版影之刃零。");
        }

        public static string[] FindSaves(string game)
        {
            string root = Path.Combine(game, @"ProjectPBZ\Saved\SaveGames\Steam");
            if (!Directory.Exists(root)) throw new DirectoryNotFoundException("没有找到本地存档。请先在游戏内保存一次。");
            string[] files = Directory.GetDirectories(root).Select(dir => Path.Combine(dir, "PBZSaveGame.sav"))
                .Where(File.Exists).OrderByDescending(File.GetLastWriteTimeUtc).ToArray();
            if (files.Length == 0) throw new FileNotFoundException("没有找到本地存档。请先在游戏内保存一次。");
            return files;
        }
    }
}
