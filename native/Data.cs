using System;
using System.Collections.Generic;
using System.Linq;
using System.IO;
using System.Text;
using System.Web.Script.Serialization;
using Row = System.Collections.Generic.Dictionary<string, object>;

namespace PBZ.Native
{
    internal static class Data
    {
        public static object Get(this object obj, string key)
        {
            var row = obj as Row;
            object value;
            return row != null && key != null && row.TryGetValue(key, out value) ? value : null;
        }
        public static Row Dict(this object obj) { return obj as Row ?? new Row(); }
        public static object[] List(this object obj) { return obj as object[] ?? new object[0]; }
        public static string Str(this object obj) { return obj as string ?? ""; }
        public static string S(this object obj, string key) { return obj.Get(key).Str(); }
        public static bool Flag(this object obj, string key) { return Equals(obj.Get(key), true); }
        public static int Int(this object obj, int fallback = 0)
        {
            if (obj is int) return (int)obj;
            if (obj is long && (long)obj >= int.MinValue && (long)obj <= int.MaxValue) return (int)(long)obj;
            return fallback;
        }
        public static int N(this object obj, string key, int fallback = 0) { return obj.Get(key).Int(fallback); }
        public static Row[] Rows(this object obj, string key) { return obj.Get(key).List().OfType<Row>().ToArray(); }
        public static string[] Strings(this object obj, string key) { return obj.Get(key).List().OfType<string>().ToArray(); }
        public static Row Make(params object[] values)
        {
            var row = new Row();
            for (int i = 0; i < values.Length; i += 2) row.Add((string)values[i], values[i + 1]);
            return row;
        }
        public static Row With(this Row row, params object[] values)
        {
            var copy = new Row(row);
            for (int i = 0; i < values.Length; i += 2) copy[(string)values[i]] = values[i + 1];
            return copy;
        }
        public static string Or(this string value, string fallback) { return value.Length == 0 ? fallback : value; }
        public static bool Has(this string value, string part) { return value.IndexOf(part, StringComparison.OrdinalIgnoreCase) >= 0; }
        public static Row Parse(byte[] bytes)
        {
            var row = Serializer().DeserializeObject(new UTF8Encoding(false, true).GetString(bytes)) as Row;
            if (row == null) throw new InvalidDataException("数据不是有效的 JSON 对象。");
            return row;
        }
        public static JavaScriptSerializer Serializer()
        {
            return new JavaScriptSerializer { MaxJsonLength = 256 * 1024 * 1024, RecursionLimit = 256 };
        }
    }
}
