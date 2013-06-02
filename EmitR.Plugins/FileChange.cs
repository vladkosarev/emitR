using System.Collections.Generic;
using System.IO;

namespace EmitRLib.Plugins
{
    public static class FileChange
    {
        public const string EventName = "emitr.plugins.filechange";
        private static readonly List<FileSystemWatcher> Watchers = new List<FileSystemWatcher>();

        public static void Watch(IList<string> filePaths)
        {
            foreach (var filePath in filePaths)
            {
                var directoryName = Path.GetDirectoryName(filePath);
                if (directoryName == null) continue;
                var watcher = new FileSystemWatcher(directoryName)
                    {
                        Filter = Path.GetFileName(filePath),
                        NotifyFilter = NotifyFilters.LastWrite
                    };
                watcher.Changed += ChangeDetected;
                watcher.EnableRaisingEvents = true;
                Watchers.Add(watcher);
            }
        }

        private static void ChangeDetected(object source, FileSystemEventArgs e)
        {
            EmitR.Emit(EventName, e.ChangeType.ToString(), e.Name);
        }
    }
}
