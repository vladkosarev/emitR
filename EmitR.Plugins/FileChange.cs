using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EmitRLib.Plugins
{
    public static class FileChange
    {
        public const string EventName = "emitr.plugins.filechange";
        private static List<FileSystemWatcher> watchers = new List<FileSystemWatcher>();

        public static void Watch(IList<string> filePaths)
        {
            foreach (var filePath in filePaths)
            {
                var watcher = new FileSystemWatcher(Path.GetDirectoryName(filePath));
                watcher.Filter = Path.GetFileName(filePath);
                watcher.NotifyFilter = NotifyFilters.LastWrite;
                watcher.Changed += new FileSystemEventHandler(ChangeDetected);
                watcher.EnableRaisingEvents = true;
                watchers.Add(watcher);
            }
        }

        private static void ChangeDetected(object source, FileSystemEventArgs e)
        {
            EmitR.Emit(EventName, e.ChangeType.ToString(), e.Name);            
        }
    }
}
